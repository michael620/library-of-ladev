import * as React from 'react';
import { createTheme, Divider, ThemeProvider, useMediaQuery } from '@mui/material';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import { Link as InertiaLink, router } from '@inertiajs/react'
import SearchBar from '@/components/SearchBar';
import Link from '@mui/material/Link';

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function NewAppLayout({ children }) {
    const currentPath = router.page?.url;
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [isDarkMode, setIsDarkMode] = React.useState(
        prefersDarkMode ? true : false
    );
    const theme = React.useMemo(() =>
        createTheme({
            palette: {
                mode: isDarkMode ? 'dark' : 'light',
            },
    }), [isDarkMode]);

    const onClickHome = (e) => {
        e.preventDefault();
        router.visit('/');
    };

    return (
        <ThemeProvider theme={theme}>
        <Box padding='1rem' display='flex' flexDirection='column' minHeight='100vh'>
        <CssBaseline />
        <AppBar position="fixed">
            <Toolbar>
            <IconButton onClick={onClickHome}>
                <HomeIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{margin: 1}}>
                Library of Ladev
            </Typography>
            {!currentPath?.startsWith('/search') ? <Box marginLeft='auto'><SearchBar
                isLoading={false}
                setIsLoading={() => {}}
                queryText=''
                fullWidth={false}
                size='small'
                showSubmitButton={false}
            /></Box> : ''}
            </Toolbar>
        </AppBar>
        <Box flex='1'>
            <Offset />
            {children}
        </Box>
        <Box>
            <Divider/>
            <Box paddingTop='1rem' display='flex' flexDirection='row' justifyContent='space-between'>
                <Box textAlign='left' display='flex' flexDirection='column'>
                    <Typography fontWeight='bold' variant='caption'>Links</Typography>
                    <Typography component={InertiaLink} href="/" variant='caption'>Home</Typography>
                    <Typography component={InertiaLink} href="/search" variant='caption'>Search</Typography>
                </Box>
                <Box textAlign='right' display='flex' flexDirection='column'>
                    <Typography fontWeight='bold' variant='caption'>Special Thanks</Typography>
                    <Typography variant='caption'>YouTube VODs from <Link href="https://www.youtube.com/@Neuro-samaVods">Neuro-sama Official Vods</Link> and <Link href="https://www.youtube.com/@NArchiver">Neuro Archiver</Link></Typography>
                    <Typography variant='caption'>Inspired by a librarian and a Minecraft mob</Typography>
                    <Typography variant='caption'><Link href="mailto:libraryofladev@gmail.com">Contact</Link></Typography>
                </Box>
            </Box>
        </Box>
        </Box>
        </ThemeProvider>
    );
}
