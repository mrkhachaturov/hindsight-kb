import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { formatJsonOutput } from '../commands/query.js';

describe('formatJsonOutput', () => {
  it('produces parseable JSON with query and results', () => {
    const result = {
      score: 0.5, path: 'engine/memory.py', startLine: 1, endLine: 10,
      source: 'engine', contentType: 'code', language: 'python',
      category: 'core', text: 'some code here',
    };
    const output = formatJsonOutput('retain memory', [result]);
    const parsed = JSON.parse(output);
    assert.strictEqual(parsed.query, 'retain memory');
    assert.strictEqual(parsed.results.length, 1);
    assert.strictEqual(parsed.results[0].source, 'engine');
  });

  it('includes relatedCode when provided', () => {
    const doc = { score: 0.6, path: 'docs/guide.md', startLine: 1, endLine: 5, source: 'docs', contentType: 'docs', language: 'markdown', category: 'documentation', text: 'doc text' };
    const code = { score: 0.4, path: 'engine/retain.py', startLine: 10, endLine: 20, source: 'engine', contentType: 'code', language: 'python', category: 'core', text: 'code text' };
    const parsed = JSON.parse(formatJsonOutput('retain', [doc], [code]));
    assert.ok(parsed.relatedCode);
    assert.strictEqual(parsed.relatedCode.length, 1);
  });
});
