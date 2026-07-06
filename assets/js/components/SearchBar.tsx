import { useState } from 'react';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import HelpIcon from '@mui/icons-material/Help';
import HorizontalRuleIcon from '@mui/icons-material/HorizontalRule';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import TuneIcon from '@mui/icons-material/Tune';
import SettingsIcon from '@mui/icons-material/Settings';
import SortIcon from '@mui/icons-material/Sort';
import Popper from '@mui/material/Popper';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import SearchBarBase from '@/components/SearchBarBase';
import CustomAutocomplete from '@/components/CustomAutocomplete';
import HelpDialog from '@/components/HelpDialog';
import dayjs, { type Dayjs } from 'dayjs';
import type { SearchParams, TagsMap } from '@/types';

const minDate = dayjs('2022-12-19');
const maxDate = dayjs();

export interface SearchBarProps {
  isLoading: boolean;
  setIsLoading: (next: boolean) => void;
  showFullSearchBar?: boolean;
  searchParams?: SearchParams;
  showTags: boolean;
  setShowTags: (next: boolean) => void;
  showMatchPreviews: boolean;
  setShowMatchPreviews: (next: boolean) => void;
  tags: TagsMap;
  isAdmin?: boolean;
}

export default function SearchBar(props: SearchBarProps) {
  const {
    isLoading,
    setIsLoading,
    showFullSearchBar,
    showTags,
    setShowTags,
    showMatchPreviews,
    setShowMatchPreviews,
    isAdmin,
  } = props;
  const [isFullTextSearch, setIsFullTextSearch] = useState<boolean>(
    props.searchParams?.isFullTextSearch || false
  );
  const [title, setTitle] = useState<string>(props.searchParams?.title || '');
  const [isAscending, setIsAscending] = useState<boolean>(props.searchParams?.isAscending || false);
  const [startDate, setStartDate] = useState<Dayjs | null>(
    props.searchParams?.startDate ? dayjs(props.searchParams?.startDate) : null
  );
  const [endDate, setEndDate] = useState<Dayjs | null>(
    props.searchParams?.endDate ? dayjs(props.searchParams?.endDate) : null
  );
  const [includeTags, setIncludeTags] = useState<string[]>(props.searchParams?.includeTags || []);
  const [excludeTags, setExcludeTags] = useState<string[]>(props.searchParams?.excludeTags || []);
  const [text, setText] = useState<string>(props.searchParams?.text || '');
  const [disabled, setDisabled] = useState<boolean>(false);
  const [isHelpDialogOpen, setIsHelpDialogOpen] = useState<boolean>(false);
  const [advancedSearchAnchorEl, setAdvancedSearchAnchorEl] = useState<HTMLElement | null>(null);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLElement | null>(null);

  const toggleSettings = (event: React.MouseEvent<HTMLElement>) => {
    setSettingsAnchorEl(settingsAnchorEl ? null : event.currentTarget);
  };
  const toggleAdvancedSearch = (event: React.MouseEvent<HTMLElement>) => {
    setAdvancedSearchAnchorEl(advancedSearchAnchorEl ? null : event.currentTarget);
  };
  const toggleHelpDialog = () => {
    setIsHelpDialogOpen(!isHelpDialogOpen);
  };
  const closeSettings = () => setSettingsAnchorEl(null);
  const closeAdvancedSearch = () => setAdvancedSearchAnchorEl(null);
  const onPopperKeyDown = (closeHandler: () => void) => (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeHandler();
    }
  };
  const areFiltersDirty = (): boolean => {
    const applied: SearchParams = props.searchParams || {};
    const stagedStart = startDate ? startDate.format('YYYY-MM-DD') : '';
    const stagedEnd = endDate ? endDate.format('YYYY-MM-DD') : '';
    const appliedStart = applied.startDate || '';
    const appliedEnd = applied.endDate || '';
    const arraysEqual = (a: string[], b: string[]): boolean => {
      if (a.length !== b.length) return false;
      const aSorted = [...a].sort();
      const bSorted = [...b].sort();
      return aSorted.every((v, i) => v === bSorted[i]);
    };
    return (
      (title || '') !== (applied.title || '') ||
      Boolean(isAscending) !== Boolean(applied.isAscending) ||
      Boolean(isFullTextSearch) !== Boolean(applied.isFullTextSearch) ||
      stagedStart !== appliedStart ||
      stagedEnd !== appliedEnd ||
      !arraysEqual(includeTags, applied.includeTags || []) ||
      !arraysEqual(excludeTags, applied.excludeTags || [])
    );
  };

  const isAdvancedSearchOpen = Boolean(advancedSearchAnchorEl);
  const isSettingsOpen = Boolean(settingsAnchorEl);

  const handleReset = () => {
    setTitle('');
    setIsAscending(false);
    setStartDate(null);
    setEndDate(null);
    setIncludeTags([]);
    setExcludeTags([]);
  };
  const onChangeTitle = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event?.target?.value || '');
  };
  const onChangeFullTextSearch = (_event: React.SyntheticEvent, checked: boolean) => {
    setIsFullTextSearch(checked);
  };
  const toggleShowTags = () => {
    localStorage.setItem('settings-showTags', String(!showTags));
    setShowTags(!showTags);
  };
  const toggleShowMatchPreviews = () => {
    localStorage.setItem('settings-showMatchPreviews', String(!showMatchPreviews));
    setShowMatchPreviews(!showMatchPreviews);
  };

  const runSearch = (textArg: string) => {
    if (disabled) {
      return;
    }
    setIsHelpDialogOpen(false);
    setIsLoading(true);
    setSettingsAnchorEl(null);
    setAdvancedSearchAnchorEl(null);
    const data: SearchParams = { text: textArg };
    if (isFullTextSearch) {
      data.isFullTextSearch = isFullTextSearch;
    }
    if (title) {
      data.title = title;
    }
    if (isAscending) {
      data.isAscending = true;
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
    router.visit(isAdmin ? '/admin' : '/search', {
      data: data as Record<string, FormDataConvertible>,
    });
  };

  const settingsAndFiltersComponents = (
    <>
      <Box display="flex" flexDirection="row" justifyContent="space-between">
        <Button variant="text" size="small" onClick={toggleSettings} endIcon={<SettingsIcon />}>
          Settings
        </Button>
        <Button variant="text" size="small" onClick={toggleAdvancedSearch} endIcon={<TuneIcon />}>
          Filters
        </Button>
      </Box>
      <Popper
        id={isSettingsOpen ? 'settings-popper' : undefined}
        open={isSettingsOpen}
        anchorEl={settingsAnchorEl}
        placement="bottom-start"
      >
        <ClickAwayListener onClickAway={closeSettings}>
          <Card onKeyDown={onPopperKeyDown(closeSettings)}>
            <CardContent>
              <Box display="flex" justifyContent="flex-end">
                <IconButton size="small" onClick={closeSettings} aria-label="Close">
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box display="flex" flexDirection="column" justifyContent="start" sx={{ gap: 2 }}>
                <Box display="flex" flexDirection="row" justifyContent="start" alignItems="center">
                  <Typography>Help</Typography>
                  <IconButton onClick={toggleHelpDialog}>
                    <HelpIcon />
                  </IconButton>
                </Box>
                <Box display="flex" flexDirection="row" justifyContent="start">
                  <FormControlLabel
                    control={<Switch />}
                    checked={isFullTextSearch}
                    label={'Full Text Search'}
                    onChange={onChangeFullTextSearch}
                  />
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="start"
                  alignItems="center"
                  sx={{ gap: 2 }}
                >
                  <FormControlLabel
                    control={<Switch />}
                    checked={showTags}
                    label={'Show tags in search results'}
                    onChange={toggleShowTags}
                  />
                </Box>
                <Box
                  display="flex"
                  flexDirection="row"
                  justifyContent="start"
                  alignItems="center"
                  sx={{ gap: 2 }}
                >
                  <FormControlLabel
                    control={<Switch />}
                    checked={showMatchPreviews}
                    label={'Show match previews in list header'}
                    onChange={toggleShowMatchPreviews}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </ClickAwayListener>
      </Popper>
      <Popper
        id={isAdvancedSearchOpen ? 'advanced-search-popper' : undefined}
        open={isAdvancedSearchOpen}
        anchorEl={advancedSearchAnchorEl}
        placement="bottom-end"
      >
        <ClickAwayListener onClickAway={closeAdvancedSearch}>
          <Card onKeyDown={onPopperKeyDown(closeAdvancedSearch)}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                runSearch(text);
              }}
            >
              <CardContent>
                <Box display="flex" justifyContent="flex-end">
                  <IconButton size="small" onClick={closeAdvancedSearch} aria-label="Close">
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Box display="flex" flexDirection="column" justifyContent="start" sx={{ gap: 2 }}>
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ gap: 2 }}
                  >
                    <TextField fullWidth label={'Title'} onChange={onChangeTitle} value={title} />
                    <Box
                      display="flex"
                      flexDirection="row"
                      alignItems="center"
                      sx={{ gap: 1, flexShrink: 0 }}
                    >
                      <SortIcon fontSize="small" />
                      <Typography variant="body2">Sort:</Typography>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={isAscending}
                        onChange={(_event, newValue) => {
                          if (newValue !== null) setIsAscending(newValue);
                        }}
                        aria-label="Sort order"
                      >
                        <ToggleButton value={false} aria-label="Newest first">
                          <ArrowDownwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Newest
                        </ToggleButton>
                        <ToggleButton value={true} aria-label="Oldest first">
                          <ArrowUpwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                          Oldest
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                  </Box>
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="start"
                    alignItems="center"
                    sx={{ gap: 2 }}
                  >
                    <DatePicker
                      label="From"
                      minDate={minDate}
                      maxDate={maxDate}
                      views={['year', 'month', 'day']}
                      onError={(error) => setDisabled(!!error)}
                      format="YYYY-MM-DD"
                      value={startDate}
                      onChange={(newValue) => setStartDate(newValue)}
                      slotProps={{ popper: { disablePortal: true } }}
                    />
                    <HorizontalRuleIcon />
                    <DatePicker
                      label="To"
                      minDate={minDate}
                      maxDate={maxDate}
                      views={['year', 'month', 'day']}
                      onError={(error) => setDisabled(!!error)}
                      format="YYYY-MM-DD"
                      value={endDate}
                      onChange={(newValue) => setEndDate(newValue)}
                      slotProps={{ popper: { disablePortal: true } }}
                    />
                  </Box>
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="start"
                    alignItems="center"
                    sx={{ gap: 2 }}
                  >
                    <CustomAutocomplete
                      value={includeTags}
                      setValue={setIncludeTags}
                      label="Include Tags"
                      tags={props.tags}
                    />
                  </Box>
                  <Box
                    display="flex"
                    flexDirection="row"
                    justifyContent="start"
                    alignItems="center"
                    sx={{ gap: 2 }}
                  >
                    <CustomAutocomplete
                      value={excludeTags}
                      setValue={setExcludeTags}
                      label="Exclude Tags"
                      tags={props.tags}
                    />
                  </Box>
                </Box>
              </CardContent>
              <CardActions sx={{ justifyContent: 'end' }}>
                <Button type="button" onClick={handleReset}>
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={disabled}
                  variant={areFiltersDirty() ? 'contained' : 'text'}
                  color="primary"
                  sx={{ minWidth: 88 }}
                >
                  Apply
                </Button>
              </CardActions>
            </form>
          </Card>
        </ClickAwayListener>
      </Popper>
      <HelpDialog open={isHelpDialogOpen} onClose={toggleHelpDialog} />
    </>
  );

  return (
    <>
      <SearchBarBase
        showFullSearchBar={showFullSearchBar}
        onSubmit={runSearch}
        disabled={disabled}
        value={text}
        onChange={setText}
        isLoading={isLoading}
      />
      {settingsAndFiltersComponents}
    </>
  );
}
