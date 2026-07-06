import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import LinkIcon from '@mui/icons-material/Link';
import ArticleIcon from '@mui/icons-material/Article';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import type { SubtitleWithVideo } from '@/types';

export interface MobileOptionsPopperProps {
  anchorEl: HTMLElement | null;
  onClose?: () => void;
  isPickerOpen?: boolean;
  subtitle: SubtitleWithVideo | null;
  bookmarkedIdsByVideoUrl?: Map<string, Set<string>>;
  onCopy: (event: React.MouseEvent<HTMLElement>, text: string) => void;
  onBookmarkToggle?: (subtitle: SubtitleWithVideo) => void;
  onOpenBookmarkPicker?: (anchorEl: HTMLElement, subtitle: SubtitleWithVideo) => void;
  showBookmarkControls: boolean;
}

export default function MobileOptionsPopper(props: MobileOptionsPopperProps) {
  const {
    anchorEl,
    onClose,
    isPickerOpen,
    subtitle,
    bookmarkedIdsByVideoUrl,
    onCopy,
    onBookmarkToggle,
    onOpenBookmarkPicker,
    showBookmarkControls,
  } = props;
  const open = Boolean(anchorEl);
  const isBookmarked =
    subtitle && bookmarkedIdsByVideoUrl
      ? (bookmarkedIdsByVideoUrl.get(subtitle.videoUrl) || new Set<string>()).has(
          String(subtitle.subtitleId)
        )
      : false;
  const close = () => {
    if (onClose) onClose();
  };
  const handleClickAway = () => {
    if (isPickerOpen) return;
    close();
  };
  const onPopperKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };
  return (
    <Popper
      id={open ? 'subtitle-options-popper' : undefined}
      open={open}
      anchorEl={anchorEl}
      placement="bottom-end"
    >
      <ClickAwayListener onClickAway={handleClickAway}>
        <Box
          display="flex"
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          sx={{ gap: 2, pr: 2 }}
          onKeyDown={onPopperKeyDown}
        >
          <IconButton
            edge="end"
            aria-label="copy-text"
            title="Copy text to clipboard"
            onClick={(e) => {
              onCopy(e, subtitle?.text || '');
              close();
            }}
          >
            <ArticleIcon />
          </IconButton>
          <IconButton
            edge="end"
            aria-label="copy-link"
            title="Copy YouTube link to clipboard"
            onClick={(e) => {
              onCopy(
                e,
                `https://www.youtube.com/watch?v=${subtitle?.videoUrl}&t=${subtitle?.startTime}s`
              );
              close();
            }}
          >
            <LinkIcon />
          </IconButton>
          {showBookmarkControls && subtitle ? (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {onBookmarkToggle ? (
                <IconButton
                  edge="end"
                  aria-label={isBookmarked ? 'remove-bookmark' : 'add-bookmark'}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                  onClick={(e) => {
                    e.stopPropagation();
                    onBookmarkToggle(subtitle);
                    close();
                  }}
                >
                  {isBookmarked ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              ) : null}
              {onOpenBookmarkPicker ? (
                <IconButton
                  size="small"
                  aria-label="bookmark-picker"
                  title="Save to collection..."
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenBookmarkPicker(e.currentTarget, subtitle);
                  }}
                  sx={{ p: 0.25 }}
                >
                  <ArrowDropDownIcon fontSize="small" />
                </IconButton>
              ) : null}
            </Box>
          ) : null}
        </Box>
      </ClickAwayListener>
    </Popper>
  );
}
