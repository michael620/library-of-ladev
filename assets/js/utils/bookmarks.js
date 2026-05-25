const ITEMS_KEY = 'bookmarks-items';
const COLLECTIONS_KEY = 'bookmarks-collections';
const LAST_USED_KEY = 'bookmarks-lastUsedCollectionId';

const DEFAULT_COLLECTION_NAME = 'My Bookmarks';
const MAX_ITEMS_PER_IMPORT = 10000;
const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_COLLECTION_NAME_LENGTH = 50;

const readJson = (key, fallback) => {
    try {
        const raw = localStorage.getItem(key);
        if (!raw) return fallback;
        return JSON.parse(raw);
    } catch {
        return fallback;
    }
};

const writeJson = (key, value) => {
    localStorage.setItem(key, JSON.stringify(value));
};

const uuid = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
};

export const makeBookmarkItemId = ({ subtitleId }) => String(subtitleId);
export const getItems = () => readJson(ITEMS_KEY, {});
export const getCollections = () => readJson(COLLECTIONS_KEY, []);
export const getLastUsedCollectionId = () => localStorage.getItem(LAST_USED_KEY);
export const setLastUsedCollectionId = (id) => localStorage.setItem(LAST_USED_KEY, id);

const setItems = (items) => writeJson(ITEMS_KEY, items);
const setCollections = (collections) => writeJson(COLLECTIONS_KEY, collections);

export const getCollectionById = (id) => getCollections().find(c => c.id === id);

export const ensureDefaultCollection = () => {
    const collections = getCollections();
    if (collections.length > 0) {
        const lastUsed = getLastUsedCollectionId();
        if (lastUsed && collections.some(c => c.id === lastUsed)) return lastUsed;
        setLastUsedCollectionId(collections[0].id);
        return collections[0].id;
    }
    const now = Date.now();
    const collection = {
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

const garbageCollectItems = (collections, items) => {
    const referenced = new Set();
    for (const c of collections) {
        for (const id of c.bookmarkIds) referenced.add(id);
    }
    const next = {};
    for (const [id, item] of Object.entries(items)) {
        if (referenced.has(id)) next[id] = item;
    }
    return next;
};

export const isInCollection = (collectionId, itemId) => {
    const c = getCollectionById(collectionId);
    return !!c && c.bookmarkIds.includes(itemId);
};

export const addToCollection = (collectionId, { subtitleId, videoUrl, startTime }) => {
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

export const removeFromCollection = (collectionId, itemId) => {
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

export const assignToCollections = (itemId, collectionIdSet) => {
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

export const createCollection = (name) => {
    const collections = getCollections();
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Collection name cannot be empty');
    if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) throw new Error(`Collection name too long (max ${MAX_COLLECTION_NAME_LENGTH})`);
    const finalName = uniqueName(trimmed, collections.map(c => c.name));
    const now = Date.now();
    const collection = {
        id: uuid(),
        name: finalName,
        bookmarkIds: [],
        createdAt: now,
        updatedAt: now
    };
    setCollections([...collections, collection]);
    return collection;
};

export const renameCollection = (id, name) => {
    const collections = getCollections();
    const trimmed = (name || '').trim();
    if (!trimmed) throw new Error('Collection name cannot be empty');
    if (trimmed.length > MAX_COLLECTION_NAME_LENGTH) throw new Error(`Collection name too long (max ${MAX_COLLECTION_NAME_LENGTH})`);
    const finalName = uniqueName(trimmed, collections.filter(c => c.id !== id).map(c => c.name));
    const next = collections.map(c => c.id === id ? { ...c, name: finalName, updatedAt: Date.now() } : c);
    setCollections(next);
};

export const deleteCollection = (id) => {
    const collections = getCollections().filter(c => c.id !== id);
    setCollections(collections);
    setItems(garbageCollectItems(collections, getItems()));
    if (getLastUsedCollectionId() === id) {
        if (collections.length > 0) setLastUsedCollectionId(collections[0].id);
        else localStorage.removeItem(LAST_USED_KEY);
    }
};

const uniqueName = (desired, existing) => {
    if (!existing.includes(desired)) return desired;
    let n = 2;
    while (existing.includes(`${desired} (${n})`)) n++;
    return `${desired} (${n})`;
};

export const exportLean = (collectionId) => {
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

export const validateImport = (parsed, rawByteLength) => {
    if (rawByteLength !== undefined && rawByteLength > MAX_IMPORT_BYTES) {
        throw new Error('Import file too large');
    }
    if (!parsed || typeof parsed !== 'object') throw new Error('Invalid file');
    if (parsed.version !== 1) throw new Error('Unsupported version');
    if (parsed.kind !== undefined && parsed.kind !== 'backup') throw new Error('Unknown kind');
    const c = parsed.collection;
    if (!c || typeof c !== 'object' || typeof c.name !== 'string') throw new Error('Missing collection');
    if (!Array.isArray(parsed.items)) throw new Error('Missing items');
    if (parsed.items.length > MAX_ITEMS_PER_IMPORT) throw new Error('Too many items');
    for (const item of parsed.items) {
        if (!item || typeof item !== 'object') throw new Error('Invalid item');
        if (!Number.isInteger(item.subtitleId)) throw new Error('Invalid item.subtitleId');
        if (typeof item.videoUrl !== 'string' || item.videoUrl.length === 0 || item.videoUrl.length > 64) throw new Error('Invalid item.videoUrl');
        if (!Number.isFinite(item.startTime)) throw new Error('Invalid item.startTime');
    }
};

export const importCollection = (parsed, rawByteLength) => {
    validateImport(parsed, rawByteLength);
    const items = getItems();
    const collections = getCollections();
    const now = Date.now();
    const newBookmarkIds = [];
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
    const collection = {
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

export const isBackupKind = (parsed) => parsed?.kind === 'backup';

export const buildBackupView = (parsed) => {
    const videoMap = new Map();
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
        .sort((a, b) => a.firstOrderIndex - b.firstOrderIndex);
    for (const entry of searchResult) delete entry.firstOrderIndex;
    return {
        collection: parsed.collection,
        searchResult,
        unresolvedCount,
        itemCount: parsed.items.length
    };
};
