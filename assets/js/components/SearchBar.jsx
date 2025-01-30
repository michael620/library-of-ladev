import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import HelpIcon from '@mui/icons-material/Help';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import { router } from '@inertiajs/react';
import TuneIcon from '@mui/icons-material/Tune';
import { Popper, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel, Typography, Card, CardContent, CardActions } from '@mui/material';
import { InputAdornment } from '@mui/material';
import { DateField } from '@mui/x-date-pickers/DateField';
import dayjs from 'dayjs';

const minDate = dayjs('2022-12-19');

export default function SearchBar(props) {
    const { isLoading, setIsLoading } = props;
    const showFullSearchBar = props.variant === 'full';
    const [text, setText] = React.useState(props.text || '');
    const [isFullTextSearch, setIsFullTextSearch] = React.useState(props.isFullTextSearch || false);
    const [title, setTitle] = React.useState(props.title || '');
    const [startDate, setStartDate] = React.useState(props.startDate ? dayjs(props.startDate) : undefined);
    const [endDate, setEndDate] = React.useState(props.endDate ? dayjs(props.endDate) : undefined);
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
    const onChangeText = (event) => {
        setText(event?.target?.value);
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

    const onSubmit = async (event) => {
        event.preventDefault();
        if (disabled) {
            return;
        }
        setIsHelpDialogOpen(false);
        setIsLoading(true);
        setAnchorEl(null);
        const startDateString = startDate?.format('YYYY-MM-DD');
        const endDateString = endDate?.format('YYYY-MM-DD');
        router.visit('/search', {
            data: { text, isFullTextSearch, title, startDate: startDateString, endDate: endDateString }
        });
    };

    const renderAdvancedSearch = () => {
        if (!showFullSearchBar) {
            return '';
        }
        return (<>
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
                    <b>Note</b>: Since timestamps are split by individual sentences, it is not possible to search across multiple sentences.<br/><br/>
                </Typography>
                <Typography variant="h6">Full Text Search</Typography>
                <Typography variant="body1">
                    Search from the entire video transcript, with syntax support.<br/>
                    <b>Results</b>: Matched snippets, no timestamp.<br/>
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
        </>);
    };
    
    return (<>
    <FormControl fullWidth={showFullSearchBar} style={{flexDirection: 'row'}}>
        <TextField
            variant="outlined"
            fullWidth={showFullSearchBar}
            size={showFullSearchBar ? 'medium' : 'small'}
            onChange={onChangeText}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            value={text}
            slotProps={{
                input: {
                startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon />
                </InputAdornment>)
                }
            }}
        />
        {showFullSearchBar ? <IconButton onClick={onSubmit} disabled={disabled || isLoading}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    {renderAdvancedSearch()}
    </>);
}
