import * as React from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import HelpIcon from '@mui/icons-material/Help';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { router } from '@inertiajs/react';
import TuneIcon from '@mui/icons-material/Tune';
import { Popper, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel, Typography, Card, CardContent, CardActions } from '@mui/material';
import { DateField } from '@mui/x-date-pickers/DateField';
import SearchBarBase from '@/components/SearchBarBase.jsx';
import dayjs from 'dayjs';

const minDate = dayjs('2022-12-19');

export default function SearchBar(props) {
    const { isLoading, setIsLoading, showFullSearchBar } = props;
    const [isFullTextSearch, setIsFullTextSearch] = React.useState(props.searchParams?.isFullTextSearch || false);
    const [title, setTitle] = React.useState(props.searchParams?.title || '');
    const [startDate, setStartDate] = React.useState(props.searchParams?.startDate ? dayjs(props.startDate) : undefined);
    const [endDate, setEndDate] = React.useState(props.searchParams?.endDate ? dayjs(props.endDate) : undefined);
    const [disabled, setDisabled] = React.useState(false);
    const [isHelpDialogOpen, setIsHelpDialogOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const toggleAdvancedSearch = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const toggleHelpDialog = () => {
        setIsHelpDialogOpen(!isHelpDialogOpen);
    };
  
    const isAdvancedSearchOpen = Boolean(anchorEl);

    const handleReset = () => {
        setIsFullTextSearch(false);
        setTitle('');
        setStartDate(undefined);
        setEndDate(undefined);
    };
    const onChangeTitle = (event) => {
        setTitle(event?.target?.value);
    };
    const onChangeFullTextSearch = (event) => {
        setIsFullTextSearch(event.target.checked);
    };
    const onKeyDown = (event) => {
        if (event.key === 'Enter') {
            onSubmit(event);
        }
    }

    const onSubmit = async (text) => {
        if (disabled) {
            return;
        }
        setIsHelpDialogOpen(false);
        setIsLoading(true);
        setAnchorEl(null);
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
        router.visit('/search', {
            data
        });
    };

    const advancedSearchComponent = (
        <>
        <Box display='flex' flexDirection='row' justifyContent='end'>
            <Button variant="text" size="small" onClick={toggleAdvancedSearch} endIcon={<TuneIcon />}>Advanced Search</Button>
        </Box>
        <Popper id={isAdvancedSearchOpen ? 'advanced-search-popper' : undefined} open={isAdvancedSearchOpen} anchorEl={anchorEl} placement='bottom-end'>
            <Card>
            <CardActions sx={{ justifyContent: 'end' }}>
                <IconButton onClick={toggleHelpDialog}>
                    <HelpIcon />
                </IconButton>
            </CardActions>
            <CardContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:1}}>
            <Box display='flex' flexDirection='row' justifyContent='start'>
                <FormControlLabel
                    control={<Checkbox/>}
                    checked={isFullTextSearch}
                    label={'Full Text Search'}
                    onChange={onChangeFullTextSearch}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='end' sx={{gap:2}}>
                <Typography>Title:</Typography>
                <TextField
                    variant="standard"
                    onChange={onChangeTitle}
                    value={title}
                />
            </Box>
            <Box display='flex' flexDirection='row' justifyContent='start' alignItems='end' sx={{gap:2}}>
                <Typography>Date Range:</Typography>
                <DateField
                    minDate={minDate}
                    onError={(error) => setDisabled(!!error)}
                    format="YYYY-MM-DD"
                    variant="standard"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                />
                <HorizontalRuleIcon/>
                <DateField
                    disableFuture
                    onError={(error) => setDisabled(!!error)}
                    format="YYYY-MM-DD"
                    variant="standard"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                />
            </Box>
            </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'end' }}>
                <Button onClick={handleReset}>Reset</Button>
                <Button disabled={disabled} onClick={() => setAnchorEl(null)}>Ok</Button>
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
                    Matches exactly what you type.<br/>
                    <b>Results</b>: Matched sentences along with its timestamp.<br/>
                    <b>Note</b>: Since timestamps are split by sentences, you may not find a phrase if it spans across multiple sentences.<br/><br/>
                </Typography>
                <Typography variant="h6">Full Text Search</Typography>
                <Typography variant="body1">
                    Search from the entire video transcript, with syntax support.<br/>
                    <b>Results</b>: Matched snippets, no timestamp.<br/>
                    <b>Note</b>: Snippets attempt to highlight matched search terms, which doesn't work well if they match across a large context window.<br/>
                    <b>Tip</b>: You can use Full Text Search first, then search again once you find the exact sentence with Full Text Search off to locate the timestamp.<br/><br/>
                </Typography>
                <Typography variant="h6">Search syntax</Typography>
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
        showFullSearchBar={true}
        onSubmit={onSubmit}
        disabled={disabled}
        text={props.searchParams?.text}
        isLoading={isLoading}
    />
    {advancedSearchComponent}
    </>);
}
