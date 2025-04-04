import { useState, useEffect } from 'react';
import { Head, Link as InertiaLink, router, usePage } from '@inertiajs/react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import '~/css/homepage.css';
import { Box, Typography, Stack, Card, CardContent } from '@mui/material';
import Link from '@mui/material/Link';
import SearchBarBase from '@/components/SearchBarBase.jsx';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

Index.layout = (page) => <NewAppLayout children={page} />
export default function Index() {
    const theme = useTheme();
    const isLargeScreen = useMediaQuery(theme.breakpoints.up('sm'));
    const url = usePage().url;
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsLoading(false);
    }, [url]);

    const onSubmit = (text) => {
        setIsLoading(true);
        router.visit('/search', {
            data: { text }
        });
    };
    return (
    <>
        <Head>
            <title>Library of Ladev</title>
            <meta name="description" content="A searchable database of Neuro-sama stream transcripts." />
        </Head>
        <Box>
            <Typography align='center' variant='h3' component='h1'>Library of Ladev</Typography>
            <Card sx={{ minWidth: 275 }, {margin: 2}}>
            <CardContent>
                <Box sx={{ mx: 'auto' }} maxWidth="md" marginBottom='1rem'>
                    <SearchBarBase
                        placeholder={isLargeScreen ? "Search (leave empty to browse all)" : ''}
                        showFullSearchBar={true}
                        onSubmit={onSubmit}
                        isLoading={isLoading}
                    />
                </Box>
                <Typography align='center' sx={{marginBottom:2}}>An archive of stream VOD transcripts from the Twitch channel <Link target="_blank" href="https://www.twitch.tv/vedal987">vedal987</Link></Typography>
                <Typography align='center' variant='h6' component='h2'>Some example searches:</Typography>
                <Stack sx={{marginTop: 1}} direction="column" spacing={1}>
                <Link align='center' component={InertiaLink} href="/search?text=meow%20meow%20lol">meow meow lol</Link>
                <Link align='center' component={InertiaLink} href="/search?text=Ten%20tin%20cans">Ten tin cans</Link>
                <Link align='center' component={InertiaLink} href="/search?text=Thank%20you%20so%20much%20for%20the%20sub%20Archerist">Thank you so much for the sub Archerist</Link>
                </Stack>
            </CardContent>
            </Card>
        </Box>
    </>
  )
}
