import { memo, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import LinearProgress from '@mui/material/LinearProgress';
import { List as FixedSizeList } from 'react-window';
import SubtitleListItem from './SubtitleListItem';
import MatchListItem from './MatchListItem';

const SubtitleList = memo(function SubtitleList(props) {
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
        handleClickMobileSubtitleOption
    } = props;
    if (!hostEl || !video) return null;
    const { url } = video;
    const activeIndex = useMemo(() => {
        if (currentTime === null || !video.subtitles) return -1;
        return video.subtitles.findIndex((s, i) => {
            const next = video.subtitles[i + 1];
            return currentTime >= s.startTime && currentTime < (next ? next.startTime : Infinity);
        });
    }, [currentTime, video.subtitles]);
    useEffect(() => {
        if (activeIndex >= 0 && subtitleContainerRef.current) {
            subtitleContainerRef.current.scrollToRow({align: 'start', index: activeIndex})
        }
    }, [activeIndex]);
    return createPortal(
        <>
        {video.subtitles ? <FixedSizeList
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
            listRef={subtitleContainerRef}
            rowComponent={SubtitleListItem}
            rowCount={video.subtitles.length}
            rowHeight={rowHeight}
            rowProps={{
                video,
                handleClickSubtitle,
                handleClickCopy,
                activeIndex,
                handleClickMobileSubtitleOption
            }}
        /> : video.matches ? <FixedSizeList
            style={{ maxHeight: '50vh', overflowY: 'auto' }}
            listRef={subtitleContainerRef}
            rowComponent={MatchListItem}
            rowCount={video.matches.length}
            rowHeight={rowHeight}
            rowProps={{
                matches: video.matches
            }}
        /> : null}
        {((!video.matches && !video.subtitles) || video.matches || video.noMoreSubtitlesToFetch) ? '' : <LinearProgress ref={(node) => onFetchMoreSubtitles(node, i, url)} sx={{ visibility: isLoadingSubtitle ? "visible" : "hidden" }}/>}
        </>
    , hostEl);
});

export default SubtitleList;
