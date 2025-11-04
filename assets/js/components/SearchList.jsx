import { memo, useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { dayJsToSeconds, formatSeconds, timeStrToDayJs } from '../../../shared/constants';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import DownloadIcon from '@mui/icons-material/Download';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import YouTube from 'react-youtube';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';
import Popper from '@mui/material/Popper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';
import { List as FixedSizeList } from 'react-window';

const MatchListItem = memo((props) => {
    const { index, matches } = props;
    const text = matches[index].text;
    return (
        <ListItem style={props.style}>
            <ListItemText primary={
                <Typography
                    height={{ xs: '4.5rem', sm: '3rem' }}
                    sx={{overflowWrap: 'break-word', wordBreak: 'break-word', overflow: 'auto'}}
                    dangerouslySetInnerHTML={{ __html: `${text}` }}/>}
                />
        </ListItem>
    );
});

const SubtitleListItem = memo((props) => {
    const { index, video, currentTime, handleClickSubtitle, handleClickCopy, setCurrentSubtitle, mobileOptionsAnchorEl, setMobileOptionsAnchorEl } = props;
    if (!video) return null;
    const { url, subtitles } = video;
    const { startTime, timestamp, text } = subtitles[index];
    const isActive = currentTime === null ? false : currentTime >= startTime && currentTime < (subtitles[index+1] ? subtitles[index+1].startTime : Infinity);
    useEffect(() => {
        if (isActive) {
            setCurrentSubtitle(index);
        }
    }, [isActive, index]);
    const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 0,
        paddingBottom: 0
    };
    const primaryText = <Typography height={{ xs: '4.5rem', sm: '3rem' }} sx={{overflowWrap: 'break-word', wordBreak: 'break-word', overflow: 'auto'}}>{text}</Typography>;
    return (
        <ListItem style={props.style} disablePadding
        sx={(theme) => (isActive ? {
            ...baseStyles,
            backgroundColor:'rgba(0, 0, 0, 0.25)',
            borderLeft: `0.25rem solid ${theme.palette.primary.main}`,
            transition: 'background-color 1s ease',
        } : baseStyles)}
        >
            <ListItemButton onClick={() => handleClickSubtitle(startTime)} sx={{ flex: 1 }}>
                <ListItemText primary={primaryText} secondary={`Timestamp: ${timestamp}`} />
            </ListItemButton>
            <Box flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2, display: { xs: 'none', 'sm': 'flex' }}}>
                <IconButton edge="end" aria-label="copy-text" title='Copy text to clipboard' onClick={(e) => handleClickCopy(e, text)}>
                    <ArticleIcon />
                </IconButton>
                <IconButton edge="end" aria-label="copy-link" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, `https://www.youtube.com/watch?v=${url}&t=${startTime}s`)}>
                    <LinkIcon />
                </IconButton>
            </Box>
            <Box flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2, display: { xs: 'flex', 'sm': 'none' }}}>
                <IconButton edge="end" aria-label="subtitle-options" title='More options' onClick={(e) => setMobileOptionsAnchorEl(mobileOptionsAnchorEl === e.currentTarget ? null : e.currentTarget)}>
                    <MoreVertIcon />
                </IconButton>
            </Box>
        </ListItem>
    );
});

