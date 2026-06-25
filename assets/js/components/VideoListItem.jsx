import { memo, useEffect, useRef, useState } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AspectRatioIcon from '@mui/icons-material/AspectRatio';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import { useTheme } from '@mui/material/styles';
import Chip from '@mui/material/Chip';
import YouTube from 'react-youtube';

const VideoListItem = memo(function VideoListItem(props) {
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
        toggleTheatreMode
    } = props;
    const { url, title, date, total, subtitles } = video;
    const ref = useRef(null);
    const headerRef = useRef(null);
    const prevTheatreRef = useRef(null);
    const [playerReady, setPlayerReady] = useState(false);
    const isOpen = open === url;
    const effectiveTheatre = !!theatreMode && !isMobile;
    const theme = useTheme();
    useEffect(() => {
        if (isOpen) {
            setHostEl(ref.current);
        } else {
            setPlayerReady(false);
        }
    }, [isOpen, setHostEl]);
    useEffect(() => {
        if (isOpen) {
            const justOpened = prevTheatreRef.current === null;
            const theatreToggled = prevTheatreRef.current !== null && prevTheatreRef.current !== effectiveTheatre;
            if ((justOpened && effectiveTheatre) || theatreToggled) {
                const timer = setTimeout(() => {
                    headerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, theme.transitions.duration.standard);
                prevTheatreRef.current = effectiveTheatre;
                return () => clearTimeout(timer);
            }
        }
        prevTheatreRef.current = isOpen ? effectiveTheatre : null;
    }, [isOpen, effectiveTheatre, theme.transitions.duration.standard]);
    let numMatches;
    if (!props.text) {
        numMatches = undefined;
    } else if (subtitles) {
        numMatches = Number(total);
    } else if (video.matches) {
        numMatches = video.matches.length;
    }
    return (
        <ListItem key={url} disablePadding sx={{ display: 'block', scrollMarginTop: 64 }}>
        <ListItemButton ref={headerRef} onClick={() => handleClickSubtitleListItem(url, video, i)}>
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
            {isOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItemButton>
        <Collapse in={isOpen} timeout="auto" unmountOnExit onEntered={() => setPlayerReady(true)} onExit={onCollapseVideoListItem}>
            <Paper elevation={2}>
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: effectiveTheatre ? 'row' : 'column',
                }}
            >
                <Box
                    sx={effectiveTheatre ? {
                        flex: 1,
                        minWidth: 0,
                        display: 'flex',
                        flexDirection: 'column',
                    } : {
                        display: 'flex',
                        flexDirection: 'column',
                    }}
                >
                    <Box
                        sx={effectiveTheatre ? {
                            position: 'relative',
                            aspectRatio: '16 / 9',
                            width: '100%',
                            maxHeight: '80vh',
                            '& > div, & iframe': {
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '100%'
                            }
                        } : {
                            '& > div, & iframe': {
                                width: '100%',
                                maxWidth: 640,
                                aspectRatio: '16 / 9',
                                height: 'auto'
                            }
                        }}
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
                            }
                        }}
                        onReady={_onReady}/>
                        ) : null}
                    </Box>
                    <Box>
                        {!isMobile ? (
                            <IconButton
                                onClick={toggleTheatreMode}
                                color={effectiveTheatre ? 'primary' : 'default'}
                                aria-label="Toggle theatre mode"
                                title={effectiveTheatre ? 'Exit theatre mode' : 'Enter theatre mode'}
                            >
                                <AspectRatioIcon />
                            </IconButton>
                        ) : null}
                        <IconButton onClick={toggleVideoOptions}>
                            <MoreVertIcon />
                        </IconButton>
                    </Box>
                </Box>
                <Box
                    ref={ref}
                    sx={effectiveTheatre ? {
                        width: 400,
                        alignSelf: 'stretch',
                        overflow: 'hidden'
                    } : undefined}
                />
            </Box>
            </Paper>
        </Collapse>
        </ListItem>
    );
});

export default VideoListItem;
