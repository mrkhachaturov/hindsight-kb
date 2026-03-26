# CLAUDE.md — hindsight-kb

## Project

Self-updating vector knowledge base for Hindsight upstream. Indexes docs, engine source (Python), integrations (TypeScript/Python), and Go client code into a SQLite vector DB with hybrid search (vector + keyword + RRF fusion). Exposes an MCP server for native AI tool integration, letting agents search Hindsight internals when developing Hindclaw.

## Stack

- Node.js 22+ (ESM, `"type": "module"`)
- SQLite with sqlite-vec extension for vector similarity
- FTS5 for keyword matching
- commander v14 for CLI
- @modelcontextprotocol/sdk for MCP server (stdio transport)
- @huggingface/transformers (optional, for local ONNX embeddings)

## Setup

```bash
npm install
```

## Structure

```
bin/cli.js              # CLI entry point (commander)
commands/*.js           # Subcommands (each exports register + handler)
commands/mcp-serve.js   # MCP server — imports from lib/ directly (not handlers)
lib/config.js           # Config with getter functions for CLI overrides
lib/embedder.js         # Provider abstraction (OpenAI + local ONNX)
lib/chunker.js          # Text chunking (Python/Go/TypeScript-aware, semantic boundaries)
lib/db.js               # SQLite operations, hybrid search
lib/synonyms.js         # Query expansion (Hindsight-specific synonyms)
lib/release-parser.js   # Release metadata extraction from git tags
lib/exit-codes.js       # Exit code constants (0/1/2/3)
tests/*.test.js         # Node built-in test runner
```

## Key Patterns

- **Config getters**: `getUpstreamRoot()`, `getDbPath()`, `getLogDir()` — read env vars on demand so CLI `--upstream-dir` / `--data-dir` overrides work after module load. Defaults: `getUpstreamRoot()` → `./source`, `getKbDataDir()` → `./data`.
- **Static exports**: `EMBEDDING_PROVIDER`, `EMBEDDING_MODEL`, etc. exist for simple access, but commands that accept CLI overrides must use the getter functions.
- **Command pattern**: each `commands/*.js` exports `register(program)` for commander and `handler(options)` for standalone/programmatic use.
- **MCP server**: `commands/mcp-serve.js` does NOT call handler() functions (they call process.exit). Instead it imports directly from `lib/` and returns structured MCP responses.
- **Exit codes**: 0=success, 1=runtime error, 2=config error, 3=no results (in `lib/exit-codes.js`).
- **Embedding provider**: `KB_EMBEDDING_PROVIDER=openai|local` — embedder.js dispatches transparently. Default is `openai`.
- **Phase gating**: Sources are split into phase 1 (always active) and phase 2 (opt-in via `KB_EXTRA_SOURCES`). `getActiveSources()` filters accordingly. Phase 2 sources: `tests`, `control-plane`, `skills`, `cookbook`.
- **Version**: never hardcode — always read from package.json at runtime.

## Sources

Phase 1 (always indexed):

| Source | Paths |
|--------|-------|
| `docs` | `hindsight-docs/docs/**/*.md` |
| `engine` | `hindsight-api-slim/hindsight_api/**/*.py` |
| `integrations` | `hindsight-integrations/**/*.{ts,py,md}` |
| `go-client` | `hindsight-clients/go/**/*.go` (excludes `*_test.go`) |

Phase 2 (opt-in via `KB_EXTRA_SOURCES`):

| Source | Paths |
|--------|-------|
| `tests` | `hindsight-api-slim/tests/**/*.py` |
| `control-plane` | `hindsight-control-plane/src/**/*.{ts,tsx}` |
| `skills` | `skills/**/*.md` |
| `cookbook` | `cookbook/**/*.{md,py,ts}` |

## CLI Commands

```bash
hindsight-kb query <text...> [--docs|--code|--tests|--integrations|--ui|--go|--releases|--verify] [--json] [--top N] [--offline]
hindsight-kb docs|code|tests|verify <text>   # short aliases
hindsight-kb index [--force] [--release <tag>] [--extra-sources <list>]
hindsight-kb sync [--upstream-dir <path>] [--data-dir <path>]
hindsight-kb stats
hindsight-kb latest
hindsight-kb history
hindsight-kb since <version>
hindsight-kb install-service [--interval 2h] [--env-file <path>] [--upstream-dir <path>] [--data-dir <path>]
hindsight-kb mcp-serve                        # start MCP server (stdio)
```

Query filter flags:

| Flag | Filters to |
|------|-----------|
| `--docs` | `contentType=docs` |
| `--code` | `contentType=code` |
| `--tests` | `contentType=test` |
| `--integrations` | `source=integrations` |
| `--ui` | `source=control-plane` |
| `--go` | `source=go-client` |
| `--releases` | `source=releases` |
| `--verify` | Two-pass: docs then related code |

`--extra-sources` on `index` accepts a comma-separated list of phase 2 source names: `tests,control-plane,skills,cookbook`. Alternatively, set `KB_EXTRA_SOURCES` to activate globally.

## MCP Server

9 read-only tools over stdio transport:

| Tool | Description |
|------|-------------|
| `search` | Hybrid search with mode, top, offline params |
| `search_docs` | Docs-only shortcut |
| `search_code` | Engine source code shortcut |
| `search_tests` | Test files shortcut (phase 2) |
| `search_integrations` | Integrations source shortcut |
| `get_stats` | DB statistics |
| `get_latest` | Current indexed Hindsight release |
| `get_history` | Last 10 indexed releases |
| `get_since` | Chunks indexed since a given version |

`search` mode values: `docs`, `code`, `tests`, `integrations`, `ui`, `go`, `releases`, `verify`.

Consumer config (`.mcp.json`):
```json
{
  "mcpServers": {
    "hindsight-kb": {
      "command": "hindsight-kb",
      "args": ["mcp-serve"],
      "env": {
        "KB_DATA_DIR": "/path/to/data",
        "HINDSIGHT_UPSTREAM_DIR": "/path/to/hindsight-upstream"
      }
    }
  }
}
```

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `HINDSIGHT_UPSTREAM_DIR` | `./source` | Hindsight upstream git checkout |
| `KB_DATA_DIR` | `./data` | SQLite DB + logs |
| `OPENAI_API_KEY` | required | For openai embedding provider |
| `KB_EMBEDDING_PROVIDER` | `openai` | `local` for ONNX |
| `KB_EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI model |
| `KB_LOCAL_MODEL` | `all-MiniLM-L6-v2` | ONNX model |
| `KB_LOG_DIR` | `$KB_DATA_DIR/log` | Override log path |
| `KB_EXTRA_SOURCES` | `` | Comma-separated phase 2 sources to activate globally |

## Testing

```bash
node --test tests/*.test.js
```

Smoke tests without an API key:

```bash
node bin/cli.js --version
node bin/cli.js stats
node bin/cli.js query "retention" --offline
```

## Publishing

Trusted publisher via OIDC — no npm token needed. Push a `v*` tag after updating `package.json` and `CHANGELOG.md`:

```bash
git tag v1.0.1
git push origin main --tags
```

GitHub Actions (Node 22) runs `npm publish` with automatic OIDC auth and provenance.

## MCP Environment Note

When configuring `hindsight-kb` as an MCP server, explicitly pass `KB_DATA_DIR` and `HINDSIGHT_UPSTREAM_DIR` in the MCP server `env`. Some MCP hosts do not inherit the shell environment, and the server can otherwise attach to the wrong database or upstream checkout.
