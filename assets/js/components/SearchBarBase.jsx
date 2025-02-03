import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { LinearProgress } from '@mui/material';
import { InputAdornment } from '@mui/material';

export default function SearchBarBase(props) {
    const { showFullSearchBar, disabled, isLoading } = props;
    const [text, setText] = React.useState(props.text || '');
    const onChangeText = (event) => {
        setText(event?.target?.value);
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
    <>
    <FormControl fullWidth={showFullSearchBar} style={{flexDirection: 'row'}}>
        <TextField
            variant="outlined"
            fullWidth={showFullSearchBar}
            size={showFullSearchBar ? 'medium' : 'small'}
            onChange={onChangeText}
            onKeyDown={onKeyDown}
            disabled={disabled || isLoading}
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
        {showFullSearchBar ? <IconButton onClick={onSubmit} disabled={disabled || isLoading || !text}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    <LinearProgress sx={{ visibility: isLoading ? "visible" : "hidden" }}/>
    </>
    );
}
