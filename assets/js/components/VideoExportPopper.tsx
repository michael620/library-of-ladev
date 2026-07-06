import { useEffect, useState, type MutableRefObject } from 'react';
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
import Divider from '@mui/material/Divider';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import DownloadIcon from '@mui/icons-material/Download';
import BrowserUpdatedIcon from '@mui/icons-material/BrowserUpdated';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import CloseIcon from '@mui/icons-material/Close';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { renderMultiSectionDigitalClockTimeView } from '@mui/x-date-pickers/timeViewRenderers';
import type { Dayjs } from 'dayjs';
import { dayJsToSeconds, formatSeconds, timeStrToDayJs } from '../../../shared/constants';
import type { LiveCurrentVideo, YouTubePlayer } from '@/types';

export interface VideoExportPopperProps {
  anchorEl: HTMLElement | null;
  onClose?: () => void;
  liveCurrentVideo: LiveCurrentVideo | null;
  player: MutableRefObject<YouTubePlayer | null>;
  /** True on the /bookmarks page — disables "Load all subtitles". */
  bookmarksMode?: boolean;
  isLoadingSubtitle: boolean;
  fetchSubtitles: (i: number, url: string, fetchAll?: boolean) => unknown;
  onError?: (message: string) => void;
  isMobile: boolean;
  theatreMode: boolean;
  toggleTheatreMode: () => void;
  syncSubtitles: boolean;
  setSyncSubtitles?: (next: boolean) => void;
}

export default function VideoExportPopper(props: VideoExportPopperProps) {
  const {
    anchorEl,
    onClose,
    liveCurrentVideo,
    player,
    bookmarksMode,
    isLoadingSubtitle,
    fetchSubtitles,
    onError,
    isMobile,
    theatreMode,
    toggleTheatreMode,
    syncSubtitles,
    setSyncSubtitles,
  } = props;
  const [startTime, setStartTime] = useState<Dayjs | null>(timeStrToDayJs('00:00:00'));
  const [endTime, setEndTime] = useState<Dayjs | null>(timeStrToDayJs('00:00:00'));
  const [includeTimestamp, setIncludeTimestamp] = useState<boolean>(false);
  const [maxTime, setMaxTime] = useState<Dayjs | null>(null);
  const [isLoadingDownloadText, setIsLoadingDownloadText] = useState<boolean>(false);

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

  const onPopperKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  const handleToggleSyncSubtitles = () => {
    if (!setSyncSubtitles) return;
    localStorage.setItem('settings-syncSubtitles', String(!syncSubtitles));
    setSyncSubtitles(!syncSubtitles);
  };

  const handleLoadAllSubtitles = async () => {
    if (!liveCurrentVideo) return;
    await fetchSubtitles(liveCurrentVideo.i, liveCurrentVideo.video.url, true);
  };

  const handleExportTranscript = async () => {
    if (!liveCurrentVideo || !startTime || !endTime) return;
    const videoUrl = liveCurrentVideo.video.url;
    try {
      setIsLoadingDownloadText(true);
      const res = await fetch(
        `/api/export-transcript?url=${videoUrl}&start=${dayJsToSeconds(
          startTime
        )}&end=${dayJsToSeconds(endTime)}&includeTimestamp=${includeTimestamp}`,
        {
          method: 'GET',
        }
      );
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
    <Popper
      id={open ? 'video-options-popper' : undefined}
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
    >
      <ClickAwayListener onClickAway={close}>
        <Card onKeyDown={onPopperKeyDown}>
          <CardContent>
            <Box display="flex" justifyContent="flex-end">
              <IconButton size="small" onClick={close} aria-label="Close">
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
            <Box display="flex" flexDirection="column" justifyContent="start" sx={{ gap: 2 }}>
              <Box display="flex" flexDirection="column" justifyContent="start">
                {!isMobile ? (
                  <FormControlLabel
                    control={<Switch />}
                    checked={!!theatreMode}
                    label={'Theatre mode'}
                    onChange={toggleTheatreMode}
                  />
                ) : null}
                <FormControlLabel
                  control={<Switch />}
                  checked={!!syncSubtitles}
                  label={'Auto-scroll to active subtitle'}
                  onChange={handleToggleSyncSubtitles}
                />
              </Box>
              <Divider />
              <Box
                display="flex"
                flexDirection="row"
                justifyContent="start"
                alignItems="center"
                sx={{ gap: 2 }}
              >
                <Button
                  loading={isLoadingSubtitle}
                  disabled={
                    !!liveCurrentVideo.video.matches ||
                    liveCurrentVideo.video.allSubtitlesFetched ||
                    bookmarksMode
                  }
                  startIcon={<BrowserUpdatedIcon />}
                  onClick={handleLoadAllSubtitles}
                >
                  Load all subtitles
                </Button>
              </Box>
              <Box display="flex" flexDirection="column" justifyContent="start">
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="start"
                  alignItems="center"
                  sx={{ gap: 2 }}
                >
                  <Button
                    loading={isLoadingDownloadText}
                    disabled={isLoadingDownloadText}
                    startIcon={<DownloadIcon />}
                    onClick={handleExportTranscript}
                  >
                    Download as text
                  </Button>
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="start"
                  alignItems="center"
                  sx={{ gap: 2 }}
                >
                  <Accordion>
                    <AccordionSummary
                      expandIcon={<ArrowDropDownIcon />}
                      aria-controls="export-transcript-advanced-options"
                    >
                      <Typography component="span">Advanced options</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Box
                        display="flex"
                        flexDirection="row"
                        justifyContent="start"
                        alignItems="center"
                        sx={{ gap: 2 }}
                        flexWrap={{ xs: 'wrap', sm: 'nowrap' }}
                      >
                        <TimePicker
                          label="Start Time"
                          views={['hours', 'minutes', 'seconds']}
                          format="HH:mm:ss"
                          skipDisabled={true}
                          maxTime={maxTime ?? undefined}
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
                        <HorizontalRuleIcon sx={{ display: { xs: 'none', sm: 'unset' } }} />
                        <TimePicker
                          label="End Time"
                          views={['hours', 'minutes', 'seconds']}
                          format="HH:mm:ss"
                          skipDisabled={true}
                          maxTime={maxTime ?? undefined}
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
                          control={<Switch />}
                          checked={includeTimestamp}
                          label={'Include timestamp'}
                          onChange={(event) =>
                            setIncludeTimestamp((event.target as HTMLInputElement).checked)
                          }
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
