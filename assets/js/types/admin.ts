export interface SubtitleServerRow {
  id: number;
  startTime: number;
  endTime: number;
  text: string;
}

export interface SubtitleDraft {
  /** Stable local key. For server-backed rows, `s${id}`. For new rows, `n${counter}`. */
  tempId: string;
  /** Server-side id. Absent on newly-created drafts. */
  id?: number;
  startTime: number;
  endTime: number;
  text: string;
  _op?: 'create' | 'update' | 'delete';
}

export type SubtitleOp =
  | { _op: 'create'; startTime: number; endTime: number; text: string }
  | {
      _op: 'update';
      id: number;
      startTime: number;
      endTime: number;
      text: string;
    }
  | { _op: 'delete'; id: number };

export interface AdminSaveVideoPayload {
  title?: string;
  date?: string;
  tags?: string[];
  subtitles?: SubtitleOp[];
}

export interface SaveVideoInitial {
  title: string;
  date: string;
  tags: string[];
  subtitles: SubtitleServerRow[];
}

export interface SaveVideoDraft {
  title: string;
  date: string;
  tags: string[];
  subtitles: SubtitleDraft[];
}

export interface SubtitleRowDiff {
  kind: 'update' | 'create' | 'delete';
  before?: SubtitleServerRow;
  after?: SubtitleDraft;
}

export interface DiffSummary {
  title?: { before: string; after: string };
  date?: { before: string; after: string };
  tags?: { added: string[]; removed: string[] };
  subtitles?: {
    updated: number;
    created: number;
    deleted: number;
    rows: SubtitleRowDiff[];
  };
  isEmpty: boolean;
}
