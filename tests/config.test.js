import { describe, it } from 'node:test';
import { strict as assert } from 'node:assert';
import { SOURCES, getActiveSources } from '../lib/config.js';

describe('SOURCES', () => {
  it('phase 1 sources have no phase property', () => {
    const phase1 = SOURCES.filter(s => !s.phase);
    const names = phase1.map(s => s.name);
    assert.deepStrictEqual(names, ['docs', 'engine', 'integrations', 'go-client']);
  });

  it('engine source excludes __pycache__ and .pyc', () => {
    const engine = SOURCES.find(s => s.name === 'engine');
    assert.ok(engine.exclude.includes('**/__pycache__/**'));
    assert.ok(engine.exclude.includes('**/*.pyc'));
  });

  it('integrations source excludes node_modules and dist', () => {
    const integ = SOURCES.find(s => s.name === 'integrations');
    assert.ok(integ.exclude.includes('**/node_modules/**'));
    assert.ok(integ.exclude.includes('**/dist/**'));
  });
});

describe('getActiveSources', () => {
  it('returns only phase 1 by default', () => {
    const active = getActiveSources([]);
    const names = active.map(s => s.name);
    assert.deepStrictEqual(names, ['docs', 'engine', 'integrations', 'go-client']);
  });

  it('includes phase 2 sources when listed in extras', () => {
    const active = getActiveSources(['tests', 'control-plane']);
    const names = active.map(s => s.name);
    assert.ok(names.includes('tests'));
    assert.ok(names.includes('control-plane'));
    assert.ok(!names.includes('skills'));
    assert.ok(!names.includes('cookbook'));
  });
});
