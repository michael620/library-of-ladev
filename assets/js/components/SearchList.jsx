import * as React from 'react';
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
import Paper from '@mui/material/Paper';
import Tooltip from '@mui/material/Tooltip';
import { Box, Typography } from '@mui/material';
import YouTube from 'react-youtube';
import ErrorIcon from '@mui/icons-material/Error';

export default function SearchList(props) {
    const player = React.useRef(null);
    const [open, setOpen] = React.useState(-1);

    const handleClick = (i) => {
        if (open === i) {
            setOpen(-1);
        } else {
            setOpen(i);
        }
    };

    const handleClickSubtitle = (startTime) => {
        player.current.seekTo(startTime);
    };

    const opts = {
        playerVars: {
            // https://developers.google.com/youtube/player_parameters
            autoplay: 0,
        },
    };
    const _onReady = (event) => {
        player.current = event.target;
    }

    const renderSearchResult = (video) => {
        if (video.subtitles) {
            return video.subtitles.map((subtitle, j) => (
                <ListItemButton key={j} onClick={() => handleClickSubtitle(subtitle.startTime)}>
                    <ListItemText primary={`${subtitle.text}`} secondary={`Timestamp: ${subtitle.timestamp}`} />
                </ListItemButton>
            ))
        } else if (video.matches) {
            return video.matches.map((match, j) => (
                <ListItem key={j}>
                    <ListItemText primary={<Typography dangerouslySetInnerHTML={{ __html: `<p>${match.text}</p>` }}></Typography>} />
                </ListItem>
            ))
        } else {
            return '';
        }
    }

    const messageIcon = props.searchResult.message ? <Tooltip title={props.searchResult.message}><ErrorIcon sx={{margin:1}}/></Tooltip> : '';

    return (
        <List
            sx={{ width: '100%', bgcolor: 'background.paper' }}
            component="nav"
            aria-labelledby="nested-list-subheader"
            subheader={
                props.queryText ? <><ListSubheader component="div" id="nested-list-subheader">
                {messageIcon}{`Found ${messageIcon ? 'more than ' : ''}${props.searchResult.rows} result${props.searchResult.rows > 1 ? 's' : ''} in ${Object.keys(props.searchResult.results).length} video${Object.keys(props.searchResult.results).length > 1 ? 's' : ''} for "${props.queryText}"`}
            </ListSubheader></> : ''
            }
        >
            {Object.keys(props.searchResult.results).map((url, i) => {
                const video = props.searchResult.results[url];
                const matches = video.subtitles ? video.subtitles.length : video.matches.length;
                return (
                    <Box key={i}>
                    <ListItemButton onClick={() => handleClick(i)}>
                        <ListItemAvatar>
                            <Avatar alt="YouTube thumbnail" src={`https://img.youtube.com/vi/${video.url}/default.jpg`} />
                        </ListItemAvatar>
                        <ListItemText primary={`${video.title} - ${video.date}`} secondary={`${matches} matches`} />
                        {open===i ? <ExpandLess /> : <ExpandMore />}
                    </ListItemButton>
                    <Collapse in={open===i} timeout="auto" unmountOnExit>
                        <Paper elevation={2} key={i}>
                        <List component="div" disablePadding>
                        <Box sx={{padding: '1rem'}}>
                            <YouTube videoId={video.url} opts={opts} onReady={_onReady}/>
                        </Box>
                            {renderSearchResult(video)}
                        </List>
                        </Paper>
                    </Collapse>
                    </Box>
                );
            })}
    </List>
    );
}
