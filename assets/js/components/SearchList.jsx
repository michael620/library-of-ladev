import { memo, useEffect, useRef, useState, useCallback } from 'react';
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

const SubtitleListItem = memo((props) => {
    const { isActive, handleClickSubtitle, text, startTime, timestamp, url, handleClickCopy } = props;
    const theme = useTheme();
    return (
        <>
            <ListItem data-subtitle-id={`${url}_${startTime}`} style={props.style} disablePadding
            sx={(theme) => (isActive ? {
                backgroundColor:'rgba(0, 0, 0, 0.25)',
                borderLeft: `0.25rem solid ${theme.palette.primary.main}`,
                transition: 'background-color 1s ease',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 0,
                paddingBottom: 0
            } : {
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingTop: 0,
                paddingBottom: 0
            })}
            >
                <ListItemButton onClick={() => handleClickSubtitle(startTime)} sx={{ flex: 1 }}>
                    <ListItemText primary={`${text}`} secondary={`Timestamp: ${timestamp}`} />
                </ListItemButton>
                <Box display='flex' flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2}}>
                    <IconButton edge="end" aria-label="copy-text" title='Copy text to clipboard' onClick={(e) => handleClickCopy(e, text)}>
                        <ArticleIcon />
                    </IconButton>
                    <IconButton edge="end" aria-label="copy-link" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, `https://www.youtube.com/watch?v=${url}&t=${startTime}s`)}>
                        <LinkIcon />
                    </IconButton>
                </Box>
            </ListItem>
        </>
    )
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
    const [videoOptionsStartTime, setVideoOptionsStartTime] = useState(timeStrToDayJs('00:00:00'));
    const [videoOptionsEndTime, setVideoOptionsEndTime] = useState(timeStrToDayJs('00:00:00'));
    const [videoOptionsIncludeTimestamp, setVideoOptionsIncludeTimestamp] = useState(false);
    const [maxTime, setMaxTime] = useState(null);
    const [isLoadingDownloadText, setIsLoadingDownloadText] = useState(false);

    const handleClickSubtitleListItem = useCallback((key) => {
        if (open === key) {
            setOpen(null);
        } else {
            setOpen(key);
        }
    }, [open]);

    const handleClickSubtitle = useCallback((startTime) => {
        player.current.seekTo(startTime);
    }, [player]);

    const showSnackbar = (message) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    }

    const handleClickCopy = (event, text) => {
        event.stopPropagation();
        navigator.clipboard.writeText(text);
        showSnackbar('Copied!')
    };

    const toggleVideoOptions = (event) => {
        setVideoOptionsAnchorEl(videoOptionsAnchorEl ? null : event.currentTarget);
    };

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
        }
        return () => clearInterval(interval);
    }, [syncSubtitles, player.current]);

    useEffect(() => {
        if (open && currentTime !== null) {
            const subtitleContainer = subtitleContainerRef.current;
            const currentSubtitle = document.querySelector(`[data-subtitle-id="${open}_${currentTime}"]`);
            if (subtitleContainer && currentSubtitle) {
                subtitleContainer.scrollTo({
                    top: currentSubtitle.offsetTop - subtitleContainer.offsetTop,
                    behavior: 'smooth'
                });
            }
        }
    }, [open, currentTime]);

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
        searchResultText = 'Showing all videos. Use the search bar above to narrow results.';
    } else if (!props.searchResult?.length) {
        searchResultText = `No results for "${props.text}".`;
    } else {
        searchResultText = props.noMoreResultsToFetch ?
        `Showing results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}".` :
        `Showing results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}"...`;
    }

    const getVideoOptionsComponent = (video, i) => (<>
        <IconButton onClick={toggleVideoOptions}>
            <MoreVertIcon />
        </IconButton>
        <Popper id={isVideoOptionsOpen ? 'video-options-popper' : undefined} open={isVideoOptionsOpen} anchorEl={videoOptionsAnchorEl} placement='top-start'>
            <Card>
            <CardContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Button
                        loading={isLoadingSubtitle}
                        disabled={!!video.matches || video.allSubtitlesFetched}
                        startIcon={<BrowserUpdatedIcon />}
                        onClick={() => handleLoadAllSubtitles(video.url, i)}
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
                        onClick={() => handleExportTranscript(video.url)}
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
    </>);

    return (
        props.searchResult ? <>
        <ListSubheader component="div" sx={{zIndex: 0, lineHeight: 1.5}}>
            {searchResultText}
        </ListSubheader>
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
        >
            {props.searchResult.map((video, i) => {
                const { url, title, date, total, subtitles } = video;
                let numMatches;
                if (!props.text) {
                    numMatches = undefined;
                } else if (subtitles) {
                    numMatches = Number(total);
                } else if (video.matches) {
                    numMatches = video.matches.length;
                }
                return (
                    <Box key={url}>
                    <ListItemButton onClick={(e) => handleClickSubtitleListItem(url)}>
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
                                    <Typography noWrap variant='subtitle2' sx={{ textOverflow: 'ellipsis' }}>{subtitle.timestamp}: {subtitle.text}</Typography>
                                )) : video.matches ? video.matches.slice(0, 3).map((match, j) => (
                                    <Typography noWrap variant='subtitle2' sx={{ textOverflow: 'ellipsis' }} dangerouslySetInnerHTML={{ __html: `${match.text}` }}></Typography>
                                )) : '' : ''}
                            </Box>
                        } />
                        {open===url ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={open===url} timeout="auto" unmountOnExit onExit={() => setVideoOptionsAnchorEl(null)}>
                        <Paper elevation={2}>
                        <Box>
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
                                {getVideoOptionsComponent(video, i)}
                            </Box>
                        </Box>
                        <List component="div" disablePadding>
                        <Box ref={subtitleContainerRef} sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                            {
                                video.subtitles ? video.subtitles.map((subtitle, j) => (
                                    <SubtitleListItem
                                        key={j}
                                        handleClickSubtitle={handleClickSubtitle}
                                        text={subtitle.text}
                                        startTime={subtitle.startTime}
                                        timestamp={subtitle.timestamp}
                                        isActive={currentTime >= subtitle.startTime && currentTime < (video.subtitles[j+1] ? video.subtitles[j+1].startTime : Infinity)}
                                        url={url}
                                        handleClickCopy={handleClickCopy}
                                    />
                                )) : video.matches ? video.matches.map((match, j) => (
                                    <ListItem key={j}>
                                        <ListItemText primary={<Typography dangerouslySetInnerHTML={{ __html: `${match.text}` }}></Typography>} />
                                    </ListItem>
                                )) : ''
                            }
                            {((!video.matches && !video.subtitles) || video.matches || video.noMoreSubtitlesToFetch) ? '' : <LinearProgress ref={(node) => props.onFetchMoreSubtitles(node, i, url)} sx={{ visibility: isLoadingSubtitle ? "visible" : "hidden" }}/>}
                        </Box>
                        </List>
                        </Paper>
                    </Collapse>
                    </Box>
                );
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
        </> : ''
    );
}
