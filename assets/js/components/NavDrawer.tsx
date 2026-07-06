import Drawer from '@mui/material/Drawer';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import { Link as InertiaLink } from '@inertiajs/react';

export interface NavItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface NavDrawerProps {
  open: boolean;
  onClose: () => void;
  items: NavItem[];
  onItemClick: (item: NavItem) => void;
}

export default function NavDrawer({ open, onClose, items, onItemClick }: NavDrawerProps) {
  return (
    <Drawer anchor="left" open={open} onClose={onClose}>
      <Box sx={{ width: 240 }} role="presentation">
        <List>
          {items.map((item) => (
            <ListItem key={item.label} disablePadding>
              {item.href ? (
                <ListItemButton
                  component={InertiaLink}
                  href={item.href}
                  onClick={() => onItemClick(item)}
                >
                  <ListItemText primary={item.label} />
                </ListItemButton>
              ) : (
                <ListItemButton onClick={() => onItemClick(item)}>
                  <ListItemText primary={item.label} />
                </ListItemButton>
              )}
            </ListItem>
          ))}
        </List>
      </Box>
    </Drawer>
  );
}
