/**
 * sync command — checks for new upstream Hindsight tags (advisory only, no checkout).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, appendFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { getUpstreamRoot, getLogDir } from '../lib/config.js';
import { EXIT_SUCCESS, EXIT_RUNTIME_ERROR, EXIT_CONFIG_ERROR } from '../lib/exit-codes.js';
import { openDb, getCurrentIndexedRelease, closeDb } from '../lib/db.js';

const KB_PREFIXES = /^(hindsight-docs\/docs\/|hindsight-api-slim\/|hindsight-integrations\/|hindsight-control-plane\/src\/|skills\/|cookbook\/|hindsight-clients\/go\/)/;

export function register(program) {
  program
    .command('sync')
    .description('Check for new upstream Hindsight releases (advisory only)')
    .option('--upstream-dir <path>', 'Override HINDSIGHT_UPSTREAM_DIR')
    .option('--data-dir <path>', 'Override KB_DATA_DIR')
    .action((opts) => handler(opts));
}

export async function handler(opts = {}) {
  if (opts.upstreamDir) process.env.HINDSIGHT_UPSTREAM_DIR = resolve(opts.upstreamDir);
  if (opts.dataDir) process.env.KB_DATA_DIR = resolve(opts.dataDir);

  const upstreamDir = getUpstreamRoot();
  const logDir = getLogDir();
  const syncLog = join(logDir, 'sync.log');
  mkdirSync(logDir, { recursive: true });

  function log(msg) {
    const ts = new Date().toISOString();
    appendFileSync(syncLog, `${ts} | ${msg}\n`);
  }

  if (!existsSync(upstreamDir)) {
    console.error(`Error: Upstream directory not found: ${upstreamDir}`);
    process.exit(EXIT_CONFIG_ERROR);
  }
  if (!existsSync(join(upstreamDir, '.git'))) {
    console.error(`Error: ${upstreamDir} is not a git repository`);
    process.exit(EXIT_CONFIG_ERROR);
  }

  const git = (args) => execFileSync('git', args, { cwd: upstreamDir, encoding: 'utf-8' }).trim();

  try {
    console.log('[sync] Fetching upstream tags...');
    execFileSync('git', ['fetch', 'upstream', '--tags', '--quiet'], { cwd: upstreamDir });

    const tags = git(['tag', '--list', 'v0.*', '--sort=-v:refname']);
    const latestTag = tags.split('\n')[0];
    if (!latestTag) {
      console.error('[sync] No v0.* tags found');
      process.exit(EXIT_RUNTIME_ERROR);
    }
    console.log(`[sync] Latest upstream release: ${latestTag}`);

    openDb();
    const current = getCurrentIndexedRelease();
    closeDb();

    const currentTag = current ? current.tag : 'none';
    console.log(`[sync] Currently indexed: ${currentTag}`);

    if (currentTag === latestTag) {
      console.log(`[sync] Already on latest release (${latestTag})`);
      log(`up-to-date: ${latestTag}`);
      process.exit(EXIT_SUCCESS);
    }

    let relevantCount = 0;
    if (currentTag !== 'none') {
      try {
        const changed = git(['diff', '--name-only', `${currentTag}..${latestTag}`]);
        relevantCount = changed.split('\n').filter(f => f && KB_PREFIXES.test(f)).length;
      } catch { relevantCount = -1; }
    }

    console.log(`\n[sync] New upstream release ${latestTag} available (currently indexed: ${currentTag})`);
    if (relevantCount > 0) console.log(`[sync] ${relevantCount} KB-relevant file(s) changed`);
    console.log(`\nTo update:`);
    console.log(`  cd ${upstreamDir} && git checkout ${latestTag}`);
    console.log(`  hindsight-kb index --release ${latestTag}`);

    log(`available: ${currentTag} → ${latestTag} | ${relevantCount} KB files`);
    process.exit(EXIT_SUCCESS);
  } catch (err) {
    console.error('[sync] Error:', err.message);
    log(`ERROR: ${err.message}`);
    process.exit(EXIT_RUNTIME_ERROR);
  }
}
