import { useEffect, useState } from 'react';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import DownloadIcon from '@mui/icons-material/Download';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';
import { dayJsToSeconds, formatSeconds, timeStrToDayJs } from '../../../shared/constants';

export default function VideoExportPopper(props) {
    const {
        anchorEl,
        onClose,
        liveCurrentVideo,
        player,
        bookmarksMode,
        isLoadingSubtitle,
        fetchSubtitles,
        onError
    } = props;
    const [startTime, setStartTime] = useState(timeStrToDayJs('00:00:00'));
    const [endTime, setEndTime] = useState(timeStrToDayJs('00:00:00'));
    const [includeTimestamp, setIncludeTimestamp] = useState(false);
    const [maxTime, setMaxTime] = useState(null);
    const [isLoadingDownloadText, setIsLoadingDownloadText] = useState(false);

    useEffect(() => {
        if (player.current) {
            const newMaxTime = timeStrToDayJs(formatSeconds(player.current.getDuration()));
            setEndTime(newMaxTime);
            setMaxTime(newMaxTime);
        }
    }, [player.current]);

    const close = () => {
        if (onClose) onClose();
    };

    const onPopperKeyDown = (event) => {
        if (event.key === 'Escape') {
            close();
        }
    };

    const handleLoadAllSubtitles = async () => {
        if (!liveCurrentVideo) return;
        await fetchSubtitles(liveCurrentVideo.i, liveCurrentVideo.video.url, true);
    };

    const handleExportTranscript = async () => {
        if (!liveCurrentVideo) return;
        const videoUrl = liveCurrentVideo.video.url;
        try {
            setIsLoadingDownloadText(true);
            const res = await fetch(`/api/export-transcript?url=${videoUrl}&start=${dayJsToSeconds(startTime)}&end=${dayJsToSeconds(endTime)}&includeTimestamp=${includeTimestamp}`, {
                method: 'GET',
            });
            if (!res.ok) throw new Error('Failed to download file');
            const blob = await res.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${videoUrl}-${startTime.format('HH:mm:ss')}-${endTime.format('HH:mm:ss')}.txt`;
            a.click();
            window.URL.revokeObjectURL(url);
            close();
        } catch (err) {
            console.error(err);
            if (onError) onError('Failed to download file.');
        } finally {
            setIsLoadingDownloadText(false);
        }
    };

    if (!liveCurrentVideo) return null;
    const open = Boolean(anchorEl);
    return (
        <Popper id={open ? 'video-options-popper' : undefined} open={open} anchorEl={anchorEl} placement='top-start'>
            <ClickAwayListener onClickAway={close}>
            <Card onKeyDown={onPopperKeyDown}>
            <CardContent>
            <Box display='flex' justifyContent='flex-end'>
                <IconButton size="small" onClick={close} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
                <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                    <Button
                        loading={isLoadingSubtitle}
                        disabled={!!liveCurrentVideo.video.matches || liveCurrentVideo.video.allSubtitlesFetched || bookmarksMode}
                        startIcon={<BrowserUpdatedIcon />}
                        onClick={handleLoadAllSubtitles}
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
                        onClick={handleExportTranscript}
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
                                    value={startTime}
                                    onChange={(newValue) => setStartTime(newValue)}
                                    slotProps={{ popper: { disablePortal: true } }}
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
                                    value={endTime}
                                    onChange={(newValue) => setEndTime(newValue)}
                                    slotProps={{ popper: { disablePortal: true } }}
                                />
                            </Box>
                            <Box>
                                <FormControlLabel
                                    control={<Switch/>}
                                    checked={includeTimestamp}
                                    label={'Include timestamp'}
                                    onChange={(event) => setIncludeTimestamp(event.target.checked)}
                                />
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </Box>
                </Box>
            </Box>
            </CardContent>
            </Card>
            </ClickAwayListener>
        </Popper>
    );
}
