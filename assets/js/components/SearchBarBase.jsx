import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';

export default function SearchBarBase(props) {
    const { showFullSearchBar, disabled, isLoading, placeholder } = props;
    const [text, setText] = useState(props.text || '');
    const onChangeText = (event) => {
        setText(event?.target?.value || '');
    };
    const onSubmit = (event) => {
        event.preventDefault();
        props.onSubmit(text);
    };
    const onKeyDown = (event) => {
        if (event.key === 'Enter') {
            onSubmit(event);
        }
    }
    return (
    <Box padding={{ xs: '1rem', sm: 'unset' }}>
    <FormControl fullWidth={showFullSearchBar} style={{flexDirection: 'row'}}>
        <TextField
            placeholder={placeholder}
            variant="outlined"
            fullWidth={showFullSearchBar}
            size={showFullSearchBar ? 'medium' : 'small'}
            onChange={onChangeText}
            onKeyDown={onKeyDown}
            disabled={disabled || isLoading}
            value={text}
            slotProps={{
                htmlInput: {
                    'aria-label': 'Search'
                },
                input: {
                startAdornment: (
                <InputAdornment position="start">
                    <SearchIcon />
                </InputAdornment>)
                }
            }}
        />
        {showFullSearchBar ? <IconButton aria-label="search" onClick={onSubmit} disabled={disabled || isLoading}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    <LinearProgress sx={{ visibility: isLoading ? "visible" : "hidden" }}/>
    </Box>
    );
}
