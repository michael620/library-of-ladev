import * as React from 'react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import Paper from '@mui/material/Paper';
import { Box } from '@mui/material';
import SearchList from '@/components/SearchList.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { Head } from '@inertiajs/react'
import { router } from '@inertiajs/react';
import { FETCH_SIZE } from '../../../../shared/constants';

Search.layout = (page) => <NewAppLayout children={page} />
export default function Search(props) {
    const [isLoading, setIsLoading] = React.useState(false);
    const [searchResult, setSearchResult] = React.useState(props.searchResult);
    const [noMoreResultsToFetch, setNoMoreResultsToFetch] = React.useState(props.noMoreResultsToFetch);
    const observer = React.useRef();
    const fetchMoreResults = async () => {
        if (!props.searchResult || !props.searchResult.length || noMoreResultsToFetch || isLoading) return;
        setIsLoading(true);
        const lastUrl = props.searchParams?.isFullTextSearch ? undefined : searchResult[searchResult.length - 1].url;
        const numResults = props.searchParams?.isFullTextSearch ? searchResult.length : undefined;
        router.visit('/search', {
            data: {
                text: props.searchParams?.text,
                isFullTextSearch: props.searchParams?.isFullTextSearch,
                title: props.searchParams?.title,
                startDate: props.searchParams?.startDate,
                endDate: props.searchParams?.endDate,
                lastUrl,
                numResults
            },
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onSuccess: (response) => {
                const mergedResults = [...searchResult, ...response.props.searchResult];
                setSearchResult(mergedResults);
                if (response.props.searchResult.length < FETCH_SIZE) {
                    setNoMoreResultsToFetch(true);
                }
                setIsLoading(false);
            }
        });
    };

    const lastItemRef = React.useCallback(
        (node) => {
            if (isLoading) return;
            if (observer.current) observer.current.disconnect();
        
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchMoreResults(); // Fetch new data when last item comes into view
                }
            });
        
            if (node) observer.current.observe(node);
        },
        [isLoading]
    );
    return (
    <Box>
    <Head title="Library of Ladev - Search" />
    <SearchBar
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        searchParams={props.searchParams}
        showFullSearchBar={true}
    />
    <Paper elevation={1}>
        <SearchList
            searchResult={searchResult}
            text={props.searchParams?.text}
            lastItemRef={lastItemRef}
            noMoreResultsToFetch={noMoreResultsToFetch}
            isLoading={isLoading}
        />
    </Paper>
    </Box>
    )
}
