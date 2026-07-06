import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';

export interface AdminDeleteConfirmDialogProps {
  open: boolean;
  title: string;
  deleting: boolean;
  error?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function AdminDeleteConfirmDialog(props: AdminDeleteConfirmDialogProps) {
  const { open, title, deleting, error, onConfirm, onCancel } = props;
  return (
    <Dialog open={open} onClose={deleting ? undefined : onCancel}>
      <DialogTitle>Delete "{title}"?</DialogTitle>
      <DialogContent dividers>
        {error ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        ) : null}
        <DialogContentText>
          This removes the video, its subtitles, its transcript, and its tag assignments. Bookmarks
          in the browser will show as broken. This cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={deleting}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={onConfirm} disabled={deleting}>
          {deleting ? <CircularProgress size={16} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
