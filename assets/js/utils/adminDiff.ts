import type {
  AdminSaveVideoPayload,
  DiffSummary,
  SaveVideoDraft,
  SaveVideoInitial,
  SubtitleOp,
  SubtitleRowDiff,
} from '@/types';

function arraysEqualSet(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

/**
 * Returns the minimal PUT payload for the differences between `initial`
 * and `draft`. Returns null when nothing is dirty.
 */
export function buildSaveVideoPayload(
  initial: SaveVideoInitial,
  draft: SaveVideoDraft
): AdminSaveVideoPayload | null {
  const payload: AdminSaveVideoPayload = {};

  if (draft.title !== initial.title) payload.title = draft.title;
  if (draft.date !== initial.date) payload.date = draft.date;
  if (!arraysEqualSet(draft.tags, initial.tags)) payload.tags = draft.tags;

  const ops: SubtitleOp[] = [];
  const initialById = new Map(initial.subtitles.map((s) => [s.id, s]));

  for (const row of draft.subtitles) {
    if (row._op === 'delete' && row.id !== undefined) {
      ops.push({ _op: 'delete', id: row.id });
      continue;
    }
    if (row.id === undefined) {
      ops.push({
        _op: 'create',
        startTime: row.startTime,
        endTime: row.endTime,
        text: row.text,
      });
      continue;
    }
    const original = initialById.get(row.id);
    if (!original) continue;
    if (
      row.startTime !== original.startTime ||
      row.endTime !== original.endTime ||
      row.text !== original.text
    ) {
      ops.push({
        _op: 'update',
        id: row.id,
        startTime: row.startTime,
        endTime: row.endTime,
        text: row.text,
      });
    }
  }
  if (ops.length > 0) payload.subtitles = ops;

  if (Object.keys(payload).length === 0) return null;
  return payload;
}

/**
 * Human-readable diff summary for the save-preview dialog.
 */
export function describeDiff(initial: SaveVideoInitial, draft: SaveVideoDraft): DiffSummary {
  const summary: DiffSummary = { isEmpty: true };

  if (draft.title !== initial.title) {
    summary.title = { before: initial.title, after: draft.title };
    summary.isEmpty = false;
  }
  if (draft.date !== initial.date) {
    summary.date = { before: initial.date, after: draft.date };
    summary.isEmpty = false;
  }
  if (!arraysEqualSet(draft.tags, initial.tags)) {
    const initSet = new Set(initial.tags);
    const draftSet = new Set(draft.tags);
    summary.tags = {
      added: draft.tags.filter((t) => !initSet.has(t)),
      removed: initial.tags.filter((t) => !draftSet.has(t)),
    };
    summary.isEmpty = false;
  }

  const initialById = new Map(initial.subtitles.map((s) => [s.id, s]));
  const rows: SubtitleRowDiff[] = [];
  let updated = 0,
    created = 0,
    deleted = 0;

  for (const row of draft.subtitles) {
    if (row._op === 'delete' && row.id !== undefined) {
      const before = initialById.get(row.id);
      if (before) {
        rows.push({ kind: 'delete', before });
        deleted++;
      }
      continue;
    }
    if (row.id === undefined) {
      rows.push({ kind: 'create', after: row });
      created++;
      continue;
    }
    const original = initialById.get(row.id);
    if (!original) continue;
    if (
      row.startTime !== original.startTime ||
      row.endTime !== original.endTime ||
      row.text !== original.text
    ) {
      rows.push({ kind: 'update', before: original, after: row });
      updated++;
    }
  }

  if (updated + created + deleted > 0) {
    summary.subtitles = { updated, created, deleted, rows };
    summary.isEmpty = false;
  }
  return summary;
}
