import * as React from 'react';
import { styled } from '@mui/material/styles';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { router } from '@inertiajs/react';
import TuneIcon from '@mui/icons-material/Tune';
import { Popper, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Checkbox, FormControlLabel, Typography, Card, CardContent, CardActions } from '@mui/material';
import { InputAdornment } from '@mui/material';

const DialogPopper = styled(Popper)(({ theme }) => ({zIndex: theme.zIndex.modal}));

export default function SearchBar(props) {
    const { isLoading, setIsLoading, queryText } = props;
    const showFullSearchBar = props.variant === 'full';
    const [text, setText] = React.useState(queryText || '');
    const [open, setOpen] = React.useState(false);
    const [isFullTextSearch, setIsFullTextSearch] = React.useState(props.isFullTextSearch || false);
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
    };
    const handleReset = () => {
        setIsFullTextSearch(false);
    };
    const onChangeText = (event) => {
        setText(event?.target?.value);
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
        router.visit('/search', {
            data: { text, isFullTextSearch }
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
            <FormControlLabel
                control={<Checkbox/>}
                checked={isFullTextSearch}
                label={'Full Text Search'}
                onChange={onChangeFullTextSearch}
            />
            <Button aria-describedby={id} onClick={handleClickHelp}>
                Help
            </Button>
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
            </DialogContent>
            <DialogActions>
            <Button onClick={handleReset}>Reset</Button>
            <Button onClick={() => handleOpen(false)}>Ok</Button>
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
        {showFullSearchBar ? <IconButton onClick={onSubmit} disabled={isLoading}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    {renderAdvancedSearch()}
    </>);
}
