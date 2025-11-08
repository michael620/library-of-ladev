import { useEffect, useRef, useState, useCallback } from 'react';
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
import SubtitleList from './SubtitleList';
import VideoListItem from './VideoListItem';

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
    const [popperSubtitle, setPopperSubtitle] = useState(null);
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

    const handleClickMobileSubtitleOption = useCallback((event, text, url, startTime) => {
        setMobileOptionsAnchorEl(mobileOptionsAnchorEl === event.currentTarget ? null : event.currentTarget);
        setPopperSubtitle(mobileOptionsAnchorEl === event.currentTarget ? null : {text, url, startTime});
    }, []);

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
                <IconButton edge="end" aria-label="copy-text" title='Copy text to clipboard' onClick={(e) => handleClickCopy(e, popperSubtitle?.text)}>
                    <ArticleIcon />
                </IconButton>
                <IconButton edge="end" aria-label="copy-link" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, `https://www.youtube.com/watch?v=${popperSubtitle?.url}&t=${popperSubtitle?.startTime}s`)}>
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
                handleClickMobileSubtitleOption
            }}
        />
        </> : ''
    );
}
