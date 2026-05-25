export interface BookmarkItem {
    id: string;
    subtitleId: number;
    videoUrl: string;
    startTime: number;
    savedAt: number;
}

export interface Collection {
    id: string;
    name: string;
    bookmarkIds: string[];
    createdAt: number;
    updatedAt: number;
}

export interface ItemsMap {
    [id: string]: BookmarkItem;
}

export interface BackupSnapshot {
    text: string;
    timestamp: string;
    videoTitle: string;
    videoDate: string;
    videoTags: string[];
}

export interface BackupItem extends BookmarkItem {
    snapshot?: BackupSnapshot;
}

export interface ImportPayload {
    version: 1;
    kind?: 'backup';
    collection: {
        id?: string;
        name: string;
        createdAt?: number;
        updatedAt?: number;
    };
    items: BackupItem[];
}

export interface BackupViewSubtitle {
    subtitleId: number;
    startTime: number;
    timestamp: string;
    text: string;
}

export interface BackupViewVideo {
    url: string;
    title: string;
    date: string;
    tags: string[];
    subtitles: BackupViewSubtitle[];
    total?: number;
}

export interface BackupView {
    collection: ImportPayload['collection'];
    searchResult: BackupViewVideo[];
    unresolvedCount: number;
    itemCount: number;
}

const ITEMS_KEY = 'bookmarks-items';
const COLLECTIONS_KEY = 'bookmarks-collections';
const LAST_USED_KEY = 'bookmarks-lastUsedCollectionId';

const DEFAULT_COLLECTION_NAME = 'My Bookmarks';
const MAX_ITEMS_PER_IMPORT = 10000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_COLLECTION_NAME_LENGTH = 50;

const readJson = <T>(key: string, fallback: T): T => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
};

const writeJson = (key: string, value: unknown): void => {
    localStorage.setItem(key, JSON.stringify(value));
};

const uuid = (): string => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const makeBookmarkItemId = ({ subtitleId }: { subtitleId: number }): string => String(subtitleId);
export const getItems = (): ItemsMap => readJson<ItemsMap>(ITEMS_KEY, {});
export const getCollections = (): Collection[] => readJson<Collection[]>(COLLECTIONS_KEY, []);
export const getLastUsedCollectionId = (): string | null => localStorage.getItem(LAST_USED_KEY);
export const setLastUsedCollectionId = (id: string): void => localStorage.setItem(LAST_USED_KEY, id);

const setItems = (items: ItemsMap): void => writeJson(ITEMS_KEY, items);
const setCollections = (collections: Collection[]): void => writeJson(COLLECTIONS_KEY, collections);

export const getCollectionById = (id: string): Collection | undefined => getCollections().find(c => c.id === id);

export const ensureDefaultCollection = (): string => {
    const collections = getCollections();
    if (collections.length > 0) {
        const lastUsed = getLastUsedCollectionId();
        if (lastUsed && collections.some(c => c.id === lastUsed)) return lastUsed;
        setLastUsedCollectionId(collections[0].id);
        return collections[0].id;
    }
    const now = Date.now();
    const collection: Collection = {
        id: uuid(),
        name: DEFAULT_COLLECTION_NAME,
        bookmarkIds: [],
        createdAt: now,
        updatedAt: now
    };
    setCollections([collection]);
    setLastUsedCollectionId(collection.id);
    return collection.id;
};

const garbageCollectItems = (collections: Collection[], items: ItemsMap): ItemsMap => {
    const referenced = new Set<string>();
    for (const c of collections) {
        for (const id of c.bookmarkIds) referenced.add(id);
    }
    const next: ItemsMap = {};
    for (const [id, item] of Object.entries(items)) {
        if (referenced.has(id)) next[id] = item;
    }
    return next;
};

export const isInCollection = (collectionId: string, itemId: string): boolean => {
    const c = getCollectionById(collectionId);
    return !!c && c.bookmarkIds.includes(itemId);
};

export interface AddToCollectionInput {
    subtitleId: number;
    videoUrl: string;
    startTime: number;
}

