# hindsight-kb

Vector knowledge base for [Hindsight](https://hindsight.so) upstream. Indexes docs, engine source, integrations, and Go client into SQLite with hybrid vector + keyword search. Exposes an MCP server so AI agents can search Hindsight internals during Hindclaw development.

## What It Indexes

Phase 1 (always active):

- **docs** — Hindsight documentation (`hindsight-docs/docs/`)
- **engine** — Python API source (`hindsight-api-slim/`)
- **integrations** — TypeScript and Python integration code (`hindsight-integrations/`)
- **go-client** — Go client source (`hindsight-clients/go/`)

Phase 2 (opt-in via `KB_EXTRA_SOURCES`):

- **tests** — Python test suite
- **control-plane** — React/Next.js UI source
- **skills** — Skill markdown files
- **cookbook** — Cookbook examples

## Installation

```bash
npm install -g hindsight-kb
```

Requires Node.js 22+.

## Quick Start

```bash
# Set the upstream checkout location
export HINDSIGHT_UPSTREAM_DIR=/path/to/hindsight-upstream
export KB_DATA_DIR=/path/to/data

# Index the upstream (local ONNX embeddings, no API key needed)
hindsight-kb index

# Or with OpenAI embeddings
export OPENAI_API_KEY=sk-...
export KB_EMBEDDING_PROVIDER=openai
hindsight-kb index

# Search
hindsight-kb query "retention policy enforcement"
hindsight-kb docs "how banks work"
hindsight-kb code "ValidationResult"
```

## CLI Reference

### Search

```bash
hindsight-kb query <text> [options]
```

Options:

| Flag | Description |
|------|-------------|
| `--docs` | Filter to documentation |
| `--code` | Filter to engine source code |
| `--tests` | Filter to test files |
| `--integrations` | Filter to integrations source |
| `--ui` | Filter to control-plane UI source |
| `--go` | Filter to Go client source |
| `--releases` | Filter to release notes |
| `--verify` | Two-pass: docs then related code |
| `--json` | JSON output |
| `--top <n>` | Number of results (default: 8) |
| `--offline` | FTS-only, no API key needed |

Shortcut aliases:

```bash
hindsight-kb docs <text>     # --docs
hindsight-kb code <text>     # --code
hindsight-kb tests <text>    # --tests
hindsight-kb verify <text>   # --verify --docs
```

### Indexing

```bash
hindsight-kb index [--force] [--release <tag>] [--extra-sources <list>]
```

- `--force` — re-index all files regardless of content hash
- `--release <tag>` — associate chunks with this version tag (auto-detected from git if omitted)
- `--extra-sources <list>` — comma-separated phase 2 sources to include: `tests,control-plane,skills,cookbook`

### Sync

```bash
hindsight-kb sync [--upstream-dir <path>] [--data-dir <path>]
```

Advisory only — checks for new upstream tags and tells you what to run. Does not modify the upstream checkout.

### Release Tracking

```bash
hindsight-kb latest          # current indexed release
hindsight-kb history         # last 10 releases
hindsight-kb since <version> # what changed since a version
```

### Service

```bash
hindsight-kb install-service [--interval 2h] [--env-file <path>] [--upstream-dir <path>] [--data-dir <path>]
```

Generates and installs a systemd (Linux) or launchd (macOS) service that runs `sync` on a schedule.

### MCP Server

```bash
hindsight-kb mcp-serve
```

Starts an MCP server on stdio. 9 tools: `search`, `search_docs`, `search_code`, `search_tests`, `search_integrations`, `get_stats`, `get_latest`, `get_history`, `get_since`.

## MCP Configuration

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "hindsight-kb": {
      "command": "hindsight-kb",
      "args": ["mcp-serve"],
      "env": {
        "KB_DATA_DIR": "/absolute/path/to/data",
        "HINDSIGHT_UPSTREAM_DIR": "/absolute/path/to/hindsight-upstream",
        "KB_EMBEDDING_PROVIDER": "openai",
        "OPENAI_API_KEY": "sk-..."
      }
    }
  }
}
```

Always use absolute paths in the MCP `env` block. Some MCP hosts do not inherit the shell environment.

## Environment Variables

| Variable | Default | Notes |
|----------|---------|-------|
| `HINDSIGHT_UPSTREAM_DIR` | required | Hindsight upstream monorepo checkout |
| `KB_DATA_DIR` | `./data/kb` | SQLite DB and log directory |
| `OPENAI_API_KEY` | — | Required when `KB_EMBEDDING_PROVIDER=openai` |
| `KB_EMBEDDING_PROVIDER` | `local` | `openai` or `local` (ONNX) |
| `KB_EMBEDDING_MODEL` | `text-embedding-3-small` | OpenAI embedding model |
| `KB_LOCAL_MODEL` | `Xenova/all-MiniLM-L6-v2` | ONNX model |
| `KB_LOG_DIR` | `$KB_DATA_DIR/logs` | Override log path |
| `KB_EXTRA_SOURCES` | `` | Comma-separated phase 2 sources to activate |

## License

MIT
