import { useState, useMemo, useEffect } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import { Link as InertiaLink, router, usePage } from '@inertiajs/react'
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import SearchBarBase from '@/components/SearchBarBase.jsx';

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function NewAppLayout({ children }) {
    const url = usePage().url;
    const showSearchBar = !url?.startsWith('/search');
    const [isLoading, setIsLoading] = useState(false);
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [isDarkMode, setIsDarkMode] = useState(
        prefersDarkMode ? true : false
    );
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
    const [creditsDialogOpen, setCreditsDialogOpen] = useState(false);
    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode: isDarkMode ? 'dark' : 'light',
            },
    }), [isDarkMode]);

    useEffect(() => {
        setIsLoading(false);
    }, [url]);

    const onClickHome = (e) => {
        e.preventDefault();
        router.visit('/');
    };

    const onSubmit = async (text) => {
        setIsLoading(true);
        router.visit('/search', {
            data: { text }
        });
    };

    const aboutDialogComponent = (
    <Dialog
        open={aboutDialogOpen}
        onClose={() => setAboutDialogOpen(false)}
        maxWidth="md"
        fullWidth
    >
        <DialogTitle>About</DialogTitle>
        <DialogContent>
            <Typography gutterBottom variant="body1">This is a fan-made project and is not affiliated with Neuro-sama or Vedal.</Typography>
            <Typography gutterBottom variant='body1'>You can follow this project's discussion at <Link target="_blank" href="https://discord.com/channels/574720535888396288/1330620448928567508">Neuro-sama's Discord server</Link>.</Typography>
            <Typography variant='body1'>Use this <Link target="_blank" href="https://forms.gle/MNrJyYq17DRCkavUA">Google Form</Link> or <Link href="mailto:libraryofladev@gmail.com">email</Link> to report any issues or leave feedback for this website.</Typography>
        </DialogContent>
        <DialogActions>
        <Button aria-label='Close About Dialog' onClick={() => setAboutDialogOpen(false)}>Close</Button>
        </DialogActions>
    </Dialog>
    );

    const creditsDialogComponent = (
    <Dialog
        open={creditsDialogOpen}
        onClose={() => setCreditsDialogOpen(false)}
        maxWidth="md"
        fullWidth
    >
        <DialogTitle>Special Thanks</DialogTitle>
        <DialogContent>
            <Typography>VODs are from the following channels:</Typography>
            <Typography component='li'><Link target="_blank" href="https://www.youtube.com/@NArchiver">Neuro Archiver</Link></Typography>
            <Typography component='li'><Link target="_blank" href="https://www.youtube.com/@Neuro-samaVods">Neuro-sama Official Vods</Link></Typography>
            <Typography component='li'><Link target="_blank" href="https://www.youtube.com/@Neuro-samaUnofficialVODs">Neuro-sama Unofficial VODs</Link></Typography>
            <Typography component='li'><Link target="_blank" href="https://www.youtube.com/@cpol.archive">cpol.archive</Link></Typography>
            <Typography component='li'><Link target="_blank" href="https://www.youtube.com/@neuro-samafullstreamvod">Neuro-sama Full Stream VOD</Link></Typography>
            <Typography variant='body1'><br/>Inspired by a librarian and a Minecraft mob</Typography>
        </DialogContent>
        <DialogActions>
        <Button aria-label='Close Credits Dialog' onClick={() => setCreditsDialogOpen(false)}>Close</Button>
        </DialogActions>
    </Dialog>
    );

    return (
        <LocalizationProvider dateAdapter={AdapterDayjs}>
        <ThemeProvider theme={theme}>
        <Box padding='1rem' display='flex' flexDirection='column' minHeight='100vh'>
        <CssBaseline />
        <AppBar position="fixed">
            <Toolbar>
            <IconButton onClick={onClickHome} aria-label='Home'>
                <HomeIcon />
            </IconButton>
            <Typography variant="h6" noWrap component="div" sx={{margin: 1}}>
                Library of Ladev
            </Typography>
            {showSearchBar ? <Box marginLeft='auto'>
                <SearchBarBase
                    showFullSearchBar={false}
                    onSubmit={onSubmit}
                    isLoading={isLoading}
                /></Box> : ''}
            </Toolbar>
        </AppBar>
        <Box flex='1'>
            <Offset />
            {children}
        </Box>
        <Box>
            <Divider/>
            <Box paddingTop='0.5rem' display='flex' flexDirection='column' justifyContent='start' gap={2}>
                <Box textAlign='left' display='flex' flexDirection='column'>
                    <Typography fontWeight='bold' variant='caption'>Site Map</Typography>
                    <Box textAlign='left' display='flex' flexDirection='row' gap={2}>
                        <Typography component={InertiaLink} href="/" variant='caption'>Home</Typography>
                        <Typography component={InertiaLink} href="/search" variant='caption'>Search</Typography>
                        <Typography component={InertiaLink} variant='caption' onClick={() => setAboutDialogOpen(true)}>About</Typography>
                        <Typography component={InertiaLink} variant='caption' onClick={() => setCreditsDialogOpen(true)}>Credits</Typography>
                        {aboutDialogComponent}
                        {creditsDialogComponent}
                    </Box>
                </Box>
            </Box>
        </Box>
        </Box>
        </ThemeProvider>
        </LocalizationProvider>
    );
}
