import { memo, useEffect } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';

const SubtitleListItem = memo(function SubtitleListItem(props) {
    const { index, video, currentTime, handleClickSubtitle, handleClickCopy, setCurrentSubtitle, handleClickMobileSubtitleOption } = props;
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
                <IconButton edge="end" aria-label="subtitle-options" title='More options' onClick={(e) => handleClickMobileSubtitleOption(e, text, url, startTime)}>
                    <MoreVertIcon />
                </IconButton>
            </Box>
        </ListItem>
    );
});

export default SubtitleListItem;
