import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
  type ReactElement,
  type CSSProperties,
} from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { List, type ListImperativeAPI } from 'react-window';
import AdminSubtitleRow, { type AdminSubtitleRowProps } from './AdminSubtitleRow';
import AdminSavePreviewDialog from './AdminSavePreviewDialog';
import AdminDeleteConfirmDialog from './AdminDeleteConfirmDialog';
import type {
  DiffSummary,
  SaveVideoInitial,
  SaveVideoDraft,
  SubtitleDraft,
  SubtitleServerRow,
  TagsMap,
  Video,
} from '@/types';
import { buildSaveVideoPayload, describeDiff } from '@/utils/adminDiff';
import { saveVideo, deleteVideo } from '@/utils/adminApi';

/** react-window injects these on every row component. */
type RowCommon = {
  ariaAttributes: {
    'aria-posinset': number;
    'aria-setsize': number;
    role: 'listitem';
  };
  index: number;
  style: CSSProperties;
};

// memo() widens the return type; narrow it back for react-window's rowComponent.
const AdminRow = AdminSubtitleRow as unknown as (
  props: RowCommon & AdminSubtitleRowProps
) => ReactElement | null;

export interface AdminEditDialogProps {
  /** null when closed; otherwise the video being edited. */
  video: Video | null;
  tags: TagsMap;
  loadSubtitles: (url: string) => Promise<SubtitleServerRow[]>;
  onClose: () => void;
  /** Called after successful save so the caller can update its list. */
  onSaved?: (url: string, patch: { title: string; date: string; tags: string[] }) => void;
  /** Called after successful delete so the caller can remove the row. */
  onDeleted?: (url: string) => void;
}

function subtitlesToDrafts(rows: SubtitleServerRow[]): SubtitleDraft[] {
  return rows.map((r) => ({
    tempId: `s${r.id}`,
    id: r.id,
    startTime: r.startTime,
    endTime: r.endTime,
    text: r.text,
  }));
}

