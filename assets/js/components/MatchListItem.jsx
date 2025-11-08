import { memo } from 'react';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';

const MatchListItem = memo(function MatchListItem(props) {
    const { index, matches } = props;
    const text = matches[index].text;
    return (
        <ListItem style={props.style}>
            <ListItemText primary={
                <Typography
                    height={{ xs: '4.5rem', sm: '3rem' }}
                    sx={{overflowWrap: 'break-word', wordBreak: 'break-word', overflow: 'auto'}}
                    dangerouslySetInnerHTML={{ __html: `${text}` }}/>}
                />
        </ListItem>
    );
});

export default MatchListItem;
