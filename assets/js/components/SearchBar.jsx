import * as React from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import { router } from '@inertiajs/react'
import { InputAdornment } from '@mui/material';

export default function SearchBar(props) {
    const { isLoading, setIsLoading, queryText, fullWidth, size, showSubmitButton } = props;
    const [text, setText] = React.useState(queryText);
    const onChange = (event) => {
        setText(event?.target?.value);
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
            data: { text: text }
        });
    };
    return (
    <FormControl fullWidth={fullWidth} style={{flexDirection: 'row'}}>
        <TextField
            variant="outlined"
            fullWidth={fullWidth}
            size={size}
            onChange={onChange}
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
        {showSubmitButton ? <IconButton onClick={onSubmit} disabled={isLoading}>
            <SendIcon />
        </IconButton> : ''}
    </FormControl>
    )
}
