import { Head, Link as InertiaLink } from '@inertiajs/react'
import NewAppLayout from '@/layouts/NewAppLayout.jsx'
import '~/css/homepage.css'
import { Box, Typography, Stack, Card, CardContent } from '@mui/material'
import Link from '@mui/material/Link'

Index.layout = (page) => <NewAppLayout children={page} />
export default function Index() {
  return (
    <>
      <Head title="Library of Ladev" />
      <Box>
        <Typography align='center' variant='h3'>Library of Ladev</Typography>
        <Card sx={{ minWidth: 275 }, {margin: 2}}>
        <CardContent>
            <Typography align='center' sx={{marginBottom:2}}>An archive of stream VOD transcripts from the Twitch channel <Link href="https://www.twitch.tv/vedal987">vedal987</Link></Typography>
            <Typography align='center' variant='h6'>Some example searches:</Typography>
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
