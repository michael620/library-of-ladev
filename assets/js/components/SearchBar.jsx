import * as React from 'react';
import { styled } from '@mui/material/styles';
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

const DialogPopper = styled(Popper)(({ theme }) => ({
    zIndex: theme.zIndex.modal,
    [theme.breakpoints.down('sm')]: {
        maxHeight:'30vh',
        overflow:'auto'
    }
}));

export default function SearchBar(props) {
    const { isLoading, setIsLoading } = props;
    const showFullSearchBar = props.variant === 'full';
    const [text, setText] = React.useState(props.text || '');
    const [isFullTextSearch, setIsFullTextSearch] = React.useState(props.isFullTextSearch || false);
    const [title, setTitle] = React.useState(props.title || '');
    const [startDate, setStartDate] = React.useState(props.startDate ? dayjs(props.startDate) : undefined);
    const [endDate, setEndDate] = React.useState(props.endDate ? dayjs(props.endDate) : undefined);
    const [disabled, setDisabled] = React.useState(false);
    const [open, setOpen] = React.useState(false);
    const [anchorEl, setAnchorEl] = React.useState(null);

    const handleClickHelp = (event) => {
        setAnchorEl(anchorEl ? null : event.currentTarget);
    };
    const handleCloseHelp = () => {
        setAnchorEl(null);
    };
  
    const isHelpPopperOpen = Boolean(anchorEl);
    const id = isHelpPopperOpen ? 'simple-popper' : undefined;

    const handleOpen = (value) => {
        setOpen(value);
        if (!value) {
            handleCloseHelp();
        }
        if (disabled) {
            handleReset();
        }
    };
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
        setIsLoading(true);
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
            <Button variant="text" size="small" onClick={() => handleOpen(true)} endIcon={<TuneIcon />}>Advanced Search</Button>
        </Box>
        <Dialog
            open={open}
            onClose={() => handleOpen(false)}
            maxWidth="md"
            fullWidth
        >
            <DialogTitle>Advanced Search</DialogTitle>
            <DialogContent>
            <Box display='flex' flexDirection='column' justifyContent='start' sx={{gap:1}}>
            <Box display='flex' flexDirection='row' justifyContent='start'>
                <FormControlLabel
                    control={<Checkbox/>}
                    checked={isFullTextSearch}
                    label={'Full Text Search'}
                    onChange={onChangeFullTextSearch}
                />
                <IconButton onClick={handleClickHelp}>
                    <HelpIcon />
                </IconButton>
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
            </DialogContent>
            <DialogActions>
            <Button onClick={handleReset}>Reset</Button>
            <Button disabled={disabled} onClick={() => handleOpen(false)}>Ok</Button>
            </DialogActions>
        </Dialog>
        <DialogPopper id={id} open={isHelpPopperOpen} anchorEl={anchorEl}>
            <Card>
            <CardContent>
                <Typography gutterBottom variant='h5'>
                What is this?
                </Typography>
                <Typography variant="body1">
                    <b>With Full Text Search off</b>: a case-insensitive query on exactly what you typed, includes punctuations.<br/>
                    <b>Results</b>: Matched sentences along with its timestamp.<br/><br/>
                    <b>With Full Text Search on</b>: looks for matches from the entire video transcript (alphanumeric input only)<br/>
                    <b>Results</b>: Matched snippets, no timestamp. Ordered by relevance.<br/><br/>
                    <b>Tip</b>: You can use Full Text Search first, then use the result to search for the exact sentence with Full Text Search off to locate the timestamp.
                </Typography>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between' }}>
                <Typography variant="body2">
                    More advanced options coming soon!
                </Typography>
                <Button size="small" onClick={handleCloseHelp}>Close</Button>
            </CardActions>
            </Card>
        </DialogPopper>
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
        {showFullSearchBar ? <IconButton onClick={onSubmit} disabled={isLoading}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    {renderAdvancedSearch()}
    </>);
}
