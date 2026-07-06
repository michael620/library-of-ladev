import { memo } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import type { CSSProperties, ReactElement } from 'react';
import type { Match } from '@/types';

export interface MatchListItemRowProps {
  matches: Match[];
}

type MatchListItemProps = MatchListItemRowProps & { index: number; style?: CSSProperties };

const MatchListItem = memo(function MatchListItem(props: MatchListItemProps): ReactElement {
  const { index, matches } = props;
  const text = matches[index].text;
  return (
    <ListItem style={props.style}>
      <ListItemText
        primary={
          <Typography
            height={{ xs: '4.5rem', sm: '3rem' }}
            sx={{ overflowWrap: 'break-word', wordBreak: 'break-word', overflow: 'auto' }}
            dangerouslySetInnerHTML={{ __html: `${text}` }}
          />
        }
      />
    </ListItem>
  );
});

export default MatchListItem;