export const addToCollection = (collectionId: string, { subtitleId, videoUrl, startTime }: AddToCollectionInput): string | null => {
    const id = makeBookmarkItemId({ subtitleId });
    const items = getItems();
    if (!items[id]) {
        items[id] = {
            id,
            subtitleId,
            videoUrl,
            startTime,
            savedAt: Date.now()
        };
    }
    const collections = getCollections();
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx === -1) return null;
    if (!collections[idx].bookmarkIds.includes(id)) {
        collections[idx] = {
            ...collections[idx],
            bookmarkIds: [id, ...collections[idx].bookmarkIds],
            updatedAt: Date.now()
        };
    }
    setItems(items);
    setCollections(collections);
    return id;
};

export const removeFromCollection = (collectionId: string, itemId: string): void => {
    const collections = getCollections();
    const idx = collections.findIndex(c => c.id === collectionId);
    if (idx === -1) return;
    const next = collections[idx].bookmarkIds.filter(b => b !== itemId);
    if (next.length === collections[idx].bookmarkIds.length) return;
    collections[idx] = {
        ...collections[idx],
        bookmarkIds: next,
        updatedAt: Date.now()
    };
    setCollections(collections);
    setItems(garbageCollectItems(collections, getItems()));
};

export const assignToCollections = (itemId: string, collectionIdSet: Set<string>): void => {
    const collections = getCollections();
    const now = Date.now();
    const next = collections.map(c => {
        const has = c.bookmarkIds.includes(itemId);
        const should = collectionIdSet.has(c.id);
        if (has === should) return c;
        if (should) {
            return { ...c, bookmarkIds: [itemId, ...c.bookmarkIds], updatedAt: now };
        }
        return { ...c, bookmarkIds: c.bookmarkIds.filter(b => b !== itemId), updatedAt: now };
    });
    setCollections(next);
    setItems(garbageCollectItems(next, getItems()));
};

export const createCollection = (name: string): Collection => {
    const collections = getCollections();
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Collection name cannot be empty');
    if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) throw new Error(`Collection name too long (max ${MAX_COLLECTION_NAME_LENGTH})`);
    const finalName = uniqueName(trimmed, collections.map(c => c.name));
    const now = Date.now();
    const collection: Collection = {
        id: uuid(),
        name: finalName,
        bookmarkIds: [],
        createdAt: now,
        updatedAt: now
    };
    setCollections([...collections, collection]);
    return collection;
};

export const renameCollection = (id: string, name: string): void => {
    const collections = getCollections();
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Collection name cannot be empty');
    if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) throw new Error(`Collection name too long (max ${MAX_COLLECTION_NAME_LENGTH})`);
    const finalName = uniqueName(trimmed, collections.filter(c => c.id !== id).map(c => c.name));
    const next = collections.map(c => c.id === id ? { ...c, name: finalName, updatedAt: Date.now() } : c);
    setCollections(next);
};

export const deleteCollection = (id: string): void => {
    const collections = getCollections().filter(c => c.id !== id);
    setCollections(collections);
    setItems(garbageCollectItems(collections, getItems()));
    if (getLastUsedCollectionId() === id) {
        if (collections.length > 0) setLastUsedCollectionId(collections[0].id);
        else localStorage.removeItem(LAST_USED_KEY);
    }
};

const uniqueName = (desired: string, existing: string[]): string => {
    if (!existing.includes(desired)) return desired;
    let n = 2;
    while (existing.includes(`${desired} (${n})`)) n++;
    return `${desired} (${n})`;
};

export interface LeanExportPayload {
    version: 1;
    collection: {
        id: string;
        name: string;
        createdAt: number;
        updatedAt: number;
    };
    items: BookmarkItem[];
}

export const exportLean = (collectionId: string): LeanExportPayload => {
    const collection = getCollectionById(collectionId);
    if (!collection) throw new Error('Collection not found');
    const items = getItems();
    const collectionItems = collection.bookmarkIds
        .map(id => items[id])
        .filter(Boolean)
        .map(({ id, subtitleId, videoUrl, startTime, savedAt }) => ({
            id, subtitleId, videoUrl, startTime, savedAt
        }));
    return {
        version: 1,
        collection: {
            id: collection.id,
            name: collection.name,
            createdAt: collection.createdAt,
            updatedAt: collection.updatedAt
        },
        items: collectionItems
    };
};

