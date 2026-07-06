import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { ListImperativeAPI } from 'react-window';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import ListSubheader from '@mui/material/ListSubheader';
import List from '@mui/material/List';
import LinearProgress from '@mui/material/LinearProgress';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import SubtitleList from './SubtitleList';
import VideoListItem from './VideoListItem';
import VideoExportPopper from './VideoExportPopper';
import MobileOptionsPopper from './MobileOptionsPopper';
import BookmarkPickerMenu from './BookmarkPickerMenu';
import type {
  SearchResult,
  SubtitleWithVideo,
  TagsMap,
  Video,
  YouTubePlayer,
  LiveCurrentVideo,
} from '@/types';
import type { Collection } from '@/utils/bookmarks';

/**
 * Snackbar payload returned from the page-level bookmark handlers.
 * A handler may return null/undefined to indicate "no message" (e.g. when the
 * operation was a no-op because the active collection wasn't set).
 */
export type BookmarkHandlerResult = { message: string } | null | undefined;

interface CurrentVideoRef {
  url: string;
  i: number;
}

export interface SearchListProps {
  isLoading: boolean;
  isLoadingSubtitle: boolean;
  showTags: boolean;
  syncSubtitles: boolean;
  setSyncSubtitles?: (next: boolean) => void;
  showMatchPreviews: boolean;
  searchResult?: SearchResult;
  text?: string;
  /** True in the /bookmarks page; suppresses pagination and tweaks copy. */
  bookmarksMode?: boolean;
  noMoreResultsToFetch?: boolean;
  onFetchMoreResults: (node: HTMLElement | null) => void;
  onFetchMoreSubtitles: (node: HTMLElement | null, i: number, url: string) => void;
  fetchSubtitles: (i: number, url: string, fetchAll?: boolean) => unknown;
  tags: TagsMap;
  collections: Collection[];
  lastUsedCollectionName?: string;
  bookmarkedIdsByVideoUrl?: Map<string, Set<string>>;
  bookmarkedCollectionIdsByItemId?: Map<string, Set<string>>;
  /** Toggle bookmark on default collection. Omit to hide bookmark controls entirely. */
  onBookmarkToggle?: (subtitle: SubtitleWithVideo) => BookmarkHandlerResult;
  onOpenBookmarkPicker?: (subtitle: SubtitleWithVideo) => void;
  /** Pick a specific collection from the picker. Omit to hide picker controls. */
  onPickCollection?: (collection: Collection, subtitle: SubtitleWithVideo) => BookmarkHandlerResult;
  /** Create a new collection from the picker. Omit to hide the picker's "new collection" affordance. */
  onCreateCollection?: (name: string, subtitle: SubtitleWithVideo) => BookmarkHandlerResult;
  isAdmin?: boolean;
  onClickEdit?: (video: Video) => void;
}

