import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { dayJsToSeconds, formatSeconds, timeStrToDayJs } from '../../../shared/constants';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import DownloadIcon from '@mui/icons-material/Download';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import Popper from '@mui/material/Popper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import CheckIcon from '@mui/icons-material/Check';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';
import SubtitleList from './SubtitleList';
import VideoListItem from './VideoListItem';
import { MAX_COLLECTION_NAME_LENGTH } from '@/utils/bookmarks';

export default function SearchList(props) {
    const { isLoading, isLoadingSubtitle, showTags, syncSubtitles, showMatchPreviews } = props;
    const player = useRef(null);
    const subtitleContainerRef = useRef(null);
    const [open, setOpen] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [currentTime, setCurrentTime] = useState(null);
    const [videoOptionsAnchorEl, setVideoOptionsAnchorEl] = useState(null);
    const isVideoOptionsOpen = Boolean(videoOptionsAnchorEl);
    const [mobileOptionsAnchorEl, setMobileOptionsAnchorEl] = useState(null);
    const isMobileOptionsOpen = Boolean(mobileOptionsAnchorEl);
    const [videoOptionsStartTime, setVideoOptionsStartTime] = useState(timeStrToDayJs('00:00:00'));
    const [videoOptionsEndTime, setVideoOptionsEndTime] = useState(timeStrToDayJs('00:00:00'));
    const [videoOptionsIncludeTimestamp, setVideoOptionsIncludeTimestamp] = useState(false);
    const [maxTime, setMaxTime] = useState(null);
    const [isLoadingDownloadText, setIsLoadingDownloadText] = useState(false);
    const [hostEl, setHostEl] = useState(null);
    const [currentVideo, setCurrentVideo] = useState(null);
    const [popperSubtitle, setPopperSubtitle] = useState(null);
    const [bookmarkPickerAnchorEl, setBookmarkPickerAnchorEl] = useState(null);
    const [bookmarkPickerSubtitle, setBookmarkPickerSubtitle] = useState(null);
    const [newCollectionMode, setNewCollectionMode] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');
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

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }

    const handleClickCopy = useCallback((event, text) => {
        event.stopPropagation();
        navigator.clipboard.writeText(text);
        showSnackbar('Copied!')
    }, []);

    const toggleVideoOptions = useCallback((event) => {
        setVideoOptionsAnchorEl(videoOptionsAnchorEl ? null : event.currentTarget);
    }, [videoOptionsAnchorEl]);

    const handleLoadAllSubtitles = async (url, i) => {
        await props.fetchSubtitles(i, url, true);
    }

    const handleExportTranscript = async (videoUrl) => {
        try {
            setIsLoadingDownloadText(true);
            const res = await fetch(`/api/export-transcript?url=${videoUrl}&start=${dayJsToSeconds(videoOptionsStartTime)}&end=${dayJsToSeconds(videoOptionsEndTime)}&includeTimestamp=${videoOptionsIncludeTimestamp}`, {
                method: 'GET',
            });
            if (!res.ok) throw new Error('Failed to download file');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${videoUrl}-${videoOptionsStartTime.format('HH:mm:ss')}-${videoOptionsEndTime.format('HH:mm:ss')}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            showSnackbar('Failed to download file.');
        } finally {
            setIsLoadingDownloadText(false);
        }
    };

    const handleBookmarkToggle = useCallback((subtitleData) => {
        if (!onBookmarkToggle) return;
        const result = onBookmarkToggle(subtitleData);
        if (result && result.message) showSnackbar(result.message);
    }, [onBookmarkToggle]);

    const handleOpenBookmarkPicker = useCallback((anchorEl, subtitleData) => {
        setBookmarkPickerAnchorEl(anchorEl);
        setBookmarkPickerSubtitle(subtitleData);
        setNewCollectionMode(false);
        setNewCollectionName('');
        if (onOpenBookmarkPicker) onOpenBookmarkPicker(subtitleData);
    }, [onOpenBookmarkPicker]);

    const handleCloseBookmarkPicker = () => {
        setBookmarkPickerAnchorEl(null);
        setBookmarkPickerSubtitle(null);
        setNewCollectionMode(false);
        setNewCollectionName('');
    };

    const handlePickCollection = (collection) => {
        if (!onPickCollection || !bookmarkPickerSubtitle) return;
        const result = onPickCollection(collection, bookmarkPickerSubtitle);
        if (result && result.message) showSnackbar(result.message);
        handleCloseBookmarkPicker();
    };

    const handleCreateCollectionSubmit = () => {
        if (!onCreateCollection || !bookmarkPickerSubtitle) return;
        const trimmed = newCollectionName.trim();
        if (!trimmed) return;
        try {
            const result = onCreateCollection(trimmed, bookmarkPickerSubtitle);
            if (result && result.message) showSnackbar(result.message);
            handleCloseBookmarkPicker();
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

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

    useEffect(() => {
        if (player.current) {
            const newMaxTime = timeStrToDayJs(formatSeconds(player.current.getDuration()));
            setVideoOptionsEndTime(newMaxTime);
            setMaxTime(newMaxTime);
        }
    }, [player.current]);

    const _onReady = (event) => {
        player.current = event.target;
    }

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

    const VideoOptionsPopper = liveCurrentVideo ? (
        <Popper id={isVideoOptionsOpen ? 'video-options-popper' : undefined} open={isVideoOptionsOpen} anchorEl={videoOptionsAnchorEl} placement='top-start'>
            <Card>
            <CardContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Button
                        loading={isLoadingSubtitle}
                        disabled={!!liveCurrentVideo.video.matches || liveCurrentVideo.video.allSubtitlesFetched || props.bookmarksMode}
                        startIcon={<BrowserUpdatedIcon />}
                        onClick={() => handleLoadAllSubtitles(liveCurrentVideo.video.url, liveCurrentVideo.i)}
                    >
                    Load all subtitles
                    </Button>
                </Box>
                <Box display='flex' flexDirection='column' justifyContent='start'>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Button
                        loading={isLoadingDownloadText}
                        disabled={isLoadingDownloadText}
                        startIcon={<DownloadIcon />}
                        onClick={() => handleExportTranscript(liveCurrentVideo.video.url)}
                    >
                        Download as text
                    </Button>
                </Box>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Accordion>
                        <AccordionSummary
                        expandIcon={<ArrowDropDownIcon />}
                        aria-controls="export-transcript-advanced-options"
                        >
                        <Typography component="span">Advanced options</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}} flexWrap={{ xs: 'wrap', sm: 'nowrap' }}>
                                <TimePicker
                                    label='Start Time'
                                    views={['hours', 'minutes', 'seconds']}
                                    format='HH:mm:ss'
                                    skipDisabled={true}
                                    maxTime={maxTime}
                                    ampm={false}
                                    viewRenderers={{
                                        hours: renderMultiSectionDigitalClockTimeView,
                                        minutes: renderMultiSectionDigitalClockTimeView,
                                        seconds: renderMultiSectionDigitalClockTimeView,
                                    }}
                                    timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                                    value={videoOptionsStartTime}
                                    onChange={(newValue) => setVideoOptionsStartTime(newValue)}
                                />
                                <HorizontalRuleIcon sx={{ display: { xs: 'none', 'sm': 'unset' }}}/>
                                <TimePicker
                                    label='End Time'
                                    views={['hours', 'minutes', 'seconds']}
                                    format='HH:mm:ss'
                                    skipDisabled={true}
                                    maxTime={maxTime}
                                    ampm={false}
                                    viewRenderers={{
                                        hours: renderMultiSectionDigitalClockTimeView,
                                        minutes: renderMultiSectionDigitalClockTimeView,
                                        seconds: renderMultiSectionDigitalClockTimeView,
                                    }}
                                    timeSteps={{ hours: 1, minutes: 1, seconds: 1 }}
                                    value={videoOptionsEndTime}
                                    onChange={(newValue) => setVideoOptionsEndTime(newValue)}
                                />
                            </Box>
                            <Box>
                                <FormControlLabel
                                    control={<Switch/>}
                                    checked={videoOptionsIncludeTimestamp}
                                    label={'Include timestamp'}
                                    onChange={(event) => setVideoOptionsIncludeTimestamp(event.target.checked)}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
                </Box>
            </Box>
            </CardContent>
            </Card>
        </Popper>
    ) : '';

    const popperBookmarked = popperSubtitle && bookmarkedIdsByVideoUrl
        ? (bookmarkedIdsByVideoUrl.get(popperSubtitle.videoUrl) || new Set()).has(String(popperSubtitle.subtitleId))
        : false;

    const MobileOptionsPopper = (
        <Popper id={isMobileOptionsOpen ? 'subtitle-options-popper' : undefined} open={isMobileOptionsOpen} anchorEl={mobileOptionsAnchorEl} placement='bottom-end'>
            <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2}}>
                <IconButton edge="end" aria-label="copy-text" title='Copy text to clipboard' onClick={(e) => handleClickCopy(e, popperSubtitle?.text)}>
                    <ArticleIcon />
                </IconButton>
                <IconButton edge="end" aria-label="copy-link" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, `https://www.youtube.com/watch?v=${popperSubtitle?.videoUrl}&t=${popperSubtitle?.startTime}s`)}>
                    <LinkIcon />
                </IconButton>
                {(onBookmarkToggle || onOpenBookmarkPicker || onPickCollection) && popperSubtitle ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {onBookmarkToggle ? (
                            <IconButton
                                edge="end"
                                aria-label={popperBookmarked ? 'remove-bookmark' : 'add-bookmark'}
                                title={popperBookmarked ? 'Remove bookmark' : 'Bookmark'}
                                onClick={(e) => { e.stopPropagation(); handleBookmarkToggle(popperSubtitle); }}
                            >
                                {popperBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                            </IconButton>
                        ) : null}
                        {onOpenBookmarkPicker || onPickCollection ? (
                            <IconButton
                                size="small"
                                aria-label="bookmark-picker"
                                title='Save to collection...'
                                onClick={(e) => { e.stopPropagation(); handleOpenBookmarkPicker(e.currentTarget, popperSubtitle); }}
                                sx={{ p: 0.25 }}
                            >
                                <ArrowDropDownIcon fontSize="small" />
                            </IconButton>
                        ) : null}
                    </Box>
                ) : null}
            </Box>
        </Popper>
    );

    const currentItemId = bookmarkPickerSubtitle ? String(bookmarkPickerSubtitle.subtitleId) : null;
    const currentItemCollectionIds = currentItemId && bookmarkedCollectionIdsByItemId
        ? bookmarkedCollectionIdsByItemId.get(currentItemId) || new Set()
        : new Set();

    const BookmarkPickerMenu = (
        <Menu
            anchorEl={bookmarkPickerAnchorEl}
            open={Boolean(bookmarkPickerAnchorEl)}
            onClose={handleCloseBookmarkPicker}
        >
            {(collections || []).map((c) => {
                const checked = currentItemCollectionIds.has(c.id);
                return (
                    <MenuItem key={c.id} onClick={() => handlePickCollection(c)}>
                        <ListItemIcon>{checked ? <CheckIcon fontSize="small" /> : <Box sx={{ width: 20 }} />}</ListItemIcon>
                        <ListItemText>{c.name}</ListItemText>
                    </MenuItem>
                );
            })}
            {(collections || []).length > 0 ? <Divider /> : null}
            {newCollectionMode ? (
                <MenuItem
                    disableRipple
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{ display: 'flex', gap: 1 }}
                >
                    <TextField
                        size="small"
                        autoFocus
                        placeholder="Collection name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreateCollectionSubmit();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setNewCollectionMode(false);
                            }
                        }}
                        slotProps={{ htmlInput: { maxLength: MAX_COLLECTION_NAME_LENGTH } }}
                    />
                    <Button size="small" disabled={!newCollectionName.trim()} onClick={handleCreateCollectionSubmit}>Save</Button>
                </MenuItem>
            ) : (
                <MenuItem onClick={() => setNewCollectionMode(true)}>
                    <ListItemIcon><Box sx={{ width: 20 }} /></ListItemIcon>
                    <ListItemText>New collection…</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );

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
        {VideoOptionsPopper}
        {MobileOptionsPopper}
        {BookmarkPickerMenu}
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