export default function AdminEditDialog(props: AdminEditDialogProps) {
  const { video, tags, loadSubtitles, onClose, onSaved, onDeleted } = props;

  const [initial, setInitial] = useState<SaveVideoInitial | null>(null);
  const [draft, setDraft] = useState<SaveVideoDraft | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const listRef = useRef<ListImperativeAPI | null>(null);
  const newRowCounter = useRef<number>(0);

  useEffect(() => {
    if (!video) {
      setInitial(null);
      setDraft(null);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    loadSubtitles(video.url)
      .then((rows) => {
        const init: SaveVideoInitial = {
          title: video.title,
          date: video.date,
          tags: [...video.tags],
          subtitles: rows,
        };
        setInitial(init);
        setDraft({
          title: init.title,
          date: init.date,
          tags: [...init.tags],
          subtitles: subtitlesToDrafts(rows),
        });
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : String(err));
        setLoading(false);
      });
  }, [video, loadSubtitles]);

  const payload = useMemo(() => {
    if (!initial || !draft) return null;
    return buildSaveVideoPayload(initial, draft);
  }, [initial, draft]);
  const isDirty = payload !== null;

  const diff: DiffSummary | null = useMemo(() => {
    if (!initial || !draft) return null;
    return describeDiff(initial, draft);
  }, [initial, draft]);

  const handleConfirmSave = useCallback(async () => {
    if (!video || !initial || !draft) return;
    const p = buildSaveVideoPayload(initial, draft);
    if (!p) {
      setPreviewOpen(false);
      return;
    }
    setSaving(true);
    setSaveError(null);
    const result = await saveVideo(video.url, p);
    setSaving(false);
    if (result.success) {
      onSaved?.(video.url, {
        title: draft.title,
        date: draft.date,
        tags: draft.tags,
      });
      setPreviewOpen(false);
      onClose();
    } else {
      setSaveError(result.error || 'Save failed');
    }
  }, [video, initial, draft, onClose, onSaved]);

  const handleConfirmDelete = useCallback(async () => {
    if (!video) return;
    setDeleting(true);
    setDeleteError(null);
    const result = await deleteVideo(video.url);
    setDeleting(false);
    if (result.success) {
      onDeleted?.(video.url);
      setDeleteConfirmOpen(false);
      onClose();
    } else {
      setDeleteError(result.error || 'Delete failed');
    }
  }, [video, onClose, onDeleted]);

  const updateSubtitle = useCallback((tempId: string, patch: Partial<SubtitleDraft>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            subtitles: prev.subtitles.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)),
          }
        : prev
    );
  }, []);

  const toggleDelete = useCallback((tempId: string) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        subtitles: prev.subtitles.flatMap((r) => {
          if (r.tempId !== tempId) return [r];
          if (r.id === undefined) return [];
          return [{ ...r, _op: r._op === 'delete' ? undefined : ('delete' as const) }];
        }),
      };
    });
  }, []);

  const addRow = useCallback(() => {
    setDraft((prev) => {
      if (!prev) return prev;
      const last = prev.subtitles[prev.subtitles.length - 1];
      const startTime = last ? last.endTime : 0;
      const next: SubtitleDraft = {
        tempId: `n${newRowCounter.current++}`,
        startTime,
        endTime: startTime,
        text: '',
      };
      return { ...prev, subtitles: [...prev.subtitles, next] };
    });
  }, []);

  const requestClose = () => {
    if (isDirty && !window.confirm('Discard unsaved edits?')) return;
    onClose();
  };

  if (!video) return null;

  const allTags = Object.keys(tags);

  return (
    <Dialog open={!!video} onClose={requestClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit video</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : draft && initial ? (
          <Box display="flex" flexDirection="column" gap={2}>
            <TextField label="URL" value={video.url} InputProps={{ readOnly: true }} size="small" />
            <TextField
              label="Title"
              value={draft.title}
              onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
              size="small"
              fullWidth
            />
            <DatePicker
              label="Date"
              value={draft.date ? dayjs(draft.date) : null}
              onChange={(v) =>
                setDraft((d) => (d ? { ...d, date: v ? v.format('YYYY-MM-DD') : '' } : d))
              }
              slotProps={{ textField: { size: 'small' } }}
            />
            <Autocomplete
              multiple
              options={allTags}
              value={draft.tags}
              onChange={(_, next) => setDraft((d) => (d ? { ...d, tags: next } : d))}
              renderTags={(value, getTagProps) =>
                value.map((option, i) => {
                  const chipProps = getTagProps({ index: i });
                  return (
                    <Chip
                      {...chipProps}
                      key={option}
                      label={option}
                      color={tags[option]?.color}
                      size="small"
                    />
                  );
                })
              }
              renderInput={(params) => <TextField {...params} label="Tags" size="small" />}
            />
            <Box>
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
                <Typography variant="subtitle2">Subtitles ({draft.subtitles.length})</Typography>
                <Button onClick={addRow} size="small">
                  Add row
                </Button>
              </Box>
              <Box sx={{ height: 400, border: 1, borderColor: 'divider' }}>
                <List
                  listRef={listRef}
                  rowCount={draft.subtitles.length}
                  rowHeight={64}
                  rowComponent={AdminRow}
                  rowProps={{
                    rows: draft.subtitles,
                    onChange: updateSubtitle,
                    onToggleDelete: toggleDelete,
                  }}
                />
              </Box>
            </Box>
          </Box>
        ) : null}
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => setDeleteConfirmOpen(true)}>
          Delete video
        </Button>
        <Box flex={1} />
        <Button onClick={requestClose}>Cancel</Button>
        <Button variant="contained" disabled={!isDirty} onClick={() => setPreviewOpen(true)}>
          Save
        </Button>
      </DialogActions>
      <AdminSavePreviewDialog
        open={previewOpen}
        diff={diff}
        saving={saving}
        error={saveError}
        onConfirm={handleConfirmSave}
        onBack={() => setPreviewOpen(false)}
      />
      <AdminDeleteConfirmDialog
        open={deleteConfirmOpen}
        title={video.title}
        deleting={deleting}
        error={deleteError}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Dialog>
  );
}
