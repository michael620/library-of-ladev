import { Head, Link as InertiaLink } from '@inertiajs/react'
import NewAppLayout from '@/layouts/NewAppLayout.jsx'
import '~/css/homepage.css'
import { Box, Typography, Stack, Button, Card, CardContent } from '@mui/material'
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
            <Typography align='center'>An archive of stream VOD transcripts from the Twitch channel <Link href="https://www.twitch.tv/vedal987">vedal987</Link></Typography>
            <Typography align='center' variant='h6'>Some example searches:</Typography>
            <Stack sx={{marginTop: 1}} direction="column" spacing={1}>
                <Button>Primary</Button>
                <Button>Primary</Button>
                <Button><InertiaLink href="/search?text=fm">Search</InertiaLink></Button>
            </Stack>
        </CardContent>
        </Card>
        <p><InertiaLink href="/upload">Upload</InertiaLink></p>
        <p><InertiaLink href="/search">Search</InertiaLink></p>
      </Box>
    </>
  )
}
