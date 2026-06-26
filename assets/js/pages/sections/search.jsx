import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import SearchList from '@/components/SearchList.jsx';
import SearchBar from '@/components/SearchBar.jsx';
import { Head, router } from '@inertiajs/react';
import { FETCH_TYPE } from '../../../../shared/constants';
import Alert from '@mui/material/Alert';
import {
    getCollections,
    getItems,
    getLastUsedCollectionId,
    setLastUsedCollectionId,
    ensureDefaultCollection,
    isInCollection,
    addToCollection,
    removeFromCollection,
    getCollectionById,
    createCollection
} from '@/utils/bookmarks';

Search.layout = (page) => <NewAppLayout>{page}</NewAppLayout>
export default function Search(props) {
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingSubtitle, setIsLoadingSubtitle] = useState(false);
    const [searchResult, setSearchResult] = useState(props.searchResult);
    const [subtitleResult, setSubtitleResult] = useState(null);
    const [noMoreResultsToFetch, setNoMoreResultsToFetch] = useState(props.noMoreResultsToFetch);
    const [showTags, setShowTags] = useState(localStorage.getItem('settings-showTags') === 'true');
    const [syncSubtitles, setSyncSubtitles] = useState(localStorage.getItem('settings-syncSubtitles') === 'true');
    const [showMatchPreviews, setShowMatchPreviews] = useState(localStorage.getItem('settings-showMatchPreviews') === 'true');
    const [collections, setCollections] = useState([]);
    const [lastUsedId, setLastUsedId] = useState(null);
    const [items, setItems] = useState({});
    const observer = useRef(null);
    const observerSubtitle = useRef(null);

    useEffect(() => {
        const id = ensureDefaultCollection();
        setCollections(getCollections());
        setLastUsedId(id);
        setItems(getItems());
    }, []);

    const refreshBookmarkState = useCallback(() => {
        setCollections(getCollections());
        setLastUsedId(getLastUsedCollectionId());
        setItems(getItems());
    }, []);

    const lastUsedCollection = useMemo(() => collections.find(c => c.id === lastUsedId), [collections, lastUsedId]);
    const lastUsedCollectionName = lastUsedCollection?.name;

    const bookmarkedIdsByVideoUrl = useMemo(() => {
        const map = new Map();
        if (!lastUsedCollection) return map;
        for (const itemId of lastUsedCollection.bookmarkIds) {
            const item = items[itemId];
            if (!item) continue;
            const set = map.get(item.videoUrl) || new Set();
            set.add(itemId);
            map.set(item.videoUrl, set);
        }
        return map;
    }, [lastUsedCollection, items]);

    const bookmarkedCollectionIdsByItemId = useMemo(() => {
        const map = new Map();
        for (const c of collections) {
            for (const id of c.bookmarkIds) {
                const set = map.get(id) || new Set();
                set.add(c.id);
                map.set(id, set);
            }
        }
        return map;
    }, [collections]);

    const handleBookmarkToggle = useCallback((subtitleData) => {
        const id = ensureDefaultCollection();
        const itemId = String(subtitleData.subtitleId);
        const target = getCollectionById(id);
        const targetName = target?.name || 'My Bookmarks';
        if (isInCollection(id, itemId)) {
            removeFromCollection(id, itemId);
            refreshBookmarkState();
            return { message: `Removed from ${targetName}` };
        }
        addToCollection(id, {
            subtitleId: subtitleData.subtitleId,
            videoUrl: subtitleData.videoUrl,
            startTime: subtitleData.startTime
        });
        refreshBookmarkState();
        return { message: `Saved to ${targetName}` };
    }, [refreshBookmarkState]);

    const handlePickCollection = useCallback((collection, subtitleData) => {
        const itemId = String(subtitleData.subtitleId);
        if (isInCollection(collection.id, itemId)) {
            removeFromCollection(collection.id, itemId);
            setLastUsedCollectionId(collection.id);
            refreshBookmarkState();
            return { message: `Removed from ${collection.name}` };
        }
        addToCollection(collection.id, {
            subtitleId: subtitleData.subtitleId,
            videoUrl: subtitleData.videoUrl,
            startTime: subtitleData.startTime
        });
        setLastUsedCollectionId(collection.id);
        refreshBookmarkState();
        return { message: `Saved to ${collection.name}` };
    }, [refreshBookmarkState]);

    const handleCreateCollection = useCallback((name, subtitleData) => {
        const collection = createCollection(name);
        addToCollection(collection.id, {
            subtitleId: subtitleData.subtitleId,
            videoUrl: subtitleData.videoUrl,
            startTime: subtitleData.startTime
        });
        setLastUsedCollectionId(collection.id);
        refreshBookmarkState();
        return { message: `Saved to ${collection.name}` };
    }, [refreshBookmarkState]);


    const fetchMoreResults = async () => {
        if (noMoreResultsToFetch || isLoading) return;
        setIsLoading(true);
        let fetchType = props.searchParams?.isFullTextSearch ? FETCH_TYPE.PAGE_FTS : FETCH_TYPE.PAGE;
        router.visit('/search', {
            data: {
                text: props.searchParams?.text,
                isFullTextSearch: props.searchParams?.isFullTextSearch,
                title: props.searchParams?.title,
                isAscending: props.searchParams?.isAscending,
                startDate: props.searchParams?.startDate,
                endDate: props.searchParams?.endDate,
                includeTags: props.searchParams?.includeTags,
                excludeTags: props.searchParams?.excludeTags,
                fetchType,
                lastFtsIndex: fetchType === FETCH_TYPE.PAGE_FTS ? searchResult.length : undefined,
                lastUrl: fetchType === FETCH_TYPE.PAGE ? searchResult[searchResult.length - 1].url : undefined,
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
        const data = {
            fetchType: FETCH_TYPE.SUBTITLE,
            videoUrl: url,
            text: props.searchParams?.text,
            isFullTextSearch: props.searchParams?.isFullTextSearch,
            title: props.searchParams?.title,
            startDate: props.searchParams?.startDate,
            endDate: props.searchParams?.endDate,
            includeTags: props.searchParams?.includeTags,
            excludeTags: props.searchParams?.excludeTags,
            fetchAll
        };
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
            observer.current.observe(node);
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
    useEffect(() => {
        return () => {
            observer.current?.disconnect();
            observerSubtitle.current?.disconnect();
        };
    }, []);
    return (
    <Box>
    <Head>
        <title>Library of Ladev - Search</title>
        <meta name="description" content="Browse and search Neuro-sama stream transcripts." />
    </Head>
    <SearchBar
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        searchParams={props.searchParams}
        showFullSearchBar={true}
        showTags={showTags}
        setShowTags={setShowTags}
        showMatchPreviews={showMatchPreviews}
        setShowMatchPreviews={setShowMatchPreviews}
        tags={props.tags}
    />
    {props.fatalError ? <Alert variant="filled" severity="error">{`Encountered a fatal error: ${props.fatalError}`}</Alert> : ''}
    <Paper elevation={1}>
        <SearchList
            searchResult={searchResult}
            text={props.searchParams?.text}
            onFetchMoreResults={onFetchMoreResults}
            noMoreResultsToFetch={noMoreResultsToFetch}
            showTags={showTags}
            showMatchPreviews={showMatchPreviews}
            isLoading={isLoading}
            onFetchMoreSubtitles={onFetchMoreSubtitles}
            fetchSubtitles={fetchSubtitles}
            isLoadingSubtitle={isLoadingSubtitle}
            syncSubtitles={syncSubtitles}
            setSyncSubtitles={setSyncSubtitles}
            tags={props.tags}
            collections={collections}
            lastUsedCollectionName={lastUsedCollectionName}
            bookmarkedIdsByVideoUrl={bookmarkedIdsByVideoUrl}
            bookmarkedCollectionIdsByItemId={bookmarkedCollectionIdsByItemId}
            onBookmarkToggle={handleBookmarkToggle}
            onPickCollection={handlePickCollection}
            onCreateCollection={handleCreateCollection}
        />
    </Paper>
    </Box>
    )
}
