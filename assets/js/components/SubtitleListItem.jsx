import { memo } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';

const SubtitleListItem = memo(function SubtitleListItem(props) {
    const {
        index,
        video,
        activeIndex,
        handleClickSubtitle,
        handleClickCopy,
        handleClickMobileSubtitleOption,
        bookmarkedIds,
        onBookmarkToggle,
        onOpenBookmarkPicker,
        lastUsedCollectionName
    } = props;
    if (!video) return null;
    const { url, subtitles } = video;
    const subtitle = subtitles[index];
    const { startTime, timestamp, text, subtitleId } = subtitle;
    const isActive = index === activeIndex;
    const showBookmark = !!onBookmarkToggle && subtitleId !== undefined && subtitleId !== null;
    const isBookmarked = showBookmark && bookmarkedIds && bookmarkedIds.has(String(subtitleId));
    const baseStyles = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 0,
        paddingBottom: 0
    };
    const primaryText = <Typography height={{ xs: '4.5rem', sm: '3rem' }} sx={{overflowWrap: 'break-word', wordBreak: 'break-word', overflow: 'auto'}}>{text}</Typography>;
    const subtitleData = { subtitleId, videoUrl: url, startTime, text, timestamp };
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
                {showBookmark ? (
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            edge="end"
                            aria-label={isBookmarked ? 'remove-bookmark' : 'add-bookmark'}
                            title={isBookmarked
                                ? (lastUsedCollectionName ? `Remove from ${lastUsedCollectionName}` : 'Remove bookmark')
                                : (lastUsedCollectionName ? `Save to ${lastUsedCollectionName}` : 'Bookmark')}
                            onClick={(e) => { e.stopPropagation(); onBookmarkToggle(subtitleData); }}
                        >
                            {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                        </IconButton>
                        {onOpenBookmarkPicker ? (
                            <IconButton
                                size="small"
                                aria-label="bookmark-picker"
                                title='Save to collection...'
                                onClick={(e) => { e.stopPropagation(); onOpenBookmarkPicker(e.currentTarget, subtitleData); }}
                                sx={{ p: 0.25 }}
                            >
                                <ArrowDropDownIcon fontSize="small" />
                            </IconButton>
                        ) : null}
                    </Box>
                ) : null}
            </Box>
            <Box flexDirection='row' justifyContent='center' alignItems='center' sx={{gap:2, pr:2, display: { xs: 'flex', 'sm': 'none' }}}>
                <IconButton edge="end" aria-label="subtitle-options" title='More options' onClick={(e) => handleClickMobileSubtitleOption(e, subtitleData)}>
                    <MoreVertIcon />
                </IconButton>
            </Box>
        </ListItem>
    );
});

export default SubtitleListItem;
