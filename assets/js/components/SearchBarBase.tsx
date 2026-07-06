import { useState } from 'react';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SendIcon from '@mui/icons-material/Send';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';

export interface SearchBarBaseProps {
  onSubmit: (text: string) => void;
  showFullSearchBar?: boolean;
  disabled?: boolean;
  isLoading?: boolean;
  placeholder?: string;
  value?: string;
  onChange?: (text: string) => void;
  /** Initial text in uncontrolled mode. Ignored when controlled. */
  text?: string;
}

export default function SearchBarBase(props: SearchBarBaseProps) {
  const { showFullSearchBar, disabled, isLoading, placeholder, value, onChange } = props;
  const isControlled = value !== undefined && typeof onChange === 'function';
  const [internalText, setInternalText] = useState<string>(props.text || '');
  const text = isControlled ? (value as string) : internalText;
  const setText: (text: string) => void = isControlled
    ? (onChange as (text: string) => void)
    : setInternalText;
  const onChangeText = (event: React.ChangeEvent<HTMLInputElement>) => {
    setText(event?.target?.value || '');
  };
  const onSubmit = (event: React.SyntheticEvent) => {
    event.preventDefault();
    props.onSubmit(text);
  };
  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onSubmit(event);
    }
  };
  return (
    <Box padding={{ xs: '1rem', sm: 'unset' }}>
      <FormControl fullWidth={showFullSearchBar} style={{ flexDirection: 'row' }}>
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
              'aria-label': 'Search',
            },
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            },
          }}
        />
        {showFullSearchBar ? (
          <IconButton aria-label="search" onClick={onSubmit} disabled={disabled || isLoading}>
            <SendIcon />
          </IconButton>
        ) : (
          ''
        )}
      </FormControl>
      <LinearProgress sx={{ visibility: isLoading ? 'visible' : 'hidden' }} />
    </Box>
  );
}
