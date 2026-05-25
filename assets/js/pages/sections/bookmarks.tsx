import { useEffect, useMemo, useState, useCallback } from 'react';
import NewAppLayout from '@/layouts/NewAppLayout.jsx';
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import DeleteIcon from '@mui/icons-material/Delete';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import { Head, router } from '@inertiajs/react';
import { formatSeconds } from '../../../../shared/constants';
import SearchList from '@/components/SearchList.jsx';
import {
    getCollections,
    getItems,
    getLastUsedCollectionId,
    setLastUsedCollectionId,
    ensureDefaultCollection,
    getCollectionById,
    addToCollection,
    removeFromCollection,
    assignToCollections,
    createCollection,
    renameCollection,
    deleteCollection,
    exportLean,
    importCollection,
    isInCollection,
    MAX_COLLECTION_NAME_LENGTH,
    isBackupKind,
    buildBackupView,
    validateImport
} from '@/utils/bookmarks';
import type {
    Collection,
    ItemsMap,
    BookmarkItem,
    BackupView
} from '@/utils/bookmarks';
import type { BookmarksPageProps, FallbackCandidate } from '@/types';

type ActiveBackupView = BackupView & { filename: string };

interface SubtitleData {
    subtitleId: number;
    videoUrl: string;
    startTime: number;
    text?: string;
    timestamp?: string;
}

Bookmarks.layout = (page: React.ReactNode) => <NewAppLayout>{page}</NewAppLayout>

