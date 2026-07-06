import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from 'react';
import NewAppLayout from '@/layouts/NewAppLayout';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import SearchList from '@/components/SearchList';
import SearchBar from '@/components/SearchBar';
import { Head, router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
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
import type { Collection, ItemsMap } from '@/utils/bookmarks';
import type { SearchParams, SearchResult, Subtitle, SubtitleWithVideo, SubtitleServerRow, TagsMap, Video } from '@/types';
import AdminEditDialog from '@/components/admin/AdminEditDialog';

export interface SearchPageProps {
    searchParams: SearchParams;
    tags: TagsMap;
    searchResult?: SearchResult;
    subtitleResult?: Subtitle[];
    allSubtitlesFetched?: boolean;
    noMoreResultsToFetch?: boolean;
    fatalError?: string;
    isAdmin?: boolean;
}

interface SubtitleResultState {
    subtitles: Subtitle[];
    allSubtitlesFetched?: boolean;
    i: number;
}

Search.layout = (page: ReactNode) => <NewAppLayout>{page}</NewAppLayout>

export default function Search(props: SearchPageProps) {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isLoadingSubtitle, setIsLoadingSubtitle] = useState<boolean>(false);
    const [searchResult, setSearchResult] = useState<SearchResult | undefined>(props.searchResult);
    const [subtitleResult, setSubtitleResult] = useState<SubtitleResultState | null>(null);
    const [noMoreResultsToFetch, setNoMoreResultsToFetch] = useState<boolean | undefined>(props.noMoreResultsToFetch);
    const [showTags, setShowTags] = useState<boolean>(localStorage.getItem('settings-showTags') === 'true');
    const [syncSubtitles, setSyncSubtitles] = useState<boolean>(localStorage.getItem('settings-syncSubtitles') === 'true');
    const [showMatchPreviews, setShowMatchPreviews] = useState<boolean>(localStorage.getItem('settings-showMatchPreviews') === 'true');
    const [collections, setCollections] = useState<Collection[]>([]);
    const [lastUsedId, setLastUsedId] = useState<string | null>(null);
    const [items, setItems] = useState<ItemsMap>({});
    const [editingVideo, setEditingVideo] = useState<Video | null>(null);
    const observer = useRef<IntersectionObserver | null>(null);
    const observerSubtitle = useRef<IntersectionObserver | null>(null);

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
        const map = new Map<string, Set<string>>();
        if (!lastUsedCollection) return map;
        for (const itemId of lastUsedCollection.bookmarkIds) {
            const item = items[itemId];
            if (!item) continue;
            const set = map.get(item.videoUrl) || new Set<string>();
            set.add(itemId);
            map.set(item.videoUrl, set);
        }
        return map;
    }, [lastUsedCollection, items]);

    const bookmarkedCollectionIdsByItemId = useMemo(() => {
        const map = new Map<string, Set<string>>();
        for (const c of collections) {
            for (const id of c.bookmarkIds) {
                const set = map.get(id) || new Set<string>();
                set.add(c.id);
                map.set(id, set);
            }
        }
        return map;
    }, [collections]);

    const handleBookmarkToggle = useCallback((subtitleData: SubtitleWithVideo) => {
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

    const handlePickCollection = useCallback((collection: Collection, subtitleData: SubtitleWithVideo) => {
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

    const handleCreateCollection = useCallback((name: string, subtitleData: SubtitleWithVideo) => {
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
        if (noMoreResultsToFetch || isLoading || !searchResult) return;
        setIsLoading(true);
        const fetchType: string = props.searchParams?.isFullTextSearch ? FETCH_TYPE.PAGE_FTS : FETCH_TYPE.PAGE;
        const data: Record<string, FormDataConvertible> = {
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
        };
        router.visit(props.isAdmin ? '/admin' : '/search', {
            data,
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onSuccess: (response) => {
                const responseProps = response.props as unknown as SearchPageProps;
                const mergedResults = [...searchResult, ...(responseProps.searchResult || [])];
                setSearchResult(mergedResults);
                if (responseProps.noMoreResultsToFetch) {
                    setNoMoreResultsToFetch(true);
                }
                setIsLoading(false);
            }
        });
    };

    const fetchSubtitles = async (i: number, url: string, fetchAll?: boolean) => {
        if (isLoadingSubtitle) return;
        setIsLoadingSubtitle(true);
        const data: Record<string, FormDataConvertible> = {
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
        router.visit(props.isAdmin ? '/admin' : '/search', {
            data,
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true,
            onSuccess: (response) => {
                const responseProps = response.props as unknown as SearchPageProps;
                if (responseProps.subtitleResult) {
                    setSubtitleResult({
                        subtitles: responseProps.subtitleResult,
                        allSubtitlesFetched: responseProps.allSubtitlesFetched,
                        i
                    });
                }
            }
        });
    };

    useEffect(() => {
        if (!subtitleResult || !searchResult) return;
        if (subtitleResult.subtitles && (subtitleResult.i <= (searchResult.length || 0))) {
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
        (node: HTMLElement | null) => {
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
        (node: HTMLElement | null, i: number, url: string) => {
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

    const loadAdminSubtitles = useCallback(async (url: string): Promise<SubtitleServerRow[]> => {
        const params = new URLSearchParams();
        params.set('fetchType', 'SUBTITLE');
        params.set('videoUrl', url);
        params.set('fetchAll', 'true');
        const res = await fetch(`/admin?${params.toString()}`, {
            headers: { 'X-Inertia': 'true', 'Accept': 'application/json' }
        });
        const data = await res.json();
        const subs = data.props?.subtitleResult || [];
        return subs.map((s: { subtitleId: number; startTime: number; endTime?: number; text: string }) => ({
            id: s.subtitleId,
            startTime: s.startTime,
            endTime: s.endTime ?? s.startTime,
            text: s.text
        }));
    }, []);

    const handleAdminSaved = useCallback((url: string, patch: { title: string; date: string; tags: string[] }) => {
        setSearchResult(prev => prev ? prev.map(v =>
            v.url === url ? { ...v, title: patch.title, date: patch.date, tags: patch.tags } : v
        ) : prev);
    }, []);

    const handleAdminDeleted = useCallback((url: string) => {
        setSearchResult(prev => prev ? prev.filter(v => v.url !== url) : prev);
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
        isAdmin={props.isAdmin}
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
            isAdmin={props.isAdmin}
            onClickEdit={(video) => setEditingVideo(video)}
        />
    </Paper>
    <AdminEditDialog
        video={editingVideo}
        tags={props.tags}
        loadSubtitles={loadAdminSubtitles}
        onClose={() => setEditingVideo(null)}
        onSaved={handleAdminSaved}
        onDeleted={handleAdminDeleted}
    />
    </Box>
    )
}
