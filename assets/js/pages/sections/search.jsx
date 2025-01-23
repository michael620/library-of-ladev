import * as React from 'react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import Paper from '@mui/material/Paper';
import { Box, LinearProgress } from '@mui/material';
import SearchList from '@/components/SearchList.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { Head } from '@inertiajs/react'

Search.layout = (page) => <NewAppLayout children={page} />
export default function Search(props) {
    const [isLoading, setIsLoading] = React.useState(false);
    return (
    <Box>
    <Head title="Library of Ladev - Search" />
    <SearchBar
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        queryText={props.queryText}
        variant='full'
    />
    {isLoading ? <LinearProgress /> : props.searchResult &&
    <Paper elevation={1}>
        <SearchList
            searchResult={props.searchResult}
            queryText={props.queryText}
        />
    </Paper>
    }
    </Box>
    )
}
