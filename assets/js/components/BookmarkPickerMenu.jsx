import { useState } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import CheckIcon from '@mui/icons-material/Check';
import { MAX_COLLECTION_NAME_LENGTH } from '@/utils/bookmarks';

export default function BookmarkPickerMenu(props) {
    const {
        anchorEl,
        subtitle,
        collections,
        bookmarkedCollectionIdsByItemId,
        onClose,
        onPickCollection,
        onCreateCollection
    } = props;
    const [newCollectionMode, setNewCollectionMode] = useState(false);
    const [newCollectionName, setNewCollectionName] = useState('');

    const handleClose = () => {
        setNewCollectionMode(false);
        setNewCollectionName('');
        onClose();
    };

    const handlePick = (collection) => {
        onPickCollection(collection, subtitle);
        handleClose();
    };

    const handleCreate = () => {
        const trimmed = newCollectionName.trim();
        if (!trimmed) return;
        onCreateCollection(trimmed, subtitle);
        handleClose();
    };

    const itemId = subtitle ? String(subtitle.subtitleId) : null;
    const itemCollectionIds = itemId && bookmarkedCollectionIdsByItemId
        ? bookmarkedCollectionIdsByItemId.get(itemId) || new Set()
        : new Set();

    return (
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} disableScrollLock>
            {(collections || []).map((c) => {
                const checked = itemCollectionIds.has(c.id);
                return (
                    <MenuItem key={c.id} onClick={() => handlePick(c)}>
                        <ListItemIcon>{checked ? <CheckIcon fontSize="small" /> : <Box sx={{ width: 20 }} />}</ListItemIcon>
                        <ListItemText>{c.name}</ListItemText>
                    </MenuItem>
                );
            })}
            {(collections || []).length > 0 ? <Divider /> : null}
            {newCollectionMode ? (
                <MenuItem
                    disableRipple
                    onKeyDown={(e) => e.stopPropagation()}
                    sx={{ display: 'flex', gap: 1 }}
                >
                    <TextField
                        size="small"
                        autoFocus
                        placeholder="Collection name"
                        value={newCollectionName}
                        onChange={(e) => setNewCollectionName(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleCreate();
                            } else if (e.key === 'Escape') {
                                e.preventDefault();
                                setNewCollectionMode(false);
                            }
                        }}
                        slotProps={{ htmlInput: { maxLength: MAX_COLLECTION_NAME_LENGTH } }}
                    />
                    <Button size="small" disabled={!newCollectionName.trim()} onClick={handleCreate}>Save</Button>
                </MenuItem>
            ) : (
                <MenuItem onClick={() => setNewCollectionMode(true)}>
                    <ListItemIcon><Box sx={{ width: 20 }} /></ListItemIcon>
                    <ListItemText>New collection…</ListItemText>
                </MenuItem>
            )}
        </Menu>
    );
}
