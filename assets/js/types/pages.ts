import type { SearchResult, Subtitle, TagsMap, SearchParams, BookmarksSort } from './api';

export interface SearchPageProps {
    searchParams: SearchParams;
    tags: TagsMap;
    searchResult?: SearchResult;
    subtitleResult?: Subtitle[];
    allSubtitlesFetched?: boolean;
    noMoreResultsToFetch?: boolean;
    fatalError?: string;
}

export interface BookmarksPageProps {
    tags: TagsMap;
    sort: BookmarksSort;
    searchResult: SearchResult;
    unresolvedIds: number[];
    noMoreResultsToFetch?: boolean;
    fatalError?: string;
}
