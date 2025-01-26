import * as React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import { FormControl, TextField, Button, IconButton, Paper, Box, Typography } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import { useForm } from '@inertiajs/react';
import useFormWithUploads from '@/hooks/useFormWithUploads.js';

Dashboard.layout = (page) => <NewAppLayout children={page} />
export default function Dashboard() {
    const page = usePage();
    const loggedInUser = page.props.loggedInUser;
    const { data, setData, progress, post } = useFormWithUploads({
        transcript_files: null
    });
    const onChangeFile = (event) => {
        setData('transcript_files', [...event.target.files]);
    }

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
                <IconButton onClick={onSubmit}>
                    <SendIcon />
                </IconButton>
            </FormControl>
        </Paper>
        </Box>
    </>
  )
}
