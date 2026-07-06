import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import type { DiffSummary } from '@/types';

export interface AdminSavePreviewDialogProps {
  open: boolean;
  diff: DiffSummary | null;
  saving: boolean;
  error?: string | null;
  onConfirm: () => void;
  onBack: () => void;
}

export default function AdminSavePreviewDialog(props: AdminSavePreviewDialogProps) {
  const { open, diff, saving, error, onConfirm, onBack } = props;
  return (
    <Dialog open={open} onClose={saving ? undefined : onBack} maxWidth="sm" fullWidth>
      <DialogTitle>Review changes</DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        {!diff || diff.isEmpty ? (
          <Typography>No changes to save.</Typography>
        ) : (
          <Box display="flex" flexDirection="column" gap={2}>
            {diff.title ? (
              <Typography variant="body2">
                <strong>Title:</strong> "{diff.title.before}" → "{diff.title.after}"
              </Typography>
            ) : null}
            {diff.date ? (
              <Typography variant="body2">
                <strong>Date:</strong> {diff.date.before} → {diff.date.after}
              </Typography>
            ) : null}
            {diff.tags ? (
              <Box>
                {diff.tags.added.length ? (
                  <Typography variant="body2">
                    <strong>Added:</strong>{' '}
                    {diff.tags.added.map((t) => (
                      <Chip key={t} label={t} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Typography>
                ) : null}
                {diff.tags.removed.length ? (
                  <Typography variant="body2">
                    <strong>Removed:</strong>{' '}
                    {diff.tags.removed.map((t) => (
                      <Chip key={t} label={t} size="small" sx={{ mr: 0.5 }} />
                    ))}
                  </Typography>
                ) : null}
              </Box>
            ) : null}
            {diff.subtitles ? (
              <Box>
                <Typography variant="body2">
                  <strong>Subtitles:</strong> {diff.subtitles.updated} edited,{' '}
                  {diff.subtitles.created} added, {diff.subtitles.deleted} deleted
                </Typography>
                <Accordion sx={{ mt: 1 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography variant="body2">Show details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {diff.subtitles.rows.map((r, i) => (
                      <Box key={i} sx={{ mb: 1 }}>
                        {r.kind === 'update' && r.before && r.after ? (
                          <Typography variant="caption" component="div">
                            [{r.before.startTime}s–{r.before.endTime}s] "{r.before.text}"<br />→ [
                            {r.after.startTime}s–
                            {r.after.endTime}s] "{r.after.text}"
                          </Typography>
                        ) : r.kind === 'create' && r.after ? (
                          <Typography variant="caption" component="div" color="success.main">
                            + [{r.after.startTime}s–{r.after.endTime}s] "{r.after.text}"
                          </Typography>
                        ) : r.kind === 'delete' && r.before ? (
                          <Typography
                            variant="caption"
                            component="div"
                            color="error.main"
                            sx={{ textDecoration: 'line-through' }}
                          >
                            [{r.before.startTime}s–{r.before.endTime}s] "{r.before.text}"
                          </Typography>
                        ) : null}
                        <Divider sx={{ mt: 0.5 }} />
                      </Box>
                    ))}
                  </AccordionDetails>
                </Accordion>
              </Box>
            ) : null}
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onBack} disabled={saving}>
          Back
        </Button>
        <Button variant="contained" onClick={onConfirm} disabled={saving || !diff || diff.isEmpty}>
          {saving ? <CircularProgress size={16} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
