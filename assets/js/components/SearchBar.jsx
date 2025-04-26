import { useState } from 'react';
import { useTheme } from '@mui/material/styles';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import HelpIcon from '@mui/icons-material/Help';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { router } from '@inertiajs/react';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Checkbox from '@mui/material/Checkbox';
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
import { TAGS } from '../../../shared/constants';

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
        value={value}
        onChange={(event, newValue) => {
            setValue(newValue);
        }}
        id="tags"
        options={Object.keys(TAGS)}
        getOptionLabel={(option) => option}
        groupBy={(option) => TAGS[option].text}
        renderTags={(v, getTagProps) =>
            v.map((option, index) => (
                <Chip
                    {...getTagProps({ index })}
                    key={option}
                    label={option}
                    sx={{
                        backgroundColor: theme.palette[TAGS[option].color][theme.palette.mode],
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
    const { isLoading, setIsLoading, showFullSearchBar, showTags, setShowTags, syncSubtitles, setSyncSubtitles } = props;
    const [isFullTextSearch, setIsFullTextSearch] = useState(props.searchParams?.isFullTextSearch || false);
    const [title, setTitle] = useState(props.searchParams?.title || '');
    const [startDate, setStartDate] = useState(props.searchParams?.startDate ? dayjs(props.searchParams?.startDate) : null);
    const [endDate, setEndDate] = useState(props.searchParams?.endDate ? dayjs(props.searchParams?.endDate) : null);
    const [includeTags, setIncludeTags] = useState(props.searchParams?.includeTags || []);
    const [excludeTags, setExcludeTags] = useState(props.searchParams?.excludeTags || []);
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
  
    const isAdvancedSearchOpen = Boolean(advancedSearchAnchorEl);
    const isSettingsOpen = Boolean(settingsAnchorEl);

    const handleReset = () => {
        setTitle('');
        setStartDate(null);
        setEndDate(null);
        setIncludeTags([]);
        setExcludeTags([]);
    };
    const onChangeTitle = (event) => {
        setTitle((event?.target?.value || '').replace(/[^a-zA-Z0-9\s*?]/g, ''));
    };
    const onChangeFullTextSearch = (event) => {
        setIsFullTextSearch(event.target.checked);
    };
    const toggleShowTags = () => {
        localStorage.setItem('settings-showTags', !showTags);
        setShowTags(!showTags);
    };
    const toggleSyncSubtitles = () => {
        localStorage.setItem('settings-syncSubtitles', !syncSubtitles);
        setSyncSubtitles(!syncSubtitles);
    };

    const onSubmit = async (text) => {
        if (disabled) {
            return;
        }
        setIsHelpDialogOpen(false);
        setIsLoading(true);
        setSettingsAnchorEl(null);
        setAdvancedSearchAnchorEl(null);
        const data = { text };
        if (isFullTextSearch) {
            data.isFullTextSearch = isFullTextSearch;
        }
        if (title) {
            data.title = title;
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
            <Card>
            <CardContent>
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
                    checked={syncSubtitles}
                    label={'Sync subtitles with player'}
                    onChange={toggleSyncSubtitles}
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
            </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'end' }}>
                <Button disabled={disabled} onClick={() => setSettingsAnchorEl(null)}>Ok</Button>
            </CardActions>
            </Card>
        </Popper>
        <Popper id={isAdvancedSearchOpen ? 'advanced-search-popper' : undefined} open={isAdvancedSearchOpen} anchorEl={advancedSearchAnchorEl} placement='bottom-end'>
            <Card>
            <CardContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:2}}>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <TextField
                    label={'Title'}
                    onChange={onChangeTitle}
                    value={title}
                />
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
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <CustomAutocomplete
                    value={includeTags}
                    setValue={setIncludeTags}
                    label='Include Tags'
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='center' sx={{gap:2}}>
                <CustomAutocomplete
                    value={excludeTags}
                    setValue={setExcludeTags}
                    label='Exclude Tags'
                />
            </Box>
            </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'end' }}>
                <Button onClick={handleReset}>Reset</Button>
                <Button disabled={disabled} onClick={() => setAdvancedSearchAnchorEl(null)}>Ok</Button>
            </CardActions>
            </Card>
        </Popper>
        <Dialog
            open={isHelpDialogOpen}
            onClose={toggleHelpDialog}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle><Typography variant='h5'>Help</Typography></DialogTitle>
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
                    <b>Note</b>: Snippets are ranked by relevance. It doesn't work well if the search terms match across a large context window.<br/>
                    <b>Tip</b>: You can use Full Text Search first, then search again once you find the exact sentence with Full Text Search off to locate the timestamp.<br/><br/>
                </Typography>
                <Typography variant="h6">Search syntax (Full Text Search)</Typography>
                <Typography display='inline' variant="body1" fontFamily={['monospace', 'monospace']}><b>"quoted text"</b></Typography>
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
        onSubmit={onSubmit}
        disabled={disabled}
        text={props.searchParams?.text}
        isLoading={isLoading}
    />
    {settingsAndFiltersComponents}
    </>);
}
