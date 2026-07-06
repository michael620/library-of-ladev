import { useState, useMemo, type ReactNode } from 'react';
import { ThemeProvider, createTheme, styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import useMediaQuery from '@mui/material/useMediaQuery';
import Divider from '@mui/material/Divider';
import CssBaseline from '@mui/material/CssBaseline';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import AppBar from '@mui/material/AppBar';
import HomeIcon from '@mui/icons-material/Home';
import MenuIcon from '@mui/icons-material/Menu';
import IconButton from '@mui/material/IconButton';
import { Link as InertiaLink, router } from '@inertiajs/react';
import Link from '@mui/material/Link';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AboutDialog from '@/components/AboutDialog';
import NavDrawer, { type NavItem } from '@/components/NavDrawer';

const Offset = styled('div')(({ theme }) => theme.mixins.toolbar);

export interface NewAppLayoutProps {
  children: ReactNode;
}

export default function NewAppLayout({ children }: NewAppLayoutProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [isDarkMode] = useState<boolean>(prefersDarkMode ? true : false);
  const [aboutDialogOpen, setAboutDialogOpen] = useState<boolean>(false);
  const [navOpen, setNavOpen] = useState<boolean>(false);
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: isDarkMode ? 'dark' : 'light',
        },
      }),
    [isDarkMode]
  );

  const onClickHome = (e: React.MouseEvent) => {
    e.preventDefault();
    router.visit('/');
  };

  const navItems: NavItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Search', href: '/search' },
    { label: 'Bookmarks', href: '/bookmarks' },
    { label: 'API', href: '/docs' },
    { label: 'About', onClick: () => setAboutDialogOpen(true) },
  ];

  const handleNavItemClick = (item: NavItem) => {
    setNavOpen(false);
    if (item.onClick) item.onClick();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <ThemeProvider theme={theme}>
        <Box
          padding={{ xs: '0rem', sm: '1rem' }}
          display="flex"
          flexDirection="column"
          minHeight="100vh"
        >
          <CssBaseline />
          <Link
            href="#maincontent"
            underline="none"
            sx={{
              position: 'absolute',
              left: '-999px',
              top: 'auto',
              width: '1px',
              height: '1px',
              overflow: 'hidden',
              '&:focus, &:focus-visible': {
                left: '1rem',
                top: '1rem',
                width: 'auto',
                height: 'auto',
                backgroundColor: 'background.paper',
                p: '0.5rem 1rem',
                zIndex: 9999,
                borderRadius: 1,
                boxShadow: 3,
              },
            }}
          >
            Skip to main content
          </Link>
          <AppBar position="fixed">
            <Toolbar>
              <IconButton
                onClick={() => setNavOpen(true)}
                aria-label="Open navigation menu"
                edge="start"
              >
                <MenuIcon />
              </IconButton>
              <IconButton onClick={onClickHome} aria-label="Home">
                <HomeIcon />
              </IconButton>
              <Typography variant="h6" noWrap component="div" sx={{ margin: 1 }}>
                Library of Ladev
              </Typography>
            </Toolbar>
          </AppBar>
          <NavDrawer
            open={navOpen}
            onClose={() => setNavOpen(false)}
            items={navItems}
            onItemClick={handleNavItemClick}
          />
          <Box flex="1">
            <Offset />
            <Box id="maincontent" component="main" tabIndex={-1} sx={{ outline: 'none' }}>
              {children}
            </Box>
          </Box>
          <Box>
            <Divider />
            <Box
              paddingTop="0.5rem"
              display="flex"
              flexDirection="column"
              justifyContent="start"
              gap={2}
            >
              <Box textAlign="left" display="flex" flexDirection="column">
                <Typography fontWeight="bold" variant="caption">
                  Site Map
                </Typography>
                <Box textAlign="left" display="flex" flexDirection="row" gap={2}>
                  <Link
                    component={InertiaLink}
                    variant="caption"
                    href="/"
                    color="inherit"
                    underline="hover"
                  >
                    Home
                  </Link>
                  <Link
                    component={InertiaLink}
                    variant="caption"
                    href="/search"
                    color="inherit"
                    underline="hover"
                  >
                    Search
                  </Link>
                  <Link
                    component={InertiaLink}
                    variant="caption"
                    href="/bookmarks"
                    color="inherit"
                    underline="hover"
                  >
                    Bookmarks
                  </Link>
                  <Link
                    component="button"
                    variant="caption"
                    color="inherit"
                    underline="hover"
                    onClick={() => setAboutDialogOpen(true)}
                    sx={{ background: 'none', border: 'none', p: 0, cursor: 'pointer' }}
                  >
                    About
                  </Link>
                  <Link
                    component={InertiaLink}
                    variant="caption"
                    href="/docs"
                    color="inherit"
                    underline="hover"
                  >
                    API
                  </Link>
                  <AboutDialog open={aboutDialogOpen} onClose={() => setAboutDialogOpen(false)} />
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
