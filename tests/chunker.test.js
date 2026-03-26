import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { chunkFile, chunkChangelog } from '../lib/chunker.js';

describe('chunkFile', () => {
  it('detects Python function boundaries', () => {
    const content = Array.from({ length: 30 }, (_, i) =>
      `def function_${i}(arg):\n    """Docstring for ${i}."""\n    value = ${i} * 2\n    result = value + ${i}\n    return result\n`
    ).join('\n');
    const chunks = chunkFile(content, 'engine/memory_engine.py', 'engine');
    assert.ok(chunks.length > 1, 'should split into multiple chunks');
    assert.strictEqual(chunks[0].contentType, 'code');
    assert.strictEqual(chunks[0].language, 'python');
    assert.strictEqual(chunks[0].category, 'core');
  });

  it('marks test files as contentType test', () => {
    const content = 'def test_something():\n    assert True\n';
    const chunks = chunkFile(content, 'tests/test_recall.py', 'tests');
    assert.strictEqual(chunks[0].contentType, 'test');
    assert.strictEqual(chunks[0].category, 'tests');
  });

  it('handles Go source', () => {
    const content = 'package main\n\nfunc main() {\n}\n';
    const chunks = chunkFile(content, 'client.go', 'go-client');
    assert.strictEqual(chunks[0].language, 'go');
    assert.strictEqual(chunks[0].contentType, 'code');
    assert.strictEqual(chunks[0].category, 'sdk');
  });

  it('handles markdown docs', () => {
    const content = '# Title\n\nSome documentation.\n';
    const chunks = chunkFile(content, 'docs/guide.md', 'docs');
    assert.strictEqual(chunks[0].contentType, 'docs');
    assert.strictEqual(chunks[0].language, 'markdown');
    assert.strictEqual(chunks[0].category, 'documentation');
  });
});

describe('chunkChangelog', () => {
  it('keeps only 3 most recent versions', () => {
    const versions = Array.from({ length: 10 }, (_, i) =>
      `## [0.4.${10 - i}] - 2026-03-${String(10 - i).padStart(2, '0')}\n\n- Change ${i}\n`
    ).join('\n');
    const content = `# Changelog\n\n${versions}`;
    const chunks = chunkChangelog(content, 'CHANGELOG.md', 'docs');
    const versionChunks = chunks.filter(c => c.version && c.version !== 'unreleased');
    assert.ok(versionChunks.length <= 3, `expected <= 3 versions, got ${versionChunks.length}`);
  });
});