const VideoListItem = memo((props) => {
    const {
        video,
        open,
        setVideoOptionsAnchorEl,
        handleClickSubtitleListItem,
        i,
        showTags,
        showMatchPreviews,
        toggleVideoOptions,
        _onReady,
        setHostEl
    } = props;
    const { url, title, date, total, subtitles } = video;
    const ref = useRef(null);
    useEffect(() => {
        if (open===url) {
            setHostEl(ref.current);
        }
    }, [open, setHostEl]);
    let numMatches;
    if (!props.text) {
        numMatches = undefined;
    } else if (subtitles) {
        numMatches = Number(total);
    } else if (video.matches) {
        numMatches = video.matches.length;
    }
    return (
        <ListItem key={url} disablePadding sx={{ display: 'block' }}>
        <ListItemButton onClick={() => handleClickSubtitleListItem(url, video, i)}>
            <ListItemAvatar>
                <Avatar alt="YouTube thumbnail" src={`https://img.youtube.com/vi/${url}/default.jpg`} />
            </ListItemAvatar>
            <ListItemText primary={`${title} - ${date}`} disableTypography secondary={
                <Box display='flex' flexDirection='column'>
                    {(showTags && video.tags.length) ?
                    <Box display='flex' flexDirection='row' flexWrap='wrap' sx={{gap: 1}}>
                        {video.tags.map((tag, i) => (
                            <Chip key={i} label={tag} size="small" color={props.tags[tag].color}/>
                        ))}
                    </Box> : ''}
                    {numMatches !== undefined ? <span>{`${numMatches} match${numMatches > 1 ? 'es' : ''}`}</span> : ''}
                    {showMatchPreviews ?
                    video.subtitles ? video.subtitles.slice(0, 3).map((subtitle, j) => (
                        <Typography key={j} noWrap variant='subtitle2' sx={{ textOverflow: 'ellipsis' }}>{subtitle.timestamp}: {subtitle.text}</Typography>
                    )) : video.matches ? video.matches.slice(0, 3).map((match, j) => (
                        <Typography key={j} noWrap variant='subtitle2' sx={{ textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: `${match.text}` }}></Typography>
                    )) : '' : ''}
                </Box>
            } />
            {open===url ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={open===url} timeout="auto" unmountOnExit onExit={() => setVideoOptionsAnchorEl(null)}>
            <Paper elevation={2}>
            <Box ref={ref}>
                <Box>
                    <YouTube
                    videoId={url}
                    opts={{
                        playerVars: {
                            // https://developers.google.com/youtube/player_parameters
                            autoplay: 0,
                        }
                    }}
                    onReady={_onReady}/>
                </Box>
                <Box>
                    <IconButton onClick={toggleVideoOptions}>
                        <MoreVertIcon />
                    </IconButton>
                </Box>
            </Box>
            </Paper>
        </Collapse>
        </ListItem>
    );
});

const SubtitleList = memo((props) => {
    const {
        subtitleContainerRef,
        video,
        i,
        handleClickSubtitle,
        currentTime,
        handleClickCopy,
        isLoadingSubtitle,
        hostEl,
        rowHeight,
        setCurrentSubtitle,
        onFetchMoreSubtitles,
        mobileOptionsAnchorEl,
        setMobileOptionsAnchorEl
    } = props;
    if (!hostEl || !video) return null;
    const { url } = video;
    return createPortal(
        <>
        {video.subtitles ? <FixedSizeList
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
            listRef={subtitleContainerRef}
            rowComponent={SubtitleListItem}
            rowCount={video.subtitles.length}
            rowHeight={rowHeight}
            rowProps={{
                video,
                handleClickSubtitle,
                handleClickCopy,
                setCurrentSubtitle,
                currentTime,
                mobileOptionsAnchorEl,
                setMobileOptionsAnchorEl
            }}
        /> : video.matches ? <FixedSizeList
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
            listRef={subtitleContainerRef}
            rowComponent={MatchListItem}
            rowCount={video.matches.length}
            rowHeight={rowHeight}
            rowProps={{
                matches: video.matches
            }}
        /> : null}
        {((!video.matches && !video.subtitles) || video.matches || video.noMoreSubtitlesToFetch) ? '' : <LinearProgress ref={(node) => onFetchMoreSubtitles(node, i, url)} sx={{ visibility: isLoadingSubtitle ? "visible" : "hidden" }}/>}
        </>
    , hostEl);
});

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
    const [currentSubtitle, setCurrentSubtitle] = useState(null);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const handleClickSubtitleListItem = useCallback((key, video, i) => {
        if (open === key) {
            setOpen(null);
            setCurrentVideo(null);
        } else {
            setOpen(key);
            setCurrentVideo({ video, i });
        }
    }, [open]);

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

    useEffect(() => {
        let interval;
        if (syncSubtitles && player.current) {
            interval = setInterval(() => {
                const currentTime = player.current.getCurrentTime();
                setCurrentTime(Math.round(currentTime));
            }, 1000);
        } else {
            setCurrentTime(null);
        }
        return () => clearInterval(interval);
    }, [syncSubtitles, player.current]);

    useEffect(() => {
        if (currentSubtitle !== null && subtitleContainerRef.current) {
            subtitleContainerRef.current.scrollToRow({align: 'start', index: currentSubtitle})
        }
    }, [currentSubtitle]);

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
    if (!props.text) {
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

    const VideoOptionsPopper = currentVideo ? (
        <Popper id={isVideoOptionsOpen ? 'video-options-popper' : undefined} open={isVideoOptionsOpen} anchorEl={videoOptionsAnchorEl} placement='top-start'>
            <Card>
            <CardContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Button
                        loading={isLoadingSubtitle}
                        disabled={!!currentVideo.video.matches || currentVideo.video.allSubtitlesFetched}
                        startIcon={<BrowserUpdatedIcon />}
                        onClick={() => handleLoadAllSubtitles(currentVideo.video.url, currentVideo.i)}
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
                        onClick={() => handleExportTranscript(currentVideo.video.url)}
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

    const MobileOptionsPopper = (
        <Popper id={isMobileOptionsOpen ? 'subtitle-options-popper' : undefined} open={isMobileOptionsOpen} anchorEl={mobileOptionsAnchorEl} placement='bottom-end'>
            <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2}}>
                <IconButton edge="end" aria-label="copy-text" title='Copy text to clipboard' onClick={(e) => handleClickCopy(e, text)}>
                    <ArticleIcon />
                </IconButton>
                <IconButton edge="end" aria-label="copy-link" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, `https://www.youtube.com/watch?v=${url}&t=${startTime}s`)}>
                    <LinkIcon />
                </IconButton>
            </Box>
        </Popper>
    );

    return (
        props.searchResult ? <>
        <ListSubheader component="div" sx={{zIndex: 0, lineHeight: 1.5}}>
            {searchResultText}
        </ListSubheader>
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
        >
            {props.searchResult.map((video, i) => {
                return <VideoListItem
                    key={i}
                    {...{
                        video,
                        open,
                        setVideoOptionsAnchorEl,
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
        <SubtitleList
            {...{
                subtitleContainerRef,
                video: currentVideo?.video,
                handleClickSubtitle,
                handleClickCopy,
                currentTime,
                setCurrentSubtitle,
                onFetchMoreSubtitles: props.onFetchMoreSubtitles,
                i: currentVideo?.i,
                isLoadingSubtitle,
                rowHeight: isMobile ? 120 : 96,
                hostEl,
                mobileOptionsAnchorEl,
                setMobileOptionsAnchorEl
            }}
        />
        </> : ''
    );
}
