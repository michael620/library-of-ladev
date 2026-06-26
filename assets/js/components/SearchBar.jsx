import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import HelpIcon from '@mui/icons-material/Help';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { router } from '@inertiajs/react';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import SortIcon from '@mui/icons-material/Sort';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchBarBase from '@/components/SearchBarBase.jsx';
import dayjs from 'dayjs';

const minDate = dayjs('2022-12-19');
const maxDate = dayjs();

const CustomAutocomplete = (props) => {
    const theme = useTheme();
    const {value, setValue, label } = props;
    return <Autocomplete
        fullWidth
        sx={{maxWidth: 'md'}}
        multiple
        disableCloseOnSelect
        disablePortal
        value={value}
        onChange={(event, newValue) => {
            setValue(newValue);
        }}
        id="tags"
        options={Object.keys(props.tags).sort((a, b) => {
            if (props.tags[a].order !== props.tags[b].order) return props.tags[a].order - props.tags[b].order;
            return a.localeCompare(b);
        })}
        getOptionLabel={(option) => option}
        groupBy={(option) => props.tags[option].text}
        renderTags={(v, getTagProps) =>
            v.map((option, index) => (
                <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    sx={{
                        backgroundColor: theme.palette[props.tags[option].color][theme.palette.mode],
                    }}
                />
            ))
        }
        renderInput={(params) => (
            <TextField {...params} label={label} />
        )}
    />
};

