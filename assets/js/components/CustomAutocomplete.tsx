import { useTheme } from '@mui/material/styles';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import type { TagsMap } from '@/types';

export interface CustomAutocompleteProps {
  value: string[];
  setValue: (next: string[]) => void;
  label: string;
  tags: TagsMap;
}

const CustomAutocomplete = (props: CustomAutocompleteProps) => {
  const theme = useTheme();
  const { value, setValue, label } = props;
  return (
    <Autocomplete
      fullWidth
      sx={{ maxWidth: 'md' }}
      multiple
      disableCloseOnSelect
      disablePortal
      value={value}
      onChange={(_event, newValue) => {
        setValue(newValue);
      }}
      id="tags"
      options={Object.keys(props.tags).sort((a, b) => {
        if (props.tags[a].order !== props.tags[b].order)
          return props.tags[a].order - props.tags[b].order;
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
      renderInput={(params) => <TextField {...params} label={label} />}
    />
  );
};

export default CustomAutocomplete;
