import { useState, useMemo } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import HomeIcon from '@mui/icons-material/Home';
import IconButton from '@mui/material/IconButton';
import { Link as InertiaLink, router } from '@inertiajs/react'
import Link from '@mui/material/Link';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export default function NewAppLayout({ children }) {
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const [isDarkMode, setIsDarkMode] = useState(
        prefersDarkMode ? true : false
    );
    const [aboutDialogOpen, setAboutDialogOpen] = useState(false);
    const [tabValue, setTabValue] = useState(0);
    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };
    const theme = useMemo(() =>
        createTheme({
            palette: {
                mode: isDarkMode ? 'dark' : 'light',
            },
    }), [isDarkMode]);

    const onClickHome = (e) => {
        e.preventDefault();
        router.visit('/');
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
            <Tabs value={tabValue} onChange={handleTabChange} sx={{marginBottom: '1rem'}}>
            <Tab label="Contact" />
            <Tab label="Credits" />
            <Tab label="Legal" />
            </Tabs>
            {tabValue === 0 ?
            <>
                <Typography gutterBottom variant='body1'>Follow this project's discussion at <Link target="_blank" href="https://discord.com/channels/574720535888396288/1337595628607242282">Neuro-sama's Discord server</Link>.</Typography>
                <Typography variant='body1'>Report issues or leave feedback via <Link href="mailto:libraryofladev@gmail.com">email</Link>.</Typography>
            </> : ''
            }
            {tabValue === 1 ?
            <>
                <Typography>VODs are from the following channels:</Typography>
                <Typography><Link target="_blank" href="https://www.youtube.com/@NArchiver">Neuro Archiver</Link></Typography>
                <Typography><Link target="_blank" href="https://www.youtube.com/@Neuro-samaVods">Neuro-sama Official Vods</Link></Typography>
                <Typography><Link target="_blank" href="https://www.youtube.com/@Neuro-samaUnofficialVODs">Neuro-sama Unofficial VODs</Link></Typography>
                <Typography><Link target="_blank" href="https://www.youtube.com/@cpol.archive">cpol.archive</Link></Typography>
                <Typography><Link target="_blank" href="https://www.youtube.com/@neuro-samafullstreamvod">Neuro-sama Full Stream VOD</Link></Typography>
                <Typography variant='body1'><br/>Inspired by a librarian and a Minecraft mob</Typography>
            </> : ''
            }
            {tabValue === 2 ?
            <>
                <Typography variant="body1"><b>Privacy Policy</b></Typography>
                <Typography variant='body2'><b>Data and information</b>: This site does not collect, store, or process any personal data.</Typography>
                <Typography variant="body1"><b>Terms of Use</b></Typography>
                <Typography variant='body2'><b>Non-affiliation</b>: This site is a fan-made project and is not affiliated with Neuro-sama, Vedal, or any related entities.</Typography>
                <Typography variant='body2'><b>Content and liability</b>: All information on this site is provided "as is" without warranties of any kind. The site does not guarantee the accuracy, completeness, or reliability of any content and is not liable for any errors or omissions.</Typography>
                <Typography variant='body2'><b>Third-party content</b>: This site may contain embedded videos or links to external websites and is not responsible for the content, policies, or practices of third-party services.</Typography>
            </> : ''
            }
        </DialogContent>
        <DialogActions>
        <Button aria-label='Close About Dialog' onClick={() => setAboutDialogOpen(false)}>Close</Button>
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
                        {aboutDialogComponent}
                    </Box>
                </Box>
            </Box>
        </Box>
        </Box>
        </ThemeProvider>
        </LocalizationProvider>
    );
}
