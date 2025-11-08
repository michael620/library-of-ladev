import { memo, useEffect, useRef } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
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
        <Collapse in={open===url} timeout="auto" unmountOnExit onExit={onCollapseVideoListItem}>
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

export default VideoListItem;
