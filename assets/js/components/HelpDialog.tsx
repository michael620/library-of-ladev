import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';

export interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function HelpDialog({ open, onClose }: HelpDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle variant="h5">Help</DialogTitle>
      <DialogContent>
        <Typography variant="h6">Default search</Typography>
        <Typography variant="body1">
          Searches for sentences along with its timestamp.
          <br />
          <b>Note</b>: Since timestamps are split by sentences, you may not find a phrase if it
          spans across multiple sentences.
          <br />
          <br />
        </Typography>
        <Typography variant="h6">Search syntax (Default search)</Typography>
        <Typography display="inline" variant="body1" fontFamily={['monospace', 'monospace']}>
          <b>?</b>
        </Typography>
        <Typography display="inline" variant="body1">
          : Matches any single character
          <br />
        </Typography>
        <Typography display="inline" variant="body1" fontFamily={['monospace', 'monospace']}>
          <b>*</b>
        </Typography>
        <Typography display="inline" variant="body1">
          : Matches zero or more characters
          <br />
          <br />
        </Typography>
        <Typography variant="h6">Full Text Search</Typography>
        <Typography variant="body1">
          Search from the entire video transcript, no timestamp
          <br />
          <b>Note</b>: Snippets are ranked by relevance. It doesn&apos;t work well if the search
          terms match across a large context window.
          <br />
          <b>Tip</b>: You can use Full Text Search first, then search again once you find the exact
          sentence with Full Text Search off to locate the timestamp.
          <br />
          <br />
        </Typography>
        <Typography variant="h6">Search syntax (Full Text Search)</Typography>
        <Typography display="inline" variant="body1" fontFamily={['monospace', 'monospace']}>
          <b>&quot;quoted text&quot;</b>
        </Typography>
        <Typography display="inline" variant="body1">
          : Matches the exact phrase
          <br />
        </Typography>
        <Typography display="inline" variant="body1" fontFamily={['monospace', 'monospace']}>
          <b>or</b>
        </Typography>
        <Typography display="inline" variant="body1">
          : Matches x or y<br />
        </Typography>
        <Typography display="inline" variant="body1" fontFamily={['monospace', 'monospace']}>
          <b>-</b>
        </Typography>
        <Typography display="inline" variant="body1">
          : Exclude words from your search
          <br />
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button size="small" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
