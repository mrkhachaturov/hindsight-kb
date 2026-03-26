import { describe, it, beforeEach, afterEach } from 'node:test';
import { strict as assert } from 'node:assert';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('db', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'hkb-test-'));
    process.env.KB_DATA_DIR = tmpDir;
  });

  afterEach(async () => {
    const { closeDb } = await import('../lib/db.js');
    closeDb();
    rmSync(tmpDir, { recursive: true, force: true });
    delete process.env.KB_DATA_DIR;
  });

  it('opens DB respecting KB_DATA_DIR', async () => {
    const { openDb, getStats } = await import('../lib/db.js');
    openDb();
    const stats = getStats();
    assert.strictEqual(stats.files, 0);
    assert.strictEqual(stats.chunks, 0);
  });

  it('release ordering uses release_date not indexed_at', async () => {
    const { openDb, insertRelease, getReleaseHistory } = await import('../lib/db.js');
    openDb();

    insertRelease({
      tag: 'v0.4.20', date: '2026-03-20', release_date: '2026-03-20',
      commit_hash: 'abc', commits_count: 5,
    });
    insertRelease({
      tag: 'v0.4.18', date: '2026-03-18', release_date: '2026-03-18',
      commit_hash: 'def', commits_count: 3,
    });

    const history = getReleaseHistory(10);
    assert.strictEqual(history[0].tag, 'v0.4.20');
    assert.strictEqual(history[1].tag, 'v0.4.18');
  });
});
