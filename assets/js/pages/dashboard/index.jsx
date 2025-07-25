import { Link, Head, usePage } from '@inertiajs/react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import SendIcon from '@mui/icons-material/Send';
import useFormWithUploads from '@/hooks/useFormWithUploads.js';

Dashboard.layout = (page) => <NewAppLayout children={page} />
export default function Dashboard() {
    const page = usePage();
    const loggedInUser = page.props.loggedInUser;
    const { data, setData, progress, post } = useFormWithUploads({
        transcript_files: null,
        video_metadata_text: ''
    });
    const onChangeFile = (event) => {
        setData('transcript_files', [...event.target.files]);
    }
    const onChangeVideoMetadata = (event) => {
        setData('video_metadata_text', event?.target?.value || '');
    };

    const onSubmit = (event) => {
        event.preventDefault();
        post('/upload');
    };

  return (
    <>
      <Head title="Dashboard"></Head>
      <Box>
      <Paper elevation={1}>
          <h3 className="mb-2 text-xl font-semibold text-brand">
            Welcome, {loggedInUser.fullName}
          </h3>
          <Link
            href="/profile"
          >
            Edit Profile
          </Link>
        </Paper>
        <Paper elevation={1}>
            <FormControl>
                <Typography variant="h6">Upload</Typography>
                <input type="file" multiple onChange={onChangeFile} />
                <br></br>
                <TextField
                    label="Video Metadata"
                    multiline
                    maxRows={4}
                    onChange={onChangeVideoMetadata}
                />
                <IconButton onClick={onSubmit}>
                    <SendIcon />
                </IconButton>
            </FormControl>
        </Paper>
        </Box>
    </>
  )
}
