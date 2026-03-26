import path from 'node:path';

// --- Path getters ---

export function getUpstreamRoot() {
  const dir = process.env.HINDSIGHT_UPSTREAM_DIR;
  if (!dir) throw new Error('HINDSIGHT_UPSTREAM_DIR is not set');
  return dir;
}

export function getKbDataDir() {
  return process.env.KB_DATA_DIR ?? path.join(process.cwd(), 'data', 'kb');
}

export function getDbPath() {
  return path.join(getKbDataDir(), 'hindsight-kb.db');
}

export function getLogDir() {
  return path.join(getKbDataDir(), 'logs');
}

// --- Embedding config ---

export const EMBEDDING_MODEL = process.env.EMBEDDING_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_PROVIDER = process.env.EMBEDDING_PROVIDER ?? 'local';
export const LOCAL_MODEL = process.env.LOCAL_MODEL ?? 'Xenova/all-MiniLM-L6-v2';
export const EMBEDDING_DIMS = parseInt(process.env.EMBEDDING_DIMS ?? '384', 10);
export const CHUNK_MAX_CHARS = 1600;
export const CHUNK_OVERLAP_CHARS = 200;
export const EMBEDDING_BATCH_SIZE = 50;
export const EMBEDDING_API_URL = process.env.EMBEDDING_API_URL ?? 'http://localhost:11434/api/embeddings';
export const MAX_EMBEDDING_SAFE_CHARS = 6000;

// --- Search weights ---

export const VECTOR_WEIGHT = 0.7;
export const TEXT_WEIGHT = 0.3;

// --- Sources ---

export const SOURCES = [
  // Phase 1
  {
    name: 'docs',
    globs: ['hindsight-docs/docs/**/*.md'],
    exclude: ['**/node_modules/**'],
  },
  {
    name: 'engine',
    globs: ['hindsight-api-slim/hindsight_api/**/*.py'],
    exclude: ['**/__pycache__/**', '**/*.pyc'],
  },
  {
    name: 'integrations',
    globs: [
      'hindsight-integrations/**/*.ts',
      'hindsight-integrations/**/*.py',
      'hindsight-integrations/**/*.md',
    ],
    exclude: ['**/node_modules/**', '**/dist/**', '**/__pycache__/**', '**/*.min.js', '**/*.bundle.js'],
  },
  {
    name: 'go-client',
    globs: ['hindsight-clients/go/**/*.go'],
    exclude: ['**/*_test.go'],
  },
  // Phase 2
  {
    name: 'tests',
    phase: 2,
    globs: ['hindsight-api-slim/tests/**/*.py'],
    exclude: ['**/__pycache__/**', '**/*.pyc'],
  },
  {
    name: 'control-plane',
    phase: 2,
    globs: ['hindsight-control-plane/src/**/*.ts', 'hindsight-control-plane/src/**/*.tsx'],
    exclude: ['**/node_modules/**', '**/.next/**'],
  },
  {
    name: 'skills',
    phase: 2,
    globs: ['skills/**/*.md'],
    exclude: [],
  },
  {
    name: 'cookbook',
    phase: 2,
    globs: ['cookbook/**/*.md', 'cookbook/**/*.py', 'cookbook/**/*.ts'],
    exclude: ['**/node_modules/**', '**/__pycache__/**'],
  },
];

// --- Phase gating ---

export function getExtraSources() {
  const raw = process.env.KB_EXTRA_SOURCES ?? '';
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

export function getActiveSources(extraSources) {
  return SOURCES.filter(s => !s.phase || extraSources.includes(s.name));
}
