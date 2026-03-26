import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Getter functions (read env at call time, so CLI overrides work after import) ---

export function getUpstreamRoot() {
  return process.env.HINDSIGHT_UPSTREAM_DIR
    ? resolve(process.env.HINDSIGHT_UPSTREAM_DIR)
    : resolve(join(__dirname, '..', 'source'));
}

export function getKbDataDir() {
  return process.env.KB_DATA_DIR
    ? resolve(process.env.KB_DATA_DIR)
    : resolve(join(__dirname, '..', 'data'));
}

export function getDbPath() {
  return join(getKbDataDir(), 'hindsight.db');
}

export function getLogDir() {
  return process.env.KB_LOG_DIR
    ? resolve(process.env.KB_LOG_DIR)
    : join(getKbDataDir(), 'log');
}

// --- Embedding config ---

export const EMBEDDING_MODEL = process.env.KB_EMBEDDING_MODEL || 'text-embedding-3-small';
export const EMBEDDING_PROVIDER = process.env.KB_EMBEDDING_PROVIDER || 'openai';
export const LOCAL_MODEL = process.env.KB_LOCAL_MODEL || 'all-MiniLM-L6-v2';

function getEmbeddingDims(model) {
  const dims = {
    'text-embedding-3-small': 1536,
    'text-embedding-3-large': 3072,
    'nomic-embed-text-v2': 768,
    'all-MiniLM-L6-v2': 384,
  };
  return dims[model] || 1536;
}

export const EMBEDDING_DIMS = EMBEDDING_PROVIDER === 'local'
  ? getEmbeddingDims(LOCAL_MODEL)
  : getEmbeddingDims(EMBEDDING_MODEL);

export const CHUNK_MAX_CHARS = 1600;
export const CHUNK_OVERLAP_CHARS = 200;
export const EMBEDDING_BATCH_SIZE = 50;
export const EMBEDDING_API_URL = 'https://api.openai.com/v1/embeddings';
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

export function getActiveSources(extraSources = null) {
  const extras = extraSources || getExtraSources();
  return SOURCES.filter(s => !s.phase || extras.includes(s.name));
}
