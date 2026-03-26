import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { formatChangelogMarkdown } from '../lib/release-parser.js';

describe('formatChangelogMarkdown', () => {
  it('formats release with all categories', () => {
    const md = formatChangelogMarkdown({
      tag: 'v0.4.20', date: '2026-03-20T00:00:00Z',
      previous_tag: 'v0.4.19', commits_count: 10,
      changelog: {
        security: [], breaking: [],
        features: ['feat: add multi-bank recall'],
        fixes: ['fix: entity linking timeout'],
        other: ['chore: bump deps'],
      },
      kb_files_changed: 8, kb_impact: 'medium',
    });

    assert.ok(md.includes('Release v0.4.20'));
    assert.ok(md.includes('10 commits since v0.4.19'));
    assert.ok(md.includes('feat: add multi-bank recall'));
    assert.ok(md.includes('fix: entity linking timeout'));
    assert.ok(md.includes('8 KB-relevant files changed'));
  });

  it('respects embedding size limit', () => {
    const bigChangelog = {
      security: [], breaking: [],
      features: Array.from({ length: 500 }, (_, i) => `feat: feature ${i}`),
      fixes: [], other: [],
    };
    const md = formatChangelogMarkdown({
      tag: 'v0.4.20', date: '2026-03-20T00:00:00Z',
      previous_tag: null, commits_count: 500,
      changelog: bigChangelog,
      kb_files_changed: 0, kb_impact: 'unknown',
    });
    assert.ok(md.length <= 6000);
  });
});