export default function Bookmarks(props: BookmarksPageProps) {
    const [collections, setCollections] = useState<Collection[]>([]);
    const [items, setItems] = useState<ItemsMap>({});
    const [activeCollectionId, setActiveCollectionId] = useState<string | null>(null);
    const [sort, setSort] = useState<BookmarksPageProps['sort']>('recency');
    const [showTags] = useState<boolean>(localStorage.getItem('settings-showTags') === 'true');
    const [syncSubtitles] = useState<boolean>(localStorage.getItem('settings-syncSubtitles') === 'true');
    const [showMatchPreviews] = useState(false);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [renameOpen, setRenameOpen] = useState(false);
    const [renameValue, setRenameValue] = useState('');
    const [createOpen, setCreateOpen] = useState(false);
    const [createValue, setCreateValue] = useState('');
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [candidates, setCandidates] = useState<FallbackCandidate[]>([]);
    const [loadingFallback, setLoadingFallback] = useState(false);
    const [backupView, setBackupView] = useState<ActiveBackupView | null>(null);
    const isBackupView = !!backupView;

    const showSnackbar = (message: string) => {
        setSnackbarMessage(message);
        setSnackbarOpen(true);
    };

    const refreshLocal = useCallback(() => {
        setCollections(getCollections());
        setItems(getItems());
    }, []);

    useEffect(() => {
        const id = ensureDefaultCollection();
        setCollections(getCollections());
        setItems(getItems());
        setActiveCollectionId(id);
    }, []);

    const activeCollection = useMemo(
        () => collections.find(c => c.id === activeCollectionId),
        [collections, activeCollectionId]
    );

    const collectionItems = useMemo(() => {
        if (!activeCollection) return [];
        return activeCollection.bookmarkIds
            .map(id => items[id])
            .filter(Boolean);
    }, [activeCollection, items]);

    const subtitleIds = useMemo(
        () => collectionItems.map(it => it.subtitleId).filter(Number.isInteger),
        [collectionItems]
    );

    const fetchBookmarks = useCallback(() => {
        if (!activeCollectionId) return;
        if (isBackupView) return;
        router.post('/bookmarks', { subtitleIds, sort }, {
            preserveState: true,
            preserveScroll: true,
            preserveUrl: true
        });
    }, [activeCollectionId, subtitleIds, sort, isBackupView]);

    useEffect(() => {
        if (!activeCollectionId) return;
        if (isBackupView) return;
        fetchBookmarks();
    }, [activeCollectionId, sort, fetchBookmarks, isBackupView]);

    useEffect(() => {
        if (isBackupView) {
            setCandidates([]);
            return;
        }
        const unresolved = props.unresolvedIds || [];
        if (unresolved.length === 0) {
            setCandidates([]);
            return;
        }
        const unresolvedSet = new Set(unresolved.map(String));
        const pairs = [];
        for (const it of collectionItems) {
            if (unresolvedSet.has(String(it.subtitleId)) && it.videoUrl && Number.isFinite(it.startTime)) {
                pairs.push({ videoUrl: it.videoUrl, startTime: it.startTime });
            }
        }
        if (pairs.length === 0) {
            setCandidates([]);
            return;
        }
        setLoadingFallback(true);
        fetch('/api/bookmarks/fallback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pairs })
        })
        .then(r => r.json())
        .then(json => {
            setCandidates(json?.data?.candidates || []);
        })
        .catch(() => setCandidates([]))
        .finally(() => setLoadingFallback(false));
    }, [props.unresolvedIds, collectionItems, isBackupView]);

    const unresolvedItems = useMemo(() => {
        const unresolved = props.unresolvedIds || [];
        const set = new Set(unresolved.map(String));
        return collectionItems.filter(it => set.has(String(it.subtitleId)));
    }, [props.unresolvedIds, collectionItems]);

    const candidatesByPair = useMemo(() => {
        const map = new Map();
        for (const c of candidates) {
            const key = `${c.videoUrl}@${c.startTime}`;
            const arr = map.get(key) || [];
            arr.push(c);
            map.set(key, arr);
        }
        return map;
    }, [candidates]);

    const handleSelectCollection = (id: string) => {
        setActiveCollectionId(id);
        setLastUsedCollectionId(id);
    };

    const handleSortChange = (event: SelectChangeEvent<BookmarksPageProps['sort']>) => {
        setSort(event.target.value as BookmarksPageProps['sort']);
    };

    const handleCreate = () => {
        const name = createValue.trim();
        if (!name) return;
        try {
            const c = createCollection(name);
            refreshLocal();
            setActiveCollectionId(c.id);
            setLastUsedCollectionId(c.id);
            setCreateOpen(false);
            setCreateValue('');
            showSnackbar(`Created "${c.name}"`);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

    const handleRename = () => {
        if (!activeCollection) return;
        const name = renameValue.trim();
        if (!name) return;
        try {
            renameCollection(activeCollection.id, name);
            refreshLocal();
            setRenameOpen(false);
            showSnackbar(`Renamed to "${name}"`);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

    const handleDelete = () => {
        if (!activeCollection) return;
        deleteCollection(activeCollection.id);
        const remaining = getCollections();
        const newId = remaining[0]?.id || ensureDefaultCollection();
        refreshLocal();
        setActiveCollectionId(newId);
        setLastUsedCollectionId(newId);
        setDeleteOpen(false);
        showSnackbar('Collection deleted');
    };

    const downloadJson = (filename, payload) => {
        const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleLeanExport = () => {
        if (!activeCollection) return;
        try {
            const data = exportLean(activeCollection.id);
            downloadJson(`${activeCollection.name}.bookmarks.json`, data);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

    const handleBackup = async () => {
        if (!activeCollection) return;
        try {
            const res = await fetch('/api/bookmarks/backup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    subtitleIds,
                    collection: {
                        id: activeCollection.id,
                        name: activeCollection.name,
                        createdAt: activeCollection.createdAt,
                        updatedAt: activeCollection.updatedAt
                    },
                    items: collectionItems
                })
            });
            if (!res.ok) throw new Error('Failed to download backup');
            const json = await res.json();
            downloadJson(`${activeCollection.name}.bookmarks.backup.json`, json.data);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

    const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        const filename = file.name;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const text = typeof reader.result === 'string' ? reader.result : '';
                const parsed = JSON.parse(text);
                if (isBackupKind(parsed)) {
                    validateImport(parsed, text.length);
                    const view = buildBackupView(parsed);
                    setBackupView({ ...view, filename });
                    showSnackbar(`Viewing backup "${view.collection.name}"`);
                    return;
                }
                const c = importCollection(parsed, text.length);
                refreshLocal();
                setActiveCollectionId(c.id);
                setLastUsedCollectionId(c.id);
                showSnackbar(`Imported "${c.name}"`);
            } catch (err) {
                showSnackbar(err instanceof Error ? err.message : 'Invalid file');
            }
        };
        reader.onerror = () => showSnackbar('Failed to read file');
        reader.readAsText(file);
    };

    const handleSaveBackupAsLive = () => {
        if (!backupView) return;
        try {
            const c = importCollection({
                version: 1,
                collection: backupView.collection,
                items: backupView.searchResult.flatMap(v => v.subtitles.map(s => ({
                    id: String(s.subtitleId),
                    subtitleId: s.subtitleId,
                    videoUrl: v.url,
                    startTime: s.startTime,
                    savedAt: Date.now()
                })))
            });
            refreshLocal();
            setBackupView(null);
            setActiveCollectionId(c.id);
            setLastUsedCollectionId(c.id);
            showSnackbar(`Saved as "${c.name}"`);
        } catch (err) {
            showSnackbar(err instanceof Error ? err.message : String(err));
        }
    };

    const handleCloseBackup = () => {
        setBackupView(null);
    };

    const handleAddCandidate = (candidate: FallbackCandidate) => {
        if (!activeCollectionId) return;
        addToCollection(activeCollectionId, {
            subtitleId: candidate.subtitleId,
            videoUrl: candidate.videoUrl,
            startTime: candidate.startTime
        });
        refreshLocal();
        fetchBookmarks();
        showSnackbar('Added to collection');
    };

    const handleDiscardOriginal = (staleItem: BookmarkItem) => {
        if (!activeCollectionId) return;
        removeFromCollection(activeCollectionId, String(staleItem.subtitleId));
        refreshLocal();
        fetchBookmarks();
        showSnackbar('Removed from this collection');
    };

    const handleBookmarkToggle = useCallback((subtitleData: SubtitleData) => {
        if (!activeCollectionId) return null;
        const itemId = String(subtitleData.subtitleId);
        const collection = getCollectionById(activeCollectionId);
        const collectionName = collection?.name || 'this collection';
        if (isInCollection(activeCollectionId, itemId)) {
            removeFromCollection(activeCollectionId, itemId);
            refreshLocal();
            fetchBookmarks();
            return { message: `Removed from ${collectionName}` };
        }
        addToCollection(activeCollectionId, {
            subtitleId: subtitleData.subtitleId,
            videoUrl: subtitleData.videoUrl,
            startTime: subtitleData.startTime
        });
        refreshLocal();
        return { message: `Saved to ${collectionName}` };
    }, [activeCollectionId, refreshLocal, fetchBookmarks]);

    const handlePickCollection = useCallback((collection: Collection, subtitleData: SubtitleData) => {
        const itemId = String(subtitleData.subtitleId);
        const allCollections = getCollections();
        const currentMembership = new Set<string>();
        for (const c of allCollections) {
            if (c.bookmarkIds.includes(itemId)) currentMembership.add(c.id);
        }
        if (currentMembership.has(collection.id)) currentMembership.delete(collection.id);
        else currentMembership.add(collection.id);
        assignToCollections(itemId, currentMembership);
        if (!items[itemId]) {
            addToCollection(collection.id, {
                subtitleId: subtitleData.subtitleId,
                videoUrl: subtitleData.videoUrl,
                startTime: subtitleData.startTime
            });
        }
        refreshLocal();
        fetchBookmarks();
        return { message: currentMembership.has(collection.id) ? `Saved to ${collection.name}` : `Removed from ${collection.name}` };
    }, [items, refreshLocal, fetchBookmarks]);

    const handleCreateCollection = useCallback((name: string, subtitleData: SubtitleData) => {
        const created = createCollection(name);
        addToCollection(created.id, {
            subtitleId: subtitleData.subtitleId,
            videoUrl: subtitleData.videoUrl,
            startTime: subtitleData.startTime
        });
        refreshLocal();
        return { message: `Saved to ${created.name}` };
    }, [refreshLocal]);

    const bookmarkedIdsByVideoUrl = useMemo(() => {
        const map = new Map<string, Set<string>>();
        if (!activeCollection) return map;
        for (const id of activeCollection.bookmarkIds) {
            const it = items[id];
            if (!it) continue;
            const set = map.get(it.videoUrl) || new Set<string>();
            set.add(id);
            map.set(it.videoUrl, set);
        }
        return map;
    }, [activeCollection, items]);

    const bookmarkedCollectionIdsByItemId = useMemo(() => {
        const map = new Map<string, Set<string>>();
        for (const c of collections) {
            for (const id of c.bookmarkIds) {
                const set = map.get(id) || new Set<string>();
                set.add(c.id);
                map.set(id, set);
            }
        }
        return map;
    }, [collections]);

    const noOp = useCallback(() => {}, []);

    return (
        <Box>
            <Head>
                <title>Library of Ladev - Bookmarks</title>
                <meta name="description" content="Bookmarked transcripts." />
            </Head>
            {props.fatalError ? <Alert variant="filled" severity="error">{`Encountered a fatal error: ${props.fatalError}`}</Alert> : ''}
            {isBackupView ? (
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Typography variant="subtitle1"><strong>{backupView.collection.name}</strong></Typography>
                            <Tooltip title="Backup files are view-only. Save it as a new collection to edit it.">
                                <Chip size="small" color="warning" label="Read-only" />
                            </Tooltip>
                            <Typography variant="caption" color="text.secondary">{backupView.filename}</Typography>
                        </Box>
                        <Stack direction="row" spacing={1}>
                            <Button size="small" variant="contained" onClick={handleSaveBackupAsLive}>Save as new collection</Button>
                            <Button size="small" onClick={handleCloseBackup}>Close</Button>
                        </Stack>
                    </Stack>
                    {backupView.unresolvedCount > 0 ? (
                        <Alert severity="info" sx={{ mt: 2 }}>
                            {backupView.unresolvedCount} of {backupView.itemCount} item{backupView.itemCount > 1 ? 's' : ''} in this backup have no snapshot and cannot be displayed.
                        </Alert>
                    ) : null}
                </Paper>
            ) : (
                <Paper elevation={1} sx={{ p: 2, mb: 2 }}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} flexWrap="wrap">
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel id="collection-select-label">Collection</InputLabel>
                        <Select
                            labelId="collection-select-label"
                            label="Collection"
                            value={activeCollectionId || ''}
                            onChange={(e) => handleSelectCollection(e.target.value)}
                        >
                            {collections.map(c => (
                                <MenuItem key={c.id} value={c.id}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: 1 }}>
                                        <span>{c.name}</span>
                                        <Chip size="small" label={c.bookmarkIds.length} />
                                    </Box>
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                        <InputLabel id="sort-select-label">Sort</InputLabel>
                        <Select
                            labelId="sort-select-label"
                            label="Sort"
                            value={sort}
                            onChange={handleSortChange}
                        >
                            <MenuItem value="recency">Last modified</MenuItem>
                            <MenuItem value="dateDesc">Video date (newest)</MenuItem>
                            <MenuItem value="dateAsc">Video date (oldest)</MenuItem>
                        </Select>
                    </FormControl>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        <Button size="small" onClick={() => { setCreateValue(''); setCreateOpen(true); }}>New</Button>
                        <Button size="small" disabled={!activeCollection} onClick={() => { setRenameValue(activeCollection?.name || ''); setRenameOpen(true); }}>Rename</Button>
                        <Button size="small" color="error" disabled={!activeCollection} onClick={() => setDeleteOpen(true)}>Delete</Button>
                        <Divider orientation="vertical" flexItem />
                        <Tooltip title="Import a collection. Accepts both export and backup formats.">
                            <Button size="small" component="label">
                                Import
                                <input type="file" accept=".json,application/json" hidden onChange={handleImport} />
                            </Button>
                        </Tooltip>
                        <Tooltip title="Export as shareable IDs.">
                            <span>
                                <Button size="small" disabled={!activeCollection || subtitleIds.length === 0} onClick={handleLeanExport}>Export</Button>
                            </span>
                        </Tooltip>
                        <Tooltip title="Export as full JSON.">
                            <span>
                                <Button size="small" disabled={!activeCollection || subtitleIds.length === 0} onClick={handleBackup}>Back up</Button>
                            </span>
                        </Tooltip>
                    </Stack>
                </Stack>
            </Paper>
            )}

            {!isBackupView && unresolvedItems.length > 0 ? (
                <Alert severity="warning" sx={{ mb: 2 }}>
                    <AlertTitle>{unresolvedItems.length} bookmark{unresolvedItems.length > 1 ? 's' : ''} could not be loaded</AlertTitle>
                    The IDs may have been edited/deleted and no longer exist in the database. Matches found based on video URL and timestamp…
                    <Accordion sx={{ mt: 1 }} disableGutters>
                        <AccordionSummary expandIcon={<ArrowDropDownIcon />}>
                            <Typography variant="body2">Unresolved bookmarks {loadingFallback ? '(loading…)' : ''}</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <List dense>
                                {unresolvedItems.map((stale) => {
                                    const key = `${stale.videoUrl}@${stale.startTime}`;
                                    const matches = candidatesByPair.get(key) || [];
                                    const videoTitle = matches[0]?.title || stale.videoUrl;
                                    const timestamp = formatSeconds(stale.startTime);
                                    return (
                                        <ListItem
                                            key={stale.id}
                                            alignItems="flex-start"
                                            sx={{ flexDirection: 'column', alignItems: 'stretch', gap: 1 }}
                                        >
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Typography variant="body2"><strong>{videoTitle}</strong> @ {timestamp}</Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                <Typography variant="caption" color="text.secondary">
                                                    {matches.length === 0
                                                        ? 'No candidates found — the video may have been deleted.'
                                                        : `${matches.length} candidate${matches.length > 1 ? 's' : ''} found:`}
                                                </Typography>
                                                <IconButton size="small" aria-label="discard-original" title="Discard from collection" onClick={() => handleDiscardOriginal(stale)}>
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                            </Box>
                                            {matches.map((c) => {
                                                const isBookmarked = isInCollection(activeCollectionId, String(c.subtitleId));
                                                return (
                                                    <Box key={c.subtitleId} sx={{ pl: 2, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                                                        <Box sx={{ flex: 1, minWidth: 0 }}>
                                                            <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{c.text}</Typography>
                                                            <Typography variant="caption" color="text.secondary">{c.timestamp} · {c.title}</Typography>
                                                        </Box>
                                                        <IconButton
                                                            size="small"
                                                            aria-label={isBookmarked ? 'already-in-collection' : 'add-to-collection'}
                                                            title={isBookmarked ? 'Already in collection' : 'Add to collection'}
                                                            disabled={isBookmarked}
                                                            onClick={() => handleAddCandidate(c)}
                                                        >
                                                            {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                                                        </IconButton>
                                                    </Box>
                                                );
                                            })}
                                        </ListItem>
                                    );
                                })}
                            </List>
                        </AccordionDetails>
                    </Accordion>
                </Alert>
            ) : null}

            <Paper elevation={1}>
                <SearchList
                    bookmarksMode={true}
                    searchResult={isBackupView ? backupView.searchResult : (props.searchResult || [])}
                    text=""
                    onFetchMoreResults={noOp}
                    noMoreResultsToFetch={true}
                    showTags={showTags}
                    showMatchPreviews={showMatchPreviews}
                    isLoading={false}
                    onFetchMoreSubtitles={noOp}
                    fetchSubtitles={noOp}
                    isLoadingSubtitle={false}
                    syncSubtitles={syncSubtitles}
                    tags={props.tags}
                    collections={isBackupView ? [] : collections}
                    lastUsedCollectionName={isBackupView ? undefined : activeCollection?.name}
                    bookmarkedIdsByVideoUrl={isBackupView ? new Map() : bookmarkedIdsByVideoUrl}
                    bookmarkedCollectionIdsByItemId={isBackupView ? new Map() : bookmarkedCollectionIdsByItemId}
                    onBookmarkToggle={isBackupView ? undefined : handleBookmarkToggle}
                    onPickCollection={isBackupView ? undefined : handlePickCollection}
                    onCreateCollection={isBackupView ? undefined : handleCreateCollection}
                />
            </Paper>

            <Dialog open={createOpen} onClose={() => setCreateOpen(false)}>
                <DialogTitle>New collection</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Collection name"
                        fullWidth
                        value={createValue}
                        onChange={(e) => setCreateValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleCreate(); } }}
                        slotProps={{ htmlInput: { maxLength: MAX_COLLECTION_NAME_LENGTH } }}
                        helperText={`${createValue.length}/${MAX_COLLECTION_NAME_LENGTH}`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
                    <Button onClick={handleCreate} disabled={!createValue.trim()}>Create</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={renameOpen} onClose={() => setRenameOpen(false)}>
                <DialogTitle>Rename collection</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Collection name"
                        fullWidth
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleRename(); } }}
                        slotProps={{ htmlInput: { maxLength: MAX_COLLECTION_NAME_LENGTH } }}
                        helperText={`${renameValue.length}/${MAX_COLLECTION_NAME_LENGTH}`}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setRenameOpen(false)}>Cancel</Button>
                    <Button onClick={handleRename} disabled={!renameValue.trim() || renameValue.trim() === activeCollection?.name}>Rename</Button>
                </DialogActions>
            </Dialog>

            <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
                <DialogTitle>Delete collection?</DialogTitle>
                <DialogContent>
                    <Typography>Delete "{activeCollection?.name}"? This cannot be undone.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
                    <Button color="error" onClick={handleDelete}>Delete</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                open={snackbarOpen}
                onClose={() => setSnackbarOpen(false)}
                autoHideDuration={3000}
                message={snackbarMessage}
            />
        </Box>
    );
}
