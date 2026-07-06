import {
  memo,
  useEffect,
  useMemo,
  type MutableRefObject,
  type CSSProperties,
  type ReactElement,
} from 'react';
import { createPortal } from 'react-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { List as FixedSizeList, type ListImperativeAPI } from 'react-window';
import SubtitleListItem, { type SubtitleListItemRowProps } from './SubtitleListItem';
import MatchListItem, { type MatchListItemRowProps } from './MatchListItem';
import type { SubtitleWithVideo, Video } from '@/types';

/** react-window injects these on every row component. */
type RowCommon = {
  ariaAttributes: { 'aria-posinset': number; 'aria-setsize': number; role: 'listitem' };
  index: number;
  style: CSSProperties;
};

// memo() widens the return type to ReactNode, but react-window's rowComponent
// expects (props) => ReactElement | null. These casts narrow the declared
// return type so TS accepts the components.
const SubtitleRow = SubtitleListItem as unknown as (
  props: RowCommon & SubtitleListItemRowProps
) => ReactElement | null;
const MatchRow = MatchListItem as unknown as (
  props: RowCommon & MatchListItemRowProps
) => ReactElement | null;

export interface SubtitleListProps {
  subtitleContainerRef: MutableRefObject<ListImperativeAPI | null>;
  video: Video | null | undefined;
  i: number | undefined;
  handleClickSubtitle: (startTime: number) => void;
  currentTime: number | null;
  handleClickCopy: (event: React.MouseEvent<HTMLElement>, text: string) => void;
  isLoadingSubtitle: boolean;
  hostEl: HTMLElement | null;
  rowHeight: number;
  onFetchMoreSubtitles: (node: HTMLElement | null, i: number, url: string) => void;
  handleClickMobileSubtitleOption: (
    event: React.MouseEvent<HTMLElement>,
    subtitle: SubtitleWithVideo
  ) => void;
  bookmarkedIds?: Set<string>;
  onBookmarkToggle?: (subtitle: SubtitleWithVideo) => void;
  onOpenBookmarkPicker?: (anchorEl: HTMLElement, subtitle: SubtitleWithVideo) => void;
  lastUsedCollectionName?: string;
  theatreMode?: boolean;
}

const SubtitleList = memo(function SubtitleList(props: SubtitleListProps) {
  const {
    subtitleContainerRef,
    video,
    i,
    handleClickSubtitle,
    currentTime,
    handleClickCopy,
    isLoadingSubtitle,
    hostEl,
    rowHeight,
    onFetchMoreSubtitles,
    handleClickMobileSubtitleOption,
    bookmarkedIds,
    onBookmarkToggle,
    onOpenBookmarkPicker,
    lastUsedCollectionName,
    theatreMode,
  } = props;
  const url = video?.url;
  const maxHeight = theatreMode ? '80vh' : '50vh';
  const activeIndex = useMemo(() => {
    if (currentTime === null || !video?.subtitles) return -1;
    const subs = video.subtitles;
    return subs.findIndex((s, idx) => {
      const next = subs[idx + 1];
      return currentTime >= s.startTime && currentTime < (next ? next.startTime : Infinity);
    });
  }, [currentTime, video?.subtitles]);
  useEffect(() => {
    if (activeIndex >= 0 && subtitleContainerRef.current) {
      subtitleContainerRef.current.scrollToRow({ align: 'start', index: activeIndex });
    }
  }, [activeIndex]);
  if (!hostEl || !video) return null;
  return createPortal(
    <>
      {video.subtitles ? (
        <FixedSizeList
          style={{ maxHeight, overflowY: 'auto' }}
          listRef={subtitleContainerRef}
          rowComponent={SubtitleRow}
          rowCount={video.subtitles.length}
          rowHeight={rowHeight}
          rowProps={{
            video,
            handleClickSubtitle,
            handleClickCopy,
            activeIndex,
            handleClickMobileSubtitleOption,
            bookmarkedIds,
            onBookmarkToggle,
            onOpenBookmarkPicker,
            lastUsedCollectionName,
            theatreMode,
          }}
        />
      ) : video.matches ? (
        <FixedSizeList
          style={{ maxHeight, overflowY: 'auto' }}
          listRef={subtitleContainerRef}
          rowComponent={MatchRow}
          rowCount={video.matches.length}
          rowHeight={rowHeight}
          rowProps={{
            matches: video.matches,
          }}
        />
      ) : null}
      {(!video.matches && !video.subtitles) || video.matches || video.noMoreSubtitlesToFetch ? (
        ''
      ) : (
        <LinearProgress
          ref={(node: HTMLDivElement | null) => {
            if (i !== undefined && url) onFetchMoreSubtitles(node, i, url);
          }}
          sx={{ visibility: isLoadingSubtitle ? 'visible' : 'hidden' }}
        />
      )}
    </>,
    hostEl
  );
});

export default SubtitleList;