export default function SearchBar(props) {
    const { isLoading, setIsLoading, showFullSearchBar, showTags, setShowTags, showMatchPreviews, setShowMatchPreviews } = props;
    const [isFullTextSearch, setIsFullTextSearch] = useState(props.searchParams?.isFullTextSearch || false);
    const [title, setTitle] = useState(props.searchParams?.title || '');
    const [isAscending, setIsAscending] = useState(props.searchParams?.isAscending || false);
    const [startDate, setStartDate] = useState(props.searchParams?.startDate ? dayjs(props.searchParams?.startDate) : null);
    const [endDate, setEndDate] = useState(props.searchParams?.endDate ? dayjs(props.searchParams?.endDate) : null);
    const [includeTags, setIncludeTags] = useState(props.searchParams?.includeTags || []);
    const [excludeTags, setExcludeTags] = useState(props.searchParams?.excludeTags || []);
    const [text, setText] = useState(props.searchParams?.text || '');
    const [disabled, setDisabled] = useState(false);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = useState(false);
    const [advancedSearchAnchorEl, setAdvancedSearchAnchorEl] = useState(null);
    const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

    const toggleSettings = (event) => {
        setSettingsAnchorEl(settingsAnchorEl ? null : event.currentTarget);
    };
    const toggleAdvancedSearch = (event) => {
        setAdvancedSearchAnchorEl(advancedSearchAnchorEl ? null : event.currentTarget);
    };
    const toggleHelpDialog = () => {
        setIsHelpDialogOpen(!isHelpDialogOpen);
    };
    const closeSettings = () => setSettingsAnchorEl(null);
    const closeAdvancedSearch = () => setAdvancedSearchAnchorEl(null);
    const onPopperKeyDown = (closeHandler) => (event) => {
        if (event.key === 'Escape') {
            closeHandler();
        }
    };
    const areFiltersDirty = () => {
        const applied = props.searchParams || {};
        const stagedStart = startDate ? startDate.format('YYYY-MM-DD') : '';
        const stagedEnd = endDate ? endDate.format('YYYY-MM-DD') : '';
        const appliedStart = applied.startDate || '';
        const appliedEnd = applied.endDate || '';
        const arraysEqual = (a, b) => {
            if (a.length !== b.length) return false;
            const aSorted = [...a].sort();
            const bSorted = [...b].sort();
            return aSorted.every((v, i) => v === bSorted[i]);
        };
        return (
            (title || '') !== (applied.title || '') ||
            Boolean(isAscending) !== Boolean(applied.isAscending) ||
            Boolean(isFullTextSearch) !== Boolean(applied.isFullTextSearch) ||
            stagedStart !== appliedStart ||
            stagedEnd !== appliedEnd ||
            !arraysEqual(includeTags, applied.includeTags || []) ||
            !arraysEqual(excludeTags, applied.excludeTags || [])
        );
    };
  
    const isAdvancedSearchOpen = Boolean(advancedSearchAnchorEl);
    const isSettingsOpen = Boolean(settingsAnchorEl);

    const handleReset = () => {
        setTitle('');
        setIsAscending(false);
        setStartDate(null);
        setEndDate(null);
        setIncludeTags([]);
        setExcludeTags([]);
    };
    const onChangeTitle = (event) => {
        setTitle(event?.target?.value || '');
    };
    const onChangeFullTextSearch = (event) => {
        setIsFullTextSearch(event.target.checked);
    };
    const toggleShowTags = () => {
        localStorage.setItem('settings-showTags', !showTags);
        setShowTags(!showTags);
    };
    const toggleShowMatchPreviews = () => {
        localStorage.setItem('settings-showMatchPreviews', !showMatchPreviews);
        setShowMatchPreviews(!showMatchPreviews);
    };

    const runSearch = (textArg) => {
        if (disabled) {
            return;
        }
        setIsHelpDialogOpen(false);
        setIsLoading(true);
        setSettingsAnchorEl(null);
        setAdvancedSearchAnchorEl(null);
        const data = { text: textArg };
        if (isFullTextSearch) {
            data.isFullTextSearch = isFullTextSearch;
        }
        if (title) {
            data.title = title;
        }
        if (isAscending) {
            data.isAscending = true;
        }
        if (startDate) {
            data.startDate = startDate.format('YYYY-MM-DD');
        }
        if (endDate) {
            data.endDate = endDate.format('YYYY-MM-DD');
        }
        if (includeTags.length) {
            data.includeTags = includeTags;
        }
        if (excludeTags.length) {
            data.excludeTags = excludeTags;
        }
        router.visit('/search', {
            data
        });
    };

    const settingsAndFiltersComponents = (
        <>
        <Box display='flex' flexDirection='row' justifyContent='space-between'>
            <Button variant="text" size="small" onClick={toggleSettings} endIcon={<SettingsIcon />}>Settings</Button>
            <Button variant="text" size="small" onClick={toggleAdvancedSearch} endIcon={<TuneIcon />}>Filters</Button>
        </Box>
        <Popper id={isSettingsOpen ? 'settings-popper' : undefined} open={isSettingsOpen} anchorEl={settingsAnchorEl} placement='bottom-start'>
            <ClickAwayListener onClickAway={closeSettings}>
            <Card onKeyDown={onPopperKeyDown(closeSettings)}>
            <CardContent>
            <Box display='flex' justifyContent='flex-end'>
                <IconButton size="small" onClick={closeSettings} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center'>
                <Typography>Help</Typography>
                <IconButton onClick={toggleHelpDialog}>
                    <HelpIcon />
                </IconButton>
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start'>
                <FormControlLabel
                    control={<Switch/>}
                    checked={isFullTextSearch}
                    label={'Full Text Search'}
                    onChange={onChangeFullTextSearch}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <FormControlLabel
                    control={<Switch/>}
                    checked={showTags}
                    label={'Show tags in search results'}
                    onChange={toggleShowTags}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <FormControlLabel
                    control={<Switch/>}
                    checked={showMatchPreviews}
                    label={'Show match previews in list header'}
                    onChange={toggleShowMatchPreviews}
                />
            </Box>
            </Box>
            </CardContent>
            </Card>
            </ClickAwayListener>
        </Popper>
        <Popper id={isAdvancedSearchOpen ? 'advanced-search-popper' : undefined} open={isAdvancedSearchOpen} anchorEl={advancedSearchAnchorEl} placement='bottom-end'>
            <ClickAwayListener onClickAway={closeAdvancedSearch}>
            <Card onKeyDown={onPopperKeyDown(closeAdvancedSearch)}>
            <form onSubmit={(e) => { e.preventDefault(); runSearch(text); }}>
            <CardContent>
            <Box display='flex' justifyContent='flex-end'>
                <IconButton size="small" onClick={closeAdvancedSearch} aria-label="Close">
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
            <Box display='flex' flexDirection='row' justifyContent='space-between' alignItems='center' sx={{gap:2}}>
                <TextField
                    fullWidth
                    label={'Title'}
                    onChange={onChangeTitle}
                    value={title}
                />
                <Box display='flex' flexDirection='row' alignItems='center' sx={{gap:1, flexShrink:0}}>
                    <SortIcon fontSize='small' />
                    <Typography variant='body2'>Sort:</Typography>
                    <ToggleButtonGroup
                        size='small'
                        exclusive
                        value={isAscending}
                        onChange={(_event, newValue) => {
                            if (newValue !== null) setIsAscending(newValue);
                        }}
                        aria-label='Sort order'
                    >
                        <ToggleButton value={false} aria-label='Newest first'>
                            <ArrowDownwardIcon fontSize='small' sx={{ mr: 0.5 }} />
                            Newest
                        </ToggleButton>
                        <ToggleButton value={true} aria-label='Oldest first'>
                            <ArrowUpwardIcon fontSize='small' sx={{ mr: 0.5 }} />
                            Oldest
                        </ToggleButton>
                    </ToggleButtonGroup>
                </Box>
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <DatePicker
                    label='From'
                    minDate={minDate}
                    maxDate={maxDate}
                    views={['year', 'month', 'day']}
                    onError={(error) => setDisabled(!!error)}
                    format="YYYY-MM-DD"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    slotProps={{ popper: { disablePortal: true } }}
                />
                <HorizontalRuleIcon/>
                <DatePicker
                    label='To'
                    minDate={minDate}
                    maxDate={maxDate}
                    views={['year', 'month', 'day']}
                    onError={(error) => setDisabled(!!error)}
                    format="YYYY-MM-DD"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    slotProps={{ popper: { disablePortal: true } }}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <CustomAutocomplete
                    value={includeTags}
                    setValue={setIncludeTags}
                    label='Include Tags'
                    tags={props.tags}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <CustomAutocomplete
                    value={excludeTags}
                    setValue={setExcludeTags}
                    label='Exclude Tags'
                    tags={props.tags}
                />
            </Box>
            </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'end' }}>
                <Button type="button" onClick={handleReset}>Reset</Button>
                <Button
                    type="submit"
                    disabled={disabled}
                    variant={areFiltersDirty() ? 'contained' : 'text'}
                    color="primary"
                    sx={{ minWidth: 88 }}
                >
                    Apply
                </Button>
            </CardActions>
            </form>
            </Card>
            </ClickAwayListener>
        </Popper>
        <Dialog
            open={isHelpDialogOpen}
            onClose={toggleHelpDialog}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle variant='h5'>Help</DialogTitle>
            <DialogContent>
                <Typography variant="h6">Default search</Typography>
                <Typography variant="body1">
                    Searches for sentences along with its timestamp.<br/>
                    <b>Note</b>: Since timestamps are split by sentences, you may not find a phrase if it spans across multiple sentences.<br/><br/>
                </Typography>
                <Typography variant="h6">Search syntax (Default search)</Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>?</b></Typography>
                <Typography display='inline' variant="body1">: Matches any single character<br/></Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>*</b></Typography>
                <Typography display='inline' variant="body1">: Matches zero or more characters<br/><br/></Typography>
                <Typography variant="h6">Full Text Search</Typography>
                <Typography variant="body1">
                    Search from the entire video transcript, no timestamp<br/>
                    <b>Note</b>: Snippets are ranked by relevance. It doesn&apos;t work well if the search terms match across a large context window.<br/>
                    <b>Tip</b>: You can use Full Text Search first, then search again once you find the exact sentence with Full Text Search off to locate the timestamp.<br/><br/>
                </Typography>
                <Typography variant="h6">Search syntax (Full Text Search)</Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>&quot;quoted text&quot;</b></Typography>
                <Typography display='inline' variant="body1">: Matches the exact phrase<br/></Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>or</b></Typography>
                <Typography display='inline' variant="body1">: Matches x or y<br/></Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>-</b></Typography>
                <Typography display='inline' variant="body1">: Exclude words from your search<br/></Typography>
            </DialogContent>
            <DialogActions>
                <Button size="small" onClick={toggleHelpDialog}>Close</Button>
            </DialogActions>
        </Dialog>
        </>
    );
    
    return (<>
    <SearchBarBase
        showFullSearchBar={showFullSearchBar}
        onSubmit={runSearch}
        disabled={disabled}
        value={text}
        onChange={setText}
        isLoading={isLoading}
    />
    {settingsAndFiltersComponents}
    </>);
}
