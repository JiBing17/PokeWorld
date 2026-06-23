import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Box,
  IconButton,
  Typography,
  Tooltip,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useAuth } from '../AuthContext';
import AuthPopup from './Authpopup';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MovieIcon from '@mui/icons-material/Movie';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark';
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';

const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: <HomeIcon /> },
  { to: '/sets', label: 'Card Sets', icon: <CollectionsBookmarkIcon /> },
  { to: '/trading', label: 'TCG Market', icon: <CatchingPokemonIcon /> },
  { to: '/movies', label: 'Movies', icon: <MovieIcon /> },
  { to: '/pokemon/favorites', label: 'Favorites', icon: <FavoriteIcon /> },
  { to: '/contact', label: 'Contact', icon: <HelpOutlineIcon /> },
];

function Header() {
  const { isAuthenticated, setIsAuthenticated } = useAuth();
  const [showAuthPopup, setShowAuthPopup] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setDrawerOpen(false);
  };

  const closeDrawer = () => setDrawerOpen(false);

  return (
    <>
      <AppBar position="fixed" sx={{ background: '#C22E28' }}>
        <Toolbar sx={{ px: { xs: 1, sm: 2 }, minHeight: { xs: 56, md: 64 } }}>
          <Box
            component={Link}
            to="/"
            sx={{
              display: 'flex',
              alignItems: 'center',
              textDecoration: 'none',
              color: 'inherit',
              flexGrow: 1,
              minWidth: 0,
            }}
          >
            <Typography
              variant="h4"
              sx={{
                fontWeight: 900,
                letterSpacing: '1px',
                color: '#FFCC00',
                fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2.125rem' },
                textShadow: `
                  -2px -2px 0 #2A75BB,
                  2px -2px 0 #2A75BB,
                  -2px 2px 0 #2A75BB,
                  2px 2px 0 #2A75BB,
                  3px 3px 0 rgba(0, 0, 0, 0.25)
                `,
                fontFamily: 'Arial Black, Arial, sans-serif',
              }}
            >
              PokéWorld
            </Typography>
          </Box>

          {!isMobile && (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {NAV_ITEMS.slice(1).map((item) => (
                <Tooltip key={item.to} title={item.label}>
                  <IconButton component={Link} to={item.to} color="inherit" sx={{ mx: 0.5 }}>
                    {item.icon}
                  </IconButton>
                </Tooltip>
              ))}

              {isAuthenticated ? (
                <Tooltip title="Logout">
                  <IconButton color="inherit" onClick={handleLogout} sx={{ ml: 0.5 }}>
                    <ExitToAppIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Login or create an account to save favorites">
                  <IconButton color="inherit" onClick={() => setShowAuthPopup(true)} sx={{ ml: 0.5 }}>
                    <AccountCircleIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          )}

          {isMobile && (
            <IconButton color="inherit" onClick={() => setDrawerOpen(true)} aria-label="Open menu">
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={closeDrawer}
        PaperProps={{ sx: { width: 280, bgcolor: '#FFFDF8' } }}
      >
        <Box sx={{ px: 2, py: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 900, color: '#C22E28' }}>
            Menu
          </Typography>
        </Box>
        <Divider />
        <List sx={{ py: 1 }}>
          {NAV_ITEMS.map((item) => (
            <ListItemButton
              key={item.to}
              component={Link}
              to={item.to}
              selected={location.pathname === item.to}
              onClick={closeDrawer}
              sx={{
                py: 1.25,
                '&.Mui-selected': { bgcolor: 'rgba(194, 46, 40, 0.08)' },
              }}
            >
              <ListItemIcon sx={{ color: '#C22E28', minWidth: 40 }}>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          ))}
        </List>
        <Divider />
        <List sx={{ py: 1 }}>
          {isAuthenticated ? (
            <ListItemButton onClick={handleLogout} sx={{ py: 1.25 }}>
              <ListItemIcon sx={{ color: '#C22E28', minWidth: 40 }}>
                <ExitToAppIcon />
              </ListItemIcon>
              <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          ) : (
            <ListItemButton
              onClick={() => {
                closeDrawer();
                setShowAuthPopup(true);
              }}
              sx={{ py: 1.25 }}
            >
              <ListItemIcon sx={{ color: '#C22E28', minWidth: 40 }}>
                <AccountCircleIcon />
              </ListItemIcon>
              <ListItemText primary="Login / Sign up" primaryTypographyProps={{ fontWeight: 700 }} />
            </ListItemButton>
          )}
        </List>
      </Drawer>

      {showAuthPopup && <AuthPopup onClose={() => setShowAuthPopup(false)} />}
    </>
  );
}

export default Header;