export default function SearchList(props: SearchListProps) {
  const {
    isLoading,
    isLoadingSubtitle,
    showTags,
    syncSubtitles,
    setSyncSubtitles,
    showMatchPreviews,
    onBookmarkToggle,
    onOpenBookmarkPicker,
    onPickCollection,
    onCreateCollection,
    collections,
    lastUsedCollectionName,
    bookmarkedIdsByVideoUrl,
    bookmarkedCollectionIdsByItemId,
  } = props;

  const player = useRef<YouTubePlayer | null>(null);
  const subtitleContainerRef = useRef<ListImperativeAPI | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [currentTime, setCurrentTime] = useState<number | null>(null);
  const [videoOptionsAnchorEl, setVideoOptionsAnchorEl] = useState<HTMLElement | null>(null);
  const [mobileOptionsAnchorEl, setMobileOptionsAnchorEl] = useState<HTMLElement | null>(null);
  const [hostEl, setHostEl] = useState<HTMLElement | null>(null);
  const [currentVideo, setCurrentVideo] = useState<CurrentVideoRef | null>(null);
  const [popperSubtitle, setPopperSubtitle] = useState<SubtitleWithVideo | null>(null);
  const [bookmarkPickerAnchorEl, setBookmarkPickerAnchorEl] = useState<HTMLElement | null>(null);
  const [bookmarkPickerSubtitle, setBookmarkPickerSubtitle] = useState<SubtitleWithVideo | null>(
    null
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [theatreMode, setTheatreMode] = useState<boolean>(() => {
    return localStorage.getItem('settings-theatreMode') === 'true';
  });

  const toggleTheatreMode = useCallback(() => {
    setTheatreMode((prev) => {
      const next = !prev;
      localStorage.setItem('settings-theatreMode', String(next));
      return next;
    });
  }, []);

  const handleClickSubtitleListItem = useCallback(
    (key: string, video: Video, i: number) => {
      if (open === key) {
        setOpen(null);
        setCurrentVideo(null);
      } else {
        setOpen(key);
        setCurrentVideo({ url: video.url, i });
      }
    },
    [open]
  );

  const handleClickMobileSubtitleOption = useCallback(
    (event: React.MouseEvent<HTMLElement>, subtitleData: SubtitleWithVideo) => {
      if (mobileOptionsAnchorEl === event.currentTarget) {
        return;
      }
      setMobileOptionsAnchorEl(event.currentTarget);
      setPopperSubtitle(subtitleData);
    },
    [mobileOptionsAnchorEl]
  );

  const onCollapseVideoListItem = useCallback(() => {
    setVideoOptionsAnchorEl(null);
    setMobileOptionsAnchorEl(null);
  }, []);

  const handleClickSubtitle = useCallback((startTime: number) => {
    player.current?.seekTo(startTime);
  }, []);

  const showSnackbar = useCallback((message: string) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  }, []);

  const handleClickCopy = useCallback(
    (event: React.MouseEvent<HTMLElement>, text: string) => {
      event.stopPropagation();
      navigator.clipboard.writeText(text);
      showSnackbar('Copied!');
    },
    [showSnackbar]
  );

  const toggleVideoOptions = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setVideoOptionsAnchorEl((prev) => (prev ? null : event.currentTarget));
  }, []);

  const handleBookmarkToggle = useCallback(
    (subtitleData: SubtitleWithVideo) => {
      if (!onBookmarkToggle) return;
      const result = onBookmarkToggle(subtitleData);
      if (result && result.message) showSnackbar(result.message);
    },
    [onBookmarkToggle, showSnackbar]
  );

  const handleOpenBookmarkPicker = useCallback(
    (anchorEl: HTMLElement, subtitleData: SubtitleWithVideo) => {
      setBookmarkPickerAnchorEl(anchorEl);
      setBookmarkPickerSubtitle(subtitleData);
      if (onOpenBookmarkPicker) onOpenBookmarkPicker(subtitleData);
    },
    [onOpenBookmarkPicker]
  );

  const handleCloseBookmarkPicker = useCallback(() => {
    setBookmarkPickerAnchorEl(null);
    setBookmarkPickerSubtitle(null);
  }, []);

  const handlePickCollection = useCallback(
    (collection: Collection, subtitleData: SubtitleWithVideo | null) => {
      if (!onPickCollection || !subtitleData) return;
      const result = onPickCollection(collection, subtitleData);
      if (result && result.message) showSnackbar(result.message);
    },
    [onPickCollection, showSnackbar]
  );

  const handleCreateCollection = useCallback(
    (name: string, subtitleData: SubtitleWithVideo | null) => {
      if (!onCreateCollection || !subtitleData) return;
      try {
        const result = onCreateCollection(name, subtitleData);
        if (result && result.message) showSnackbar(result.message);
      } catch (err) {
        showSnackbar(err instanceof Error ? err.message : String(err));
      }
    },
    [onCreateCollection, showSnackbar]
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (syncSubtitles && player.current) {
      interval = setInterval(() => {
        const t = player.current?.getCurrentTime();
        if (t !== undefined) setCurrentTime(Math.floor(t));
      }, 1000);
    } else {
      setCurrentTime(null);
    }
    return () => {
      if (interval !== undefined) clearInterval(interval);
    };
  }, [syncSubtitles, player.current]);

  const _onReady = useCallback((event: { target: YouTubePlayer }) => {
    player.current = event.target;
  }, []);

  let searchResultText: string;
  if (props.bookmarksMode) {
    searchResultText = `Displaying ${props.searchResult?.length || 0} bookmarked video${
      (props.searchResult?.length || 0) === 1 ? '' : 's'
    }.`;
  } else if (!props.text) {
    searchResultText = props.noMoreResultsToFetch
      ? `Displaying all ${props.searchResult?.length || 0} videos.`
      : `Displaying ${props.searchResult?.length || 0} videos...`;
  } else if (!props.searchResult?.length) {
    searchResultText = `No results for "${props.text}".`;
  } else {
    searchResultText = props.noMoreResultsToFetch
      ? `Displaying results from ${props.searchResult.length} video${
          props.searchResult.length > 1 ? 's' : ''
        } for "${props.text}".`
      : `Displaying results from ${props.searchResult.length} video${
          props.searchResult.length > 1 ? 's' : ''
        } for "${props.text}"...`;
  }

  const liveCurrentVideo = useMemo<LiveCurrentVideo | null>(() => {
    if (!currentVideo) return null;
    const idx = props.searchResult?.findIndex((v) => v.url === currentVideo.url);
    if (idx === undefined || idx < 0 || !props.searchResult) return null;
    return { video: props.searchResult[idx], i: idx };
  }, [currentVideo, props.searchResult]);

  useEffect(() => {
    if (currentVideo && !liveCurrentVideo) {
      setOpen(null);
      setCurrentVideo(null);
    }
  }, [currentVideo, liveCurrentVideo]);

  const currentVideoBookmarkedIds = useMemo(() => {
    if (!liveCurrentVideo || !bookmarkedIdsByVideoUrl) return new Set<string>();
    return bookmarkedIdsByVideoUrl.get(liveCurrentVideo.video.url) || new Set<string>();
  }, [liveCurrentVideo, bookmarkedIdsByVideoUrl]);

  return props.searchResult ? (
    <>
      <ListSubheader component="div" sx={{ zIndex: 0, lineHeight: 1.5 }}>
        {searchResultText}
        {lastUsedCollectionName && onBookmarkToggle ? (
          <Typography component="span" variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
            Bookmarks save to: <strong>{lastUsedCollectionName}</strong>
          </Typography>
        ) : null}
      </ListSubheader>
      <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
        {props.searchResult.map((video, i) => {
          return (
            <VideoListItem
              key={video.url}
              {...{
                video,
                open,
                onCollapseVideoListItem,
                handleClickSubtitleListItem,
                i,
                showTags,
                showMatchPreviews,
                toggleVideoOptions,
                _onReady,
                text: props.text,
                tags: props.tags,
                onFetchMoreSubtitles: props.onFetchMoreSubtitles,
                setHostEl,
                isMobile,
                theatreMode: open === video.url ? theatreMode : undefined,
                isAdmin: props.isAdmin,
                onClickEdit: props.onClickEdit,
              }}
            />
          );
        })}
      </List>
      {!props.searchResult?.length ? (
        ''
      ) : props.noMoreResultsToFetch ? (
        <ListSubheader component="div" sx={{ zIndex: 0 }}>
          No more results to show.
        </ListSubheader>
      ) : (
        <LinearProgress
          ref={props.onFetchMoreResults}
          sx={{ visibility: isLoading ? 'visible' : 'hidden' }}
        />
      )}
      <Snackbar
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        open={snackbarOpen}
        onClose={() => setSnackbarOpen(false)}
        autoHideDuration={3000}
        message={snackbarMessage}
      />
      <VideoExportPopper
        anchorEl={videoOptionsAnchorEl}
        onClose={() => setVideoOptionsAnchorEl(null)}
        liveCurrentVideo={liveCurrentVideo}
        player={player}
        bookmarksMode={props.bookmarksMode}
        isLoadingSubtitle={isLoadingSubtitle}
        fetchSubtitles={props.fetchSubtitles}
        onError={showSnackbar}
        isMobile={isMobile}
        theatreMode={theatreMode}
        toggleTheatreMode={toggleTheatreMode}
        syncSubtitles={syncSubtitles}
        setSyncSubtitles={setSyncSubtitles}
      />
      <MobileOptionsPopper
        anchorEl={mobileOptionsAnchorEl}
        onClose={() => setMobileOptionsAnchorEl(null)}
        isPickerOpen={!!bookmarkPickerAnchorEl}
        subtitle={popperSubtitle}
        bookmarkedIdsByVideoUrl={bookmarkedIdsByVideoUrl}
        onCopy={handleClickCopy}
        onBookmarkToggle={onBookmarkToggle ? handleBookmarkToggle : undefined}
        onOpenBookmarkPicker={
          onOpenBookmarkPicker || onPickCollection ? handleOpenBookmarkPicker : undefined
        }
        showBookmarkControls={!!(onBookmarkToggle || onOpenBookmarkPicker || onPickCollection)}
      />
      <BookmarkPickerMenu
        anchorEl={bookmarkPickerAnchorEl}
        subtitle={bookmarkPickerSubtitle}
        collections={collections}
        bookmarkedCollectionIdsByItemId={bookmarkedCollectionIdsByItemId}
        onClose={handleCloseBookmarkPicker}
        onPickCollection={handlePickCollection}
        onCreateCollection={handleCreateCollection}
      />
      <SubtitleList
        {...{
          subtitleContainerRef,
          video: liveCurrentVideo?.video,
          handleClickSubtitle,
          handleClickCopy,
          currentTime,
          onFetchMoreSubtitles: props.onFetchMoreSubtitles,
          i: liveCurrentVideo?.i,
          isLoadingSubtitle,
          rowHeight: isMobile || theatreMode ? 120 : 96,
          hostEl,
          handleClickMobileSubtitleOption,
          bookmarkedIds: currentVideoBookmarkedIds,
          onBookmarkToggle: onBookmarkToggle ? handleBookmarkToggle : undefined,
          onOpenBookmarkPicker:
            onOpenBookmarkPicker || onPickCollection ? handleOpenBookmarkPicker : undefined,
          lastUsedCollectionName,
          theatreMode: theatreMode && !isMobile,
        }}
      />
    </>
  ) : (
    ''
  );
}
