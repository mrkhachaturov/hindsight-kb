# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.0.0] - 2026-03-26

### Added
- Initial release: vector knowledge base for Hindsight upstream
- SQLite + sqlite-vec for vector similarity, FTS5 for keyword matching
- RRF fusion combining vector + keyword signals
- Python/Go/TypeScript-aware chunking with language-specific boundary detection
- Phase-gated sources: phase 1 (docs, engine, integrations, go-client), phase 2 opt-in
- 9 MCP tools over stdio transport
- Hindsight-specific synonym expansion
- Advisory-only sync (checks for new upstream tags without modifying checkout)
- Release tracking with upstream tag date ordering
- CLI with 13 subcommands
- OpenAI and local ONNX embedding providers
- systemd/launchd service generation
- GitHub Actions OIDC publishing
