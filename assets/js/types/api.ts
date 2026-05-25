/**
 * Types describing the JSON shapes the Sails controllers return to the React frontend.
 */

export interface Subtitle {
    subtitleId: number;
    startTime: number;
    timestamp: string;
    text: string;
}

export interface Match {
    text: string;
}

export interface Video {
    url: string;
    title: string;
    date: string;
    tags: string[];
    subtitles?: Subtitle[];
    matches?: Match[];
    total?: number;
    /** Set client-side after a "Load all subtitles" round-trip completes. */
    allSubtitlesFetched?: boolean;
    /** Set client-side once the subtitle paginator has run out. */
    noMoreSubtitlesToFetch?: boolean;
}

export type SearchResult = Video[];

export interface TagDescriptor {
    text: string;
    color: 'primary' | 'secondary' | 'info' | 'default' | 'error' | 'success' | 'warning';
    order: number;
}

export type TagsMap = Record<string, TagDescriptor>;

export interface SearchParams {
    text?: string;
    isFullTextSearch?: boolean;
    title?: string;
    isAscending?: boolean;
    startDate?: string;
    endDate?: string;
    includeTags?: string[];
    excludeTags?: string[];
}

export type BookmarksSort = 'recency' | 'dateAsc' | 'dateDesc';

export interface FallbackCandidate {
    subtitleId: number;
    videoUrl: string;
    startTime: number;
    text: string;
    timestamp: string;
    title: string;
}
