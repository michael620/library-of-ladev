import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';

export interface AboutDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function AboutDialog({ open, onClose }: AboutDialogProps) {
  const [tabValue, setTabValue] = useState<number>(0);
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>About</DialogTitle>
      <DialogContent>
        <Tabs value={tabValue} onChange={handleTabChange} sx={{ marginBottom: '1rem' }}>
          <Tab label="Contact" />
          <Tab label="Credits" />
          <Tab label="Legal" />
        </Tabs>
        {tabValue === 0 ? (
          <>
            <Typography gutterBottom variant="body1">
              Follow this project&apos;s discussion at{' '}
              <Link
                target="_blank"
                href="https://discord.com/channels/574720535888396288/1337595628607242282"
              >
                Neuro-sama&apos;s Discord server
              </Link>
              .
            </Typography>
            <Typography variant="body1">
              This project is open source and available on{' '}
              <Link target="_blank" href="https://github.com/michael620/library-of-ladev">
                Github
              </Link>
              .
            </Typography>
          </>
        ) : (
          ''
        )}
        {tabValue === 1 ? (
          <>
            <Typography>VODs are from the following channels:</Typography>
            <Typography>
              <Link target="_blank" href="https://www.youtube.com/@NArchiver">
                Neuro Archiver
              </Link>
            </Typography>
            <Typography>
              <Link target="_blank" href="https://www.youtube.com/@Neuro-samaVods">
                Neuro-sama Official Vods
              </Link>
            </Typography>
            <Typography>
              <Link target="_blank" href="https://www.youtube.com/@Neuro-samaUnofficialVODs">
                Neuro-sama Unofficial VODs
              </Link>
            </Typography>
            <Typography>
              <Link target="_blank" href="https://www.youtube.com/@cpol.archive">
                cpol.archive
              </Link>
            </Typography>
            <Typography>
              <Link target="_blank" href="https://www.youtube.com/@neuro-samafullstreamvod">
                Neuro-sama Full Stream VOD
              </Link>
            </Typography>
            <Typography variant="body1">
              <br />
              Inspired by a librarian and a Minecraft mob
            </Typography>
          </>
        ) : (
          ''
        )}
        {tabValue === 2 ? (
          <>
            <Typography variant="body1">
              <b>Privacy Policy</b>
            </Typography>
            <Typography variant="body2">
              <b>Data and information</b>: This site does not collect, store, or process any
              personal data.
            </Typography>
            <Typography variant="body1">
              <b>Terms of Use</b>
            </Typography>
            <Typography variant="body2">
              <b>Non-affiliation</b>: This site is a fan-made project and is not affiliated with
              Neuro-sama, Vedal, or any related entities.
            </Typography>
            <Typography variant="body2">
              <b>Content and liability</b>: All information on this site is provided &quot;as
              is&quot; without warranties of any kind. The site does not guarantee the accuracy,
              completeness, or reliability of any content and is not liable for any errors or
              omissions.
            </Typography>
            <Typography variant="body2">
              <b>Third-party content</b>: This site may contain third-party links and is not
              responsible for the policies or materials of the third-party.
            </Typography>
          </>
        ) : (
          ''
        )}
      </DialogContent>
      <DialogActions>
        <Button aria-label="Close About Dialog" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
