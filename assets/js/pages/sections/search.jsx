import { useEffect, useState, useRef, useCallback } from 'react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import SearchList from '@/components/SearchList.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { Head, router } from '@inertiajs/react';
import { FETCH_TYPE } from '../../../../shared/constants';

Search.layout = (page) => <NewAppLayout children={page} />
export default function Search(props) {
    const urlParams = new URLSearchParams(window.location.search);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSubtitle, setIsLoadingSubtitle] = useState(false);
    const [searchResult, setSearchResult] = useState(props.searchResult);
    const [subtitleResult, setSubtitleResult] = useState(null);
    const [noMoreResultsToFetch, setNoMoreResultsToFetch] = useState(props.noMoreResultsToFetch);
    const [showTags, setShowTags] = useState(localStorage.getItem('settings-showTags') === 'true');
    const [syncSubtitles, setSyncSubtitles] = useState(localStorage.getItem('settings-syncSubtitles') === 'true');
    const [showMatchPreviews, setShowMatchPreviews] = useState(localStorage.getItem('settings-showMatchPreviews') === 'true');
    const observer = useRef(null);
    const observerSubtitle = useRef(null);

    const fetchMoreResults = async () => {
        if (noMoreResultsToFetch || isLoading) return;
        setIsLoading(true);
        let fetchType = urlParams.get('isFullTextSearch') ? FETCH_TYPE.PAGE_FTS : FETCH_TYPE.PAGE;
        let fetchMetadata = fetchType === FETCH_TYPE.PAGE_FTS ? searchResult.length : searchResult[searchResult.length - 1].url;
        router.visit('/search', {
            data: {
                text: urlParams.get('text'),
                isFullTextSearch: urlParams.get('isFullTextSearch'),
                title: urlParams.get('title'),
                startDate: urlParams.get('startDate'),
                endDate: urlParams.get('endDate'),
                includeTags: urlParams.getAll('includeTags[]'),
                excludeTags: urlParams.getAll('excludeTags[]'),
                fetchType,
                fetchMetadata,
            },
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onSuccess: (response) => {
                const mergedResults = [...searchResult, ...response.props.searchResult];
                setSearchResult(mergedResults);
                if (response.props.noMoreResultsToFetch) {
                    setNoMoreResultsToFetch(true);
                }
                setIsLoading(false);
            }
        });
    };

    const fetchSubtitles = async (i, url, fetchAll) => {
        if (isLoadingSubtitle) return;
        setIsLoadingSubtitle(true);
        let data = {
            fetchType: FETCH_TYPE.SUBTITLE,
            fetchMetadata: url
        };
        if (!fetchAll) {
            data = {
                ...data,
                text: urlParams.get('text'),
                isFullTextSearch: urlParams.get('isFullTextSearch'),
                title: urlParams.get('title'),
                startDate: urlParams.get('startDate'),
                endDate: urlParams.get('endDate'),
                includeTags: urlParams.getAll('includeTags[]'),
                excludeTags: urlParams.getAll('excludeTags[]'),
            }
        }
        router.visit('/search', {
            data,
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onSuccess: (response) => {
                if (response.props.subtitleResult) {
                    setSubtitleResult({
                        subtitles: response.props.subtitleResult,
                        allSubtitlesFetched: response.props.allSubtitlesFetched,
                        i
                    });
                }
            }
        });
    };

    useEffect(() => {
        if (!subtitleResult) return;
        if (subtitleResult.subtitles && (subtitleResult?.i <= searchResult?.length || 0)) {
            const newResults = [...searchResult];
            newResults[subtitleResult.i].subtitles = subtitleResult.subtitles;
            newResults[subtitleResult.i].noMoreSubtitlesToFetch = true;
            if (subtitleResult.allSubtitlesFetched) newResults[subtitleResult.i].allSubtitlesFetched = true;
            setSearchResult(newResults);
            setIsLoadingSubtitle(false);
        } else {
            console.log('something went wrong with fetching subtitles');
        }
        setSubtitleResult(null);
    }, [subtitleResult]);

    const onFetchMoreResults = useCallback(
        (node) => {
            if (!node || isLoading) return;
            if (observer.current) observer.current.disconnect();
            observer.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchMoreResults();
                }
            });
            if (node) observer.current.observe(node);
        },
        [isLoading]
    );

    const onFetchMoreSubtitles = useCallback(
        (node, i, url) => {
            if (!node || isLoadingSubtitle) return;
            if (observerSubtitle.current) observerSubtitle.current.disconnect();
            observerSubtitle.current = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    fetchSubtitles(i, url);
                }
            });
            observerSubtitle.current.observe(node);
        },
        [isLoadingSubtitle]
    );
    return (
    <Box>
    <Head>
        <title>Library of Ladev - Search</title>
        <meta name="description" content="Browse and search Neuro-sama stream transcripts." />
    </Head>
    <SearchBar
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        showFullSearchBar={true}
        showTags={showTags}
        setShowTags={setShowTags}
        syncSubtitles={syncSubtitles}
        setSyncSubtitles={setSyncSubtitles}
        showMatchPreviews={showMatchPreviews}
        setShowMatchPreviews={setShowMatchPreviews}
        tags={props.tags}
    />
    <Paper elevation={1}>
        <SearchList
            searchResult={searchResult}
            text={urlParams.get('text')}
            onFetchMoreResults={onFetchMoreResults}
            noMoreResultsToFetch={noMoreResultsToFetch}
            showTags={showTags}
            showMatchPreviews={showMatchPreviews}
            isLoading={isLoading}
            onFetchMoreSubtitles={onFetchMoreSubtitles}
            fetchSubtitles={fetchSubtitles}
            isLoadingSubtitle={isLoadingSubtitle}
            syncSubtitles={syncSubtitles}
            tags={props.tags}
        />
    </Paper>
    </Box>
    )
}
