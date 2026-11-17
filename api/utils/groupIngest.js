'use strict';

const GROUP_KEY_PREFIX = '__group__:';

/**
 * @typedef {{ url: string, groupId?: string, isDefault?: boolean, [key: string]: any }} MetaRow
 * @typedef {{ url: string, groupKey: string, isSoloGenerated: boolean }} ResolvedRow
 *
 * @param {MetaRow[]} rows
 * @returns {{
 *   rows: ResolvedRow[],
 *   groupDefaults: Map<string, { url: string, explicit: boolean }>,
 *   warnings: string[]
 * }}
 */
function resolveGroupPlan(rows) {
  const warnings = [];

  // Per-group tracking: firstUrl, firstDefaultUrl, defaultCount
  const groupMeta = new Map();

  // First pass: assign groupKeys and build per-group metadata
  const resolvedRows = rows.map((row) => {
    const isSoloGenerated = row.groupId == null || row.groupId === '';
    const groupKey = isSoloGenerated ? `${GROUP_KEY_PREFIX}${row.url}` : row.groupId;

    if (!groupMeta.has(groupKey)) {
      groupMeta.set(groupKey, {
        firstUrl: row.url,
        firstDefaultUrl: null,
        defaultCount: 0,
        size: 0,
        isSolo: isSoloGenerated,
      });
    }

    const meta = groupMeta.get(groupKey);
    meta.size += 1;

    if (row.isDefault) {
      meta.defaultCount += 1;
      if (meta.defaultCount === 1) {
        // First flagged row becomes the candidate
        meta.firstDefaultUrl = row.url;
      }
    }

    return { url: row.url, groupKey, isSoloGenerated };
  });

  // Second pass: determine default per group and emit warnings.
  // `explicit` is true only when a row explicitly sets is_default.
  const groupDefaults = new Map();

  for (const [groupKey, meta] of groupMeta) {
    if (meta.isSolo) {
      // Solo rows are implicitly their own default — no warning
      groupDefaults.set(groupKey, { url: meta.firstUrl, explicit: false });
    } else if (meta.defaultCount === 1) {
      // Exactly one is_default flag — use it
      groupDefaults.set(groupKey, { url: meta.firstDefaultUrl, explicit: true });
    } else if (meta.defaultCount === 0 && meta.size > 1) {
      // Multi-source group, no flag → first-seen default + warning
      groupDefaults.set(groupKey, { url: meta.firstUrl, explicit: false });
      warnings.push(
        `Group "${groupKey}" has no is_default row; falling back to first-seen url "${meta.firstUrl}".`
      );
    } else if (meta.defaultCount > 1) {
      // Multi-source group, multiple flags → keep first-flagged + warning
      groupDefaults.set(groupKey, { url: meta.firstDefaultUrl, explicit: true });
      warnings.push(
        `Group "${groupKey}" has ${meta.defaultCount} is_default rows; keeping first-seen flagged url "${meta.firstDefaultUrl}".`
      );
    } else {
      // Single-row explicit group with no flag — treat like solo (no warning)
      groupDefaults.set(groupKey, { url: meta.firstUrl, explicit: false });
    }
  }

  return { rows: resolvedRows, groupDefaults, warnings };
}

module.exports = { resolveGroupPlan, GROUP_KEY_PREFIX };
