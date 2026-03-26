/**
 * Release Metadata Parser — simplified for Hindsight semver releases.
 */
import { execSync } from 'node:child_process';
import { MAX_EMBEDDING_SAFE_CHARS } from './config.js';

const MAX_RELEASE_CATEGORY_ITEMS = 20;

export function extractReleaseMetadata(currentTag, previousTag, upstreamDir) {
  const tagInfo = getTagInfo(currentTag, upstreamDir);
  const commits = getCommitLog(previousTag, currentTag, upstreamDir);
  const changelog = categorizeCommits(commits);
  const kbImpact = calculateKBImpact(previousTag, currentTag, upstreamDir);

  return {
    tag: currentTag, commit_hash: tagInfo.commit,
    date: tagInfo.date, release_date: tagInfo.date,
    previous_tag: previousTag, commits_count: commits.length,
    files_changed: kbImpact.total_files, kb_files_changed: kbImpact.kb_files,
    kb_impact: kbImpact.impact_level, changelog,
  };
}

function getTagInfo(tag, upstreamDir) {
  try {
    const cmd = `git show ${tag} --format='%H|%aI|%an <%ae>' --no-patch`;
    const output = execSync(cmd, { cwd: upstreamDir, encoding: 'utf-8' }).trim();
    const [commit, date, author] = output.split('|');
    return { commit, date, author };
  } catch (err) {
    return { commit: 'unknown', date: new Date().toISOString(), author: 'unknown' };
  }
}

function getCommitLog(fromTag, toTag, upstreamDir) {
  if (!fromTag) return [];
  try {
    const output = execSync(`git log ${fromTag}..${toTag} --oneline`, { cwd: upstreamDir, encoding: 'utf-8' });
    return output.trim().split('\n').filter(Boolean);
  } catch { return []; }
}

function categorizeCommits(commits) {
  const categories = { security: [], features: [], fixes: [], breaking: [], other: [] };
  for (const commit of commits) {
    const message = commit.substring(commit.indexOf(' ') + 1);
    if (/^security|Security:/i.test(message)) categories.security.push(message);
    else if (/BREAKING|breaking change/i.test(message)) categories.breaking.push(message);
    else if (/^feat[:(]/i.test(message)) categories.features.push(message);
    else if (/^fix[:(]/i.test(message)) categories.fixes.push(message);
    else categories.other.push(message);
  }
  return categories;
}

const KB_PREFIXES = /^(hindsight-docs\/docs\/|hindsight-api-slim\/|hindsight-integrations\/|hindsight-control-plane\/src\/|skills\/|cookbook\/|hindsight-clients\/go\/)/;

function calculateKBImpact(fromTag, toTag, upstreamDir) {
  if (!fromTag) return { total_files: 0, docs_changed: 0, code_changed: 0, kb_files: 0, impact_level: 'unknown' };
  try {
    const output = execSync(`git diff --name-only ${fromTag}..${toTag}`, { cwd: upstreamDir, encoding: 'utf-8' });
    const files = output.trim().split('\n').filter(Boolean);
    const docsChanged = files.filter(f => f.startsWith('hindsight-docs/')).length;
    const codeChanged = files.filter(f => f.startsWith('hindsight-api-slim/')).length;
    const kbFiles = files.filter(f => KB_PREFIXES.test(f)).length;
    let impactLevel = 'none';
    if (kbFiles > 20) impactLevel = 'high';
    else if (kbFiles >= 5) impactLevel = 'medium';
    else if (kbFiles > 0) impactLevel = 'low';
    return { total_files: files.length, docs_changed: docsChanged, code_changed: codeChanged, kb_files: kbFiles, impact_level: impactLevel };
  } catch { return { total_files: 0, docs_changed: 0, code_changed: 0, kb_files: 0, impact_level: 'unknown' }; }
}

export function formatChangelogMarkdown(metadata) {
  const { tag, date, previous_tag, commits_count, changelog, kb_files_changed, kb_impact } = metadata;
  const dateStr = date.split('T')[0];
  let md = `# Release ${tag} (${dateStr})\n\n`;
  if (previous_tag) md += `${commits_count} commits since ${previous_tag}\n\n`;
  md += renderCategory('Security Fixes', changelog.security, 'security fixes');
  md += renderCategory('Breaking Changes', changelog.breaking, 'breaking changes');
  md += renderCategory('Features', changelog.features, 'features');
  md += renderCategory('Bug Fixes', changelog.fixes, 'fixes');
  md += renderCategory('Other Changes', changelog.other, 'other changes', 10);
  md += `## Knowledge Base Impact\n\n- ${kb_files_changed} KB-relevant files changed\n- Impact level: ${kb_impact}\n`;
  if (md.length > MAX_EMBEDDING_SAFE_CHARS) {
    md = `${md.slice(0, MAX_EMBEDDING_SAFE_CHARS - 32)}\n\n[Release summary truncated]\n`;
  }
  return md;
}

function renderCategory(title, items = [], summaryLabel, maxItems = MAX_RELEASE_CATEGORY_ITEMS) {
  if (!items || items.length === 0) return '';
  let section = `## ${title}\n\n`;
  for (const item of items.slice(0, maxItems)) section += `- ${item}\n`;
  if (items.length > maxItems) section += `- ... and ${items.length - maxItems} more ${summaryLabel}\n`;
  section += '\n';
  return section;
}
