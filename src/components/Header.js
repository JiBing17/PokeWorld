import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Box, IconButton, Typography, Tooltip } from '@mui/material';
import { useAuth } from '../AuthContext';
import AuthPopup from './Authpopup';
import FavoriteIcon from '@mui/icons-material/Favorite';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MovieIcon from '@mui/icons-material/Movie';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark'; 
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';        
import BackpackIcon from '@mui/icons-material/Backpack';                       
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

function Header() {
    // Get the setIsAuthenticated function from the authentication context
    const { isAuthenticated, setIsAuthenticated } = useAuth();
    const [showAuthPopup, setShowAuthPopup] = useState(false);

    // Handles user logout by clearing localStorage and updating authentication state
    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('username');
        setIsAuthenticated(false);
    };

    return (
        <>
            <AppBar position="fixed" style={{ background: '#C22E28' }}>  
                <Toolbar>
                    {/** Home Link **/}
                    <Box
                        component={Link}
                        to="/"
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            textDecoration: 'none',
                            color: 'inherit',
                            flexGrow: 1,
                        }}
                    >
                        <Typography
                            variant="h4"
                            sx={{
                                fontWeight: 900,
                                letterSpacing: '1px',
                                color: '#FFCC00',
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

                    {/* Card Sets (TCG) */}
                    <IconButton component={Link} to="/sets" color="inherit" sx={{ mr: 2 }}>
                        <CollectionsBookmarkIcon />
                    </IconButton>

                    {/* Trading (TCG cards) */}
                    <IconButton component={Link} to="/trading" color="inherit" sx={{ mr: 2 }}>
                        <CatchingPokemonIcon />
                    </IconButton>

                    {/* In-Game Items / Collectibles */}
                    {/* <IconButton component={Link} to="/items" color="inherit" sx={{ mr: 2 }}>
                        <BackpackIcon />
                    </IconButton> */}

                    {/** Movies Link **/}
                    <IconButton component={Link} to="/movies" color="inherit" sx={{ mr: 2 }}>
                        <MovieIcon />
                    </IconButton>

                    {/** Favorite Cards Link **/}
                    <IconButton component={Link} to="/pokemon/favorites" color="inherit" sx={{ mr: 2 }}>
                        <FavoriteIcon />
                    </IconButton>

                    {/** Contact Link **/}
                    <IconButton component={Link} to="/contact" color="inherit" sx={{ mr: 2 }}>
                        <HelpOutlineIcon />
                    </IconButton>

                    {/** Login Status / Logout **/}
                    {isAuthenticated ? (
                        <Tooltip title="Logout">
                            <IconButton color="inherit" onClick={handleLogout}>
                                <ExitToAppIcon />
                            </IconButton>
                        </Tooltip>
                    ) : (
                        <Tooltip title="Login or create an account to save favorites">
                            <IconButton color="inherit" onClick={() => setShowAuthPopup(true)}>
                                <AccountCircleIcon />
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
            </AppBar>

            {/* Conditional rendering login/signup component if state is true */}
            {showAuthPopup && (
                <AuthPopup onClose={() => setShowAuthPopup(false)} />
            )}
        </>
    );
}

export default Header;