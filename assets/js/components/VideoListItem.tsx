import { memo, useEffect, useRef, useState } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Link from '@mui/material/Link';
import YouTube from 'react-youtube';
import type { Video, TagsMap, YouTubePlayer } from '@/types';
import { DISCORD_URL } from '../../../shared/constants';
import SourceToggle from './SourceToggle';

export interface VideoListItemProps {
  video: Video;
  /** url of the currently-expanded video, or null. */
  open: string | null;
  onCollapseVideoListItem: () => void;
  handleClickSubtitleListItem: (key: string, video: Video, i: number) => void;
  i: number;
  showTags: boolean;
  showMatchPreviews: boolean;
  toggleVideoOptions: (event: React.MouseEvent<HTMLElement>) => void;
  _onReady: (event: { target: YouTubePlayer }) => void;
  text?: string;
  tags: TagsMap;
  onFetchMoreSubtitles: (node: HTMLElement | null, i: number, url: string) => void;
  setHostEl: (el: HTMLElement | null) => void;
  isMobile: boolean;
  /** undefined when the row isn't open; otherwise the persisted theatre preference. */
  theatreMode?: boolean;
  isAdmin?: boolean;
  onClickEdit?: (video: Video) => void;
  sources?: Video[];
  onSelectSource?: (videoId: number) => void;
}

const VideoListItem = memo(function VideoListItem(props: VideoListItemProps) {
  const {
    video,
    open,
    onCollapseVideoListItem,
    handleClickSubtitleListItem,
    i,
    showTags,
    showMatchPreviews,
    toggleVideoOptions,
    _onReady,
    setHostEl,
    isMobile,
    theatreMode,
    isAdmin,
    onClickEdit,
    sources,
    onSelectSource,
  } = props;
  const { url, title, date, total, subtitles } = video;
  const ref = useRef<HTMLDivElement | null>(null);
  const playerRef = useRef<HTMLDivElement | null>(null);
  const prevTheatreRef = useRef<boolean | null>(null);
  const [playerReady, setPlayerReady] = useState<boolean>(false);
  const [unavailable, setUnavailable] = useState<number | null>(null);
  const isOpen = open === url;
  const effectiveTheatre = !!theatreMode && !isMobile;
  const theme = useTheme();
  useEffect(() => {
    if (isOpen) {
      setHostEl(ref.current);
    } else {
      setPlayerReady(false);
      setUnavailable(null);
    }
  }, [isOpen, setHostEl]);
  useEffect(() => {
    setUnavailable(null);
  }, [url]);
  useEffect(() => {
    if (isOpen) {
      const justOpened = prevTheatreRef.current === null;
      const theatreToggled =
        prevTheatreRef.current !== null && prevTheatreRef.current !== effectiveTheatre;
      if ((justOpened && effectiveTheatre) || theatreToggled) {
        const timer = setTimeout(() => {
          playerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, theme.transitions.duration.standard);
        prevTheatreRef.current = effectiveTheatre;
        return () => clearTimeout(timer);
      }
    }
    prevTheatreRef.current = isOpen ? effectiveTheatre : null;
  }, [isOpen, effectiveTheatre, theme.transitions.duration.standard]);
  let numMatches: number | undefined;
  if (!props.text) {
    numMatches = undefined;
  } else if (subtitles) {
    numMatches = Number(total);
  } else if (video.matches) {
    numMatches = video.matches.length;
  }
  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();
  return (
    <ListItem key={url} disablePadding sx={{ display: 'block', scrollMarginTop: 64 }}>
      <ListItemButton onClick={() => handleClickSubtitleListItem(url, video, i)}>
        <ListItemAvatar>
          <Avatar alt="YouTube thumbnail" src={`https://img.youtube.com/vi/${url}/default.jpg`} />
        </ListItemAvatar>
        <ListItemText
          primary={`${title} - ${date}`}
          disableTypography
          secondary={
            <Box display="flex" flexDirection="column">
              {sources && sources.length > 1 && video.videoId !== undefined && onSelectSource ? (
                <Box onClick={(e) => e.stopPropagation()} sx={{ mb: 0.5 }}>
                  <SourceToggle sources={sources} value={video.videoId} onChange={onSelectSource} />
                </Box>
              ) : null}
              {showTags && video.tags.length ? (
                <Box display="flex" flexDirection="row" flexWrap="wrap" sx={{ gap: 1 }}>
                  {video.tags.map((tag, i) => (
                    <Chip key={i} label={tag} size="small" color={props.tags[tag].color} />
                  ))}
                </Box>
              ) : (
                ''
              )}
              {numMatches !== undefined ? (
                <span>{`${numMatches} match${numMatches > 1 ? 'es' : ''}`}</span>
              ) : (
                ''
              )}
              {showMatchPreviews
                ? video.subtitles
                  ? video.subtitles.slice(0, 3).map((subtitle, j) => (
                      <Typography
                        key={j}
                        noWrap
                        variant="subtitle2"
                        sx={{ textOverflow: 'ellipsis' }}
                      >
                        {subtitle.timestamp}: {subtitle.text}
                      </Typography>
                    ))
                  : video.matches
                  ? video.matches
                      .slice(0, 3)
                      .map((match, j) => (
                        <Typography
                          key={j}
                          noWrap
                          variant="subtitle2"
                          sx={{ textOverflow: 'ellipsis' }}
                          dangerouslySetInnerHTML={{ __html: `${match.text}` }}
                        ></Typography>
                      ))
                  : ''
                : ''}
            </Box>
          }
        />
        {isOpen ? (
          <Box display="flex" alignItems="center">
            <Box display="flex" alignItems="center" onClick={stopPropagation}>
              {isAdmin && onClickEdit ? (
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation();
                    onClickEdit(video);
                  }}
                  aria-label="Edit video"
                  title="Edit video"
                >
                  <EditIcon />
                </IconButton>
              ) : null}
              <IconButton
                onClick={toggleVideoOptions}
                aria-label="Video options"
                title="Video options"
              >
                <MoreVertIcon />
              </IconButton>
            </Box>
            <ExpandLess />
          </Box>
        ) : (
          <Box display="flex" alignItems="center">
            {isAdmin && onClickEdit ? (
              <IconButton
                onClick={(e) => {
                  e.stopPropagation();
                  onClickEdit(video);
                }}
                aria-label="Edit video"
                title="Edit video"
              >
                <EditIcon />
              </IconButton>
            ) : null}
            <ExpandMore />
          </Box>
        )}
      </ListItemButton>
      <Collapse
        in={isOpen}
        timeout="auto"
        unmountOnExit
        onEntered={() => setPlayerReady(true)}
        onExit={onCollapseVideoListItem}
      >
        <Paper elevation={2}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: effectiveTheatre ? 'row' : 'column',
            }}
          >
            <Box
              sx={
                effectiveTheatre
                  ? {
                      flex: 1,
                      minWidth: 0,
                      display: 'flex',
                      flexDirection: 'column',
                    }
                  : {
                      display: 'flex',
                      flexDirection: 'column',
                    }
              }
            >
              {unavailable !== null ? (
                <Alert severity="warning">
                  This video is unavailable — it may be blocked, private, or removed.{' '}
                  {sources && sources.length > 1 ? 'Try another source above. ' : null}
                  {!(sources && sources.length > 1) ? (
                    <>
                      <Link href={DISCORD_URL} target="_blank" rel="noopener">
                        Report it on Discord
                      </Link>
                      .{' '}
                    </>
                  ) : null}
                  <Link
                    href={`https://www.youtube.com/watch?v=${url}`}
                    target="_blank"
                    rel="noopener"
                  >
                    Watch on YouTube
                  </Link>
                  .
                </Alert>
              ) : null}
              <Box
                ref={playerRef}
                sx={
                  effectiveTheatre
                    ? {
                        position: 'relative',
                        aspectRatio: '16 / 9',
                        width: '100%',
                        maxHeight: '80vh',
                        '& > div, & iframe': {
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                        },
                      }
                    : {
                        '& > div, & iframe': {
                          width: '100%',
                          maxWidth: 640,
                          aspectRatio: '16 / 9',
                          height: 'auto',
                        },
                      }
                }
              >
                {playerReady ? (
                  <YouTube
                    videoId={url}
                    opts={{
                      width: '100%',
                      height: effectiveTheatre ? '100%' : '390',
                      playerVars: {
                        // https://developers.google.com/youtube/player_parameters
                        autoplay: 0,
                      },
                    }}
                    onReady={_onReady}
                    onError={(e: { data: number }) => {
                      if ([100, 101, 150].includes(e.data)) {
                        setUnavailable(e.data);
                      }
                    }}
                  />
                ) : null}
              </Box>
            </Box>
            <Box
              ref={ref}
              sx={
                effectiveTheatre
                  ? {
                      width: 400,
                      alignSelf: 'stretch',
                      overflow: 'hidden',
                    }
                  : undefined
              }
            />
          </Box>
        </Paper>
      </Collapse>
    </ListItem>
  );
});

export default VideoListItem;
