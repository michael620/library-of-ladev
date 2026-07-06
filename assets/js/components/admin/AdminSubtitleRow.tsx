import { memo, type CSSProperties, type ReactElement } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import UndoIcon from '@mui/icons-material/Undo';
import type { SubtitleDraft } from '@/types';

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

export interface AdminSubtitleRowProps {
  rows: SubtitleDraft[];
  onChange: (tempId: string, patch: Partial<SubtitleDraft>) => void;
  onToggleDelete: (tempId: string) => void;
}

function AdminSubtitleRowInner(props: RowCommon & AdminSubtitleRowProps): ReactElement | null {
  const { rows, onChange, onToggleDelete, index, style, ariaAttributes } = props;
  const row = rows[index];
  if (!row) return null;
  const isDeleted = row._op === 'delete';
  return (
    <div style={style} {...ariaAttributes}>
      <Box
        display="flex"
        alignItems="center"
        gap={1}
        sx={{
          px: 1,
          py: 0.5,
          opacity: isDeleted ? 0.4 : 1,
          textDecoration: isDeleted ? 'line-through' : 'none',
        }}
      >
        <TextField
          type="number"
          label="Start"
          size="small"
          value={row.startTime}
          disabled={isDeleted}
          onChange={(e) => onChange(row.tempId, { startTime: Number(e.target.value) })}
          sx={{ width: 90 }}
          inputProps={{ min: 0 }}
        />
        <TextField
          type="number"
          label="End"
          size="small"
          value={row.endTime}
          disabled={isDeleted}
          onChange={(e) => onChange(row.tempId, { endTime: Number(e.target.value) })}
          sx={{ width: 90 }}
          inputProps={{ min: 0 }}
        />
        <TextField
          label="Text"
          size="small"
          value={row.text}
          disabled={isDeleted}
          onChange={(e) => onChange(row.tempId, { text: e.target.value })}
          sx={{ flex: 1 }}
        />
        <IconButton
          onClick={() => onToggleDelete(row.tempId)}
          aria-label={isDeleted ? 'Undo delete' : 'Delete row'}
          title={isDeleted ? 'Undo delete' : 'Delete row'}
          size="small"
        >
          {isDeleted ? <UndoIcon fontSize="small" /> : <DeleteIcon fontSize="small" />}
        </IconButton>
      </Box>
    </div>
  );
}

const AdminSubtitleRow = memo(AdminSubtitleRowInner);
export default AdminSubtitleRow;
