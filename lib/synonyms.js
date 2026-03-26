/**
 * Hindsight-specific synonym map for query expansion.
 */
export const SYNONYMS = {
  // Core operations
  'retain': ['store', 'ingest', 'save memory', 'memorize'],
  'recall': ['retrieve', 'search', 'query memory', 'remember'],
  'reflect': ['reason', 'disposition', 'think', 'analyze'],
  'consolidation': ['mental model', 'observation', 'synthesis'],

  // Architecture
  'bank': ['memory bank', 'domain'],
  'entity': ['entity linking', 'entity resolution', 'entity extraction'],
  'extension': ['tenant', 'validator', 'http extension', 'plugin'],
  'tenant': ['extension', 'auth', 'identity'],
  'validator': ['extension', 'access control', 'authorization'],

  // Search strategies
  'mpfp': ['multi-path fact propagation'],
  'tempr': ['retrieval strategy', 'search strategy'],
  'rrf': ['reciprocal rank fusion', 'rank fusion'],
  'reranker': ['cross-encoder', 'reranking'],

  // Configuration
  'config': ['configuration', 'settings', 'hierarchical config'],
  'configuration': ['config', 'settings'],
  'disposition': ['personality', 'traits', 'skepticism', 'empathy'],

  // Events
  'webhook': ['event', 'notification', 'callback'],
  'directive': ['instruction', 'system prompt'],

  // Memory types
  'fact': ['world fact', 'experience fact', 'knowledge'],
  'observation': ['mental model', 'opinion', 'insight'],

  // API
  'api': ['rest', 'endpoint', 'http'],
  'mcp': ['model context protocol', 'tool'],
};

/**
 * Expand query with synonyms for better recall.
 * @param {string} query
 * @returns {string}
 */
export function expandQuery(query) {
  const words = query.toLowerCase().split(/\s+/);
  const expansions = new Set([query]);

  for (const word of words) {
    const cleanWord = word.replace(/[^\w-]/g, '');
    if (SYNONYMS[cleanWord]) {
      for (const syn of SYNONYMS[cleanWord]) {
        expansions.add(syn);
      }
    }
  }

  return Array.from(expansions).join(' ');
}
