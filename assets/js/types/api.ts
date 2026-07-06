export interface Subtitle {
  subtitleId: number;
  startTime: number;
  endTime?: number;
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
  /**
   * One of the named MUI palette keys that this app's theme actually maps. Excludes
   * `'default'` deliberately — the Chip background lookup `theme.palette[color][mode]`
   * has no entry for `default`, so allowing it would silently render undefined.
   */
  color: 'primary' | 'secondary' | 'info' | 'error' | 'success' | 'warning';
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

export interface FallbackCandidate {
  subtitleId: number;
  videoUrl: string;
  startTime: number;
  text: string;
  timestamp: string;
  title: string;
}
