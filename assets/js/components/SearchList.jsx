import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import SubtitleList from './SubtitleList';
import VideoListItem from './VideoListItem';
import VideoExportPopper from './VideoExportPopper';
import MobileOptionsPopper from './MobileOptionsPopper';
import BookmarkPickerMenu from './BookmarkPickerMenu';

export default function SearchList(props) {
    const { isLoading, isLoadingSubtitle, showTags, syncSubtitles, showMatchPreviews } = props;
    const player = useRef(null);
    const subtitleContainerRef = useRef(null);
    const [open, setOpen] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(null);
    const [videoOptionsAnchorEl, setVideoOptionsAnchorEl] = useState(null);
    const [mobileOptionsAnchorEl, setMobileOptionsAnchorEl] = useState(null);
    const [hostEl, setHostEl] = useState(null);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [popperSubtitle, setPopperSubtitle] = useState(null);
    const [bookmarkPickerAnchorEl, setBookmarkPickerAnchorEl] = useState(null);
    const [bookmarkPickerSubtitle, setBookmarkPickerSubtitle] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const {
        onBookmarkToggle,
        onOpenBookmarkPicker,
        onPickCollection,
        onCreateCollection,
        collections,
        lastUsedCollectionName,
        bookmarkedIdsByVideoUrl,
        bookmarkedCollectionIdsByItemId
    } = props;

    const handleClickSubtitleListItem = useCallback((key, video, i) => {
        if (open === key) {
            setOpen(null);
            setCurrentVideo(null);
        } else {
            setOpen(key);
            setCurrentVideo({ url: video.url, i });
        }
    }, [open]);

    const handleClickMobileSubtitleOption = useCallback((event, subtitleData) => {
        setMobileOptionsAnchorEl(mobileOptionsAnchorEl === event.currentTarget ? null : event.currentTarget);
        setPopperSubtitle(mobileOptionsAnchorEl === event.currentTarget ? null : subtitleData);
    }, [mobileOptionsAnchorEl]);

    const onCollapseVideoListItem = useCallback(() => {
        setVideoOptionsAnchorEl(null);
        setMobileOptionsAnchorEl(null);
    }, []);

    const handleClickSubtitle = useCallback((startTime) => {
        player.current.seekTo(startTime);
    }, [player]);

    const showSnackbar = useCallback((message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }, []);

    const handleClickCopy = useCallback((event, text) => {
        event.stopPropagation();
        navigator.clipboard.writeText(text);
        showSnackbar('Copied!')
    }, [showSnackbar]);

    const toggleVideoOptions = useCallback((event) => {
        setVideoOptionsAnchorEl(videoOptionsAnchorEl ? null : event.currentTarget);
    }, [videoOptionsAnchorEl]);

    const handleBookmarkToggle = useCallback((subtitleData) => {
        if (!onBookmarkToggle) return;
        const result = onBookmarkToggle(subtitleData);
        if (result && result.message) showSnackbar(result.message);
    }, [onBookmarkToggle, showSnackbar]);

    const handleOpenBookmarkPicker = useCallback((anchorEl, subtitleData) => {
        setBookmarkPickerAnchorEl(anchorEl);
        setBookmarkPickerSubtitle(subtitleData);
        if (onOpenBookmarkPicker) onOpenBookmarkPicker(subtitleData);
    }, [onOpenBookmarkPicker]);

    const handleCloseBookmarkPicker = useCallback(() => {
        setBookmarkPickerAnchorEl(null);
        setBookmarkPickerSubtitle(null);
    }, []);

    const handlePickCollection = useCallback((collection, subtitleData) => {
        if (!onPickCollection || !subtitleData) return;
        const result = onPickCollection(collection, subtitleData);
        if (result && result.message) showSnackbar(result.message);
    }, [onPickCollection, showSnackbar]);

    const handleCreateCollection = useCallback((name, subtitleData) => {
        if (!onCreateCollection || !subtitleData) return;
        try {
            const result = onCreateCollection(name, subtitleData);
            if (result && result.message) showSnackbar(result.message);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    }, [onCreateCollection, showSnackbar]);

    useEffect(() => {
        let interval;
        if (syncSubtitles && player.current) {
            interval = setInterval(() => {
                const currentTime = player.current.getCurrentTime();
                setCurrentTime(Math.floor(currentTime));
            }, 1000);
        } else {
            setCurrentTime(null);
        }
        return () => clearInterval(interval);
    }, [syncSubtitles, player.current]);

    const _onReady = useCallback((event) => {
        player.current = event.target;
    }, []);

    let searchResultText;
    if (props.bookmarksMode) {
        searchResultText = `Displaying ${props.searchResult?.length || 0} bookmarked video${(props.searchResult?.length || 0) === 1 ? '' : 's'}.`;
    } else if (!props.text) {
        searchResultText = props.noMoreResultsToFetch ?
        `Displaying all ${props.searchResult?.length || 0} videos.` :
        `Displaying ${props.searchResult?.length || 0} videos...`;
    } else if (!props.searchResult?.length) {
        searchResultText = `No results for "${props.text}".`;
    } else {
        searchResultText = props.noMoreResultsToFetch ?
        `Displaying results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}".` :
        `Displaying results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}"...`;
    }

    const liveCurrentVideo = useMemo(() => {
        if (!currentVideo) return null;
        const idx = props.searchResult?.findIndex(v => v.url === currentVideo.url);
        if (idx === undefined || idx < 0) return null;
        return { video: props.searchResult[idx], i: idx };
    }, [currentVideo, props.searchResult]);

    useEffect(() => {
        if (currentVideo && !liveCurrentVideo) {
            setOpen(null);
            setCurrentVideo(null);
        }
    }, [currentVideo, liveCurrentVideo]);

    const currentVideoBookmarkedIds = useMemo(() => {
        if (!liveCurrentVideo || !bookmarkedIdsByVideoUrl) return new Set();
        return bookmarkedIdsByVideoUrl.get(liveCurrentVideo.video.url) || new Set();
    }, [liveCurrentVideo, bookmarkedIdsByVideoUrl]);

    return (
        props.searchResult ? <>
        <ListSubheader component="div" sx={{zIndex: 0, lineHeight: 1.5}}>
            {searchResultText}
            {lastUsedCollectionName && onBookmarkToggle ? (
                <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                    Bookmarks save to: <strong>{lastUsedCollectionName}</strong>
                </Typography>
            ) : null}
        </ListSubheader>
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
        >
            {props.searchResult.map((video, i) => {
                return <VideoListItem
                    key={video.url}
                    {...{
                        video,
                        open,
                        onCollapseVideoListItem,
                        handleClickSubtitleListItem,
                        i,
                        showTags,
                        showMatchPreviews,
                        toggleVideoOptions,
                        _onReady,
                        text: props.text,
                        tags: props.tags,
                        onFetchMoreSubtitles: props.onFetchMoreSubtitles,
                        setHostEl
                    }}
                />
            })}
        </List>
        {!props.searchResult?.length ? '' : props.noMoreResultsToFetch ?
        <ListSubheader component="div" sx={{zIndex: 0}}>
            No more results to show.
        </ListSubheader> : <LinearProgress ref={props.onFetchMoreResults} sx={{ visibility: isLoading ? "visible" : "hidden" }}/>
        }
        <Snackbar
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            open={snackbarOpen}
            onClose={() => setSnackbarOpen(false)}
            autoHideDuration={3000}
            message={snackbarMessage}
        />
        <VideoExportPopper
            anchorEl={videoOptionsAnchorEl}
            liveCurrentVideo={liveCurrentVideo}
            player={player}
            bookmarksMode={props.bookmarksMode}
            isLoadingSubtitle={isLoadingSubtitle}
            fetchSubtitles={props.fetchSubtitles}
            onError={showSnackbar}
        />
        <MobileOptionsPopper
            anchorEl={mobileOptionsAnchorEl}
            subtitle={popperSubtitle}
            bookmarkedIdsByVideoUrl={bookmarkedIdsByVideoUrl}
            onCopy={handleClickCopy}
            onBookmarkToggle={onBookmarkToggle ? handleBookmarkToggle : undefined}
            onOpenBookmarkPicker={onOpenBookmarkPicker || onPickCollection ? handleOpenBookmarkPicker : undefined}
            showBookmarkControls={!!(onBookmarkToggle || onOpenBookmarkPicker || onPickCollection)}
        />
        <BookmarkPickerMenu
            anchorEl={bookmarkPickerAnchorEl}
            subtitle={bookmarkPickerSubtitle}
            collections={collections}
            bookmarkedCollectionIdsByItemId={bookmarkedCollectionIdsByItemId}
            onClose={handleCloseBookmarkPicker}
            onPickCollection={handlePickCollection}
            onCreateCollection={handleCreateCollection}
        />
        <SubtitleList
            {...{
                subtitleContainerRef,
                video: liveCurrentVideo?.video,
                handleClickSubtitle,
                handleClickCopy,
                currentTime,
                onFetchMoreSubtitles: props.onFetchMoreSubtitles,
                i: liveCurrentVideo?.i,
                isLoadingSubtitle,
                rowHeight: isMobile ? 120 : 96,
                hostEl,
                handleClickMobileSubtitleOption,
                bookmarkedIds: currentVideoBookmarkedIds,
                onBookmarkToggle: onBookmarkToggle ? handleBookmarkToggle : undefined,
                onOpenBookmarkPicker: onOpenBookmarkPicker || onPickCollection ? handleOpenBookmarkPicker : undefined,
                lastUsedCollectionName
            }}
        />
        </> : ''
    );
}
