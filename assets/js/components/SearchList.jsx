import { memo, useRef, useState, useCallback } from 'react';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Collapse from '@mui/material/Collapse';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Avatar from '@mui/material/Avatar';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import LinearProgress from '@mui/material/LinearProgress';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import YouTube from 'react-youtube';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { TAGS } from '../../../shared/constants';

const SubtitleListItem = memo((props) => {
    const { handleClickSubtitle, text, startTime, timestamp, url, handleClickCopy, snackbarOpen, setSnackbarOpen } = props;
    return (
        <>
            <ListItem style={props.style} sx={{paddingTop: 0, paddingBottom: 0}} secondaryAction={
                <IconButton edge="end" aria-label="copy" title='Copy YouTube link to clipboard' onClick={(e) => handleClickCopy(e, url, startTime)}>
                    <ContentCopyIcon />
                </IconButton>
            }>
                <ListItemButton onClick={() => handleClickSubtitle(startTime)}>
                    <ListItemText primary={`${text}`} secondary={`Timestamp: ${timestamp}`} />
                </ListItemButton>
            </ListItem>
            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                autoHideDuration={3000}
                message="Copied!"
            />
        </>
    )
});

export default function SearchList(props) {
    const { isLoading, isLoadingSubtitle, showTags } = props;
    const player = useRef(null);
    const [open, setOpen] = useState(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);

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

    const handleClickCopy = useCallback((event, url, startTime) => {
        event.stopPropagation();
        navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${url}&t=${startTime}s`);
        setSnackbarOpen(true);
    }, [snackbarOpen]);

    const opts = {
        playerVars: {
            // https://developers.google.com/youtube/player_parameters
            autoplay: 0,
        },
    };
    const _onReady = (event) => {
        player.current = event.target;
    }

    const searchResultText = !props.searchResult?.length ? `No results for "${props.text}".` : props.noMoreResultsToFetch ?
    `Showing results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}".` :
    `Showing results from ${props.searchResult.length} video${props.searchResult.length > 1 ? 's' : ''} for "${props.text}"...`;

    return (
        props.text ? <>
        <ListSubheader component="div" sx={{zIndex: 0, lineHeight: 1.5}}>
            {searchResultText}
        </ListSubheader>
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
        >
            {props.searchResult.map((video, i) => {
                const { url, title, date, total, subtitles, matches } = video;
                const numMatches = subtitles ? Number(total) : matches.length;
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
                                        <Chip key={i} label={tag} size="small" color={TAGS[tag].color}/>
                                    ))}
                                </Box> : ''}
                                <span>{`${numMatches} matches`}</span>
                            </Box>
                        } />
                        {open===url ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={open===url} timeout="auto" unmountOnExit>
                        <Paper elevation={2}>
                        <Box sx={{padding: '1rem'}}>
                            <YouTube videoId={url} opts={opts} onReady={_onReady}/>
                        </Box>
                        <List component="div" disablePadding>
                        <Box sx={{ maxHeight: '50vh', overflowY: 'auto' }}>
                            {
                                video.subtitles ? video.subtitles.map((subtitle, j) => (
                                    <SubtitleListItem
                                        key={j}
                                        handleClickSubtitle={handleClickSubtitle}
                                        text={subtitle.text}
                                        startTime={subtitle.startTime}
                                        timestamp={subtitle.timestamp}
                                        url={url}
                                        handleClickCopy={handleClickCopy}
                                        snackbarOpen={snackbarOpen}
                                        setSnackbarOpen={setSnackbarOpen}
                                    />
                                )) : video.matches ? video.matches.map((match, j) => (
                                    <ListItem key={j}>
                                        <ListItemText primary={<Typography dangerouslySetInnerHTML={{ __html: `${match.text}` }}></Typography>} />
                                    </ListItem>
                                )) : ''
                            }
                            {(video.matches || video.noMoreSubtitlesToFetch) ? '' : <LinearProgress ref={(node) => props.onFetchMoreSubtitles(node, i, url)} sx={{ visibility: isLoadingSubtitle ? "visible" : "hidden" }}/>}
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
        </> : ''
    );
}