export function validateImport(parsed: unknown, rawByteLength?: number): asserts parsed is ImportPayload {
    if (rawByteLength !== undefined && rawByteLength > MAX_IMPORT_BYTES) {
        throw new Error('Import file too large');
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file');
    const p = parsed as Record<string, unknown>;
    if (p.version !== 1) throw new Error('Unsupported version');
    if (p.kind !== undefined && p.kind !== 'backup') throw new Error('Unknown kind');
    const c = p.collection as Record<string, unknown> | undefined;
    if (!c || typeof c !== 'object' || typeof c.name !== 'string') throw new Error('Missing collection');
    if (!Array.isArray(p.items)) throw new Error('Missing items');
    if (p.items.length > MAX_ITEMS_PER_IMPORT) throw new Error('Too many items');
    for (const item of p.items) {
        if (!item || typeof item !== 'object') throw new Error('Invalid item');
        if (!Number.isInteger(item.subtitleId)) throw new Error('Invalid item.subtitleId');
        if (typeof item.videoUrl !== 'string' || item.videoUrl.length === 0 || item.videoUrl.length > 64) throw new Error('Invalid item.videoUrl');
        if (!Number.isFinite(item.startTime)) throw new Error('Invalid item.startTime');
    }
}

export const importCollection = (parsed: unknown, rawByteLength?: number): Collection => {
    validateImport(parsed, rawByteLength);
    const items = getItems();
    const collections = getCollections();
    const now = Date.now();
    const newBookmarkIds: string[] = [];
    for (const incoming of parsed.items) {
        const id = makeBookmarkItemId({ subtitleId: incoming.subtitleId });
        if (!items[id]) {
            items[id] = {
                id,
                subtitleId: incoming.subtitleId,
                videoUrl: incoming.videoUrl,
                startTime: incoming.startTime,
                savedAt: incoming.savedAt || now
            };
        }
        if (!newBookmarkIds.includes(id)) newBookmarkIds.push(id);
    }
    const finalName = uniqueName(parsed.collection.name.trim() || 'Imported', collections.map(c => c.name));
    const collection: Collection = {
        id: uuid(),
        name: finalName,
        bookmarkIds: newBookmarkIds,
        createdAt: now,
        updatedAt: now
    };
    setItems(items);
    setCollections([...collections, collection]);
    return collection;
};

export const isBackupKind = (parsed: unknown): boolean => (parsed as { kind?: string } | null)?.kind === 'backup';

export const buildBackupView = (parsed: ImportPayload): BackupView => {
    type VideoEntry = BackupViewVideo & { firstOrderIndex?: number };
    const videoMap = new Map<string, VideoEntry>();
    let unresolvedCount = 0;
    parsed.items.forEach((item, i) => {
        if (!item.snapshot) {
            unresolvedCount++;
            return;
        }
        const { text, timestamp, videoTitle, videoDate, videoTags } = item.snapshot;
        let entry = videoMap.get(item.videoUrl);
        if (!entry) {
            entry = {
                url: item.videoUrl,
                title: videoTitle,
                date: videoDate,
                tags: Array.isArray(videoTags) ? videoTags : [],
                subtitles: [],
                firstOrderIndex: i
            };
            videoMap.set(item.videoUrl, entry);
        }
        entry.subtitles.push({
            subtitleId: item.subtitleId,
            startTime: item.startTime,
            timestamp,
            text
        });
    });
    for (const entry of videoMap.values()) {
        entry.subtitles.sort((a, b) => a.startTime - b.startTime);
        entry.total = entry.subtitles.length;
    }
    const searchResult = Array.from(videoMap.values())
        .sort((a, b) => (a.firstOrderIndex ?? 0) - (b.firstOrderIndex ?? 0));
    for (const entry of searchResult) delete entry.firstOrderIndex;
    return {
        collection: parsed.collection,
        searchResult,
        unresolvedCount,
        itemCount: parsed.items.length
    };
};
