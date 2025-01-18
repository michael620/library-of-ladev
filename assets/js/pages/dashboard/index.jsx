import * as React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import { FormControl, TextField, Button, IconButton, Paper, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import SendIcon from '@mui/icons-material/Send';
import { styled } from '@mui/material/styles';
import { useForm } from '@inertiajs/react'

Dashboard.layout = (page) => <NewAppLayout children={page} />
export default function Dashboard() {
    const page = usePage();
    const loggedInUser = page.props.loggedInUser;
    const { data, setData, progress, post } = useForm({
        url: '',
        title: '',
        date: '',
        transcript: null
    });
    
    const onChangeUrl = (event) => {
        setData('url', event.target.value);
    };
    const onChangeTitle = (event) => {
        setData('title', event.target.value);
    }
    const onChangeDate = (event) => {
        setData('date', event.target.value);
    }
    const onChangeFile = (event) => {
        setData('transcript', event.target.files[0]);
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
                <TextField
                    label='URL'
                    onChange={onChangeUrl}
                />
                <TextField
                    label='Title'
                    onChange={onChangeTitle}
                />
                <TextField
                    label='Date'
                    onChange={onChangeDate}
                />
                <input type="file" onChange={onChangeFile} />
                <IconButton onClick={onSubmit}>
                    <SendIcon />
                </IconButton>
            </FormControl>
        </Paper>
        </Box>
    </>
  )
}
