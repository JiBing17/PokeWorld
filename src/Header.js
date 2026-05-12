import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppBar, Toolbar, Box, IconButton } from '@mui/material';
import { useAuth } from './AuthContext';
import FavoriteIcon from '@mui/icons-material/Favorite'
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import MovieIcon from '@mui/icons-material/Movie';
import CollectionsBookmarkIcon from '@mui/icons-material/CollectionsBookmark'; 
import CatchingPokemonIcon from '@mui/icons-material/CatchingPokemon';        
import BackpackIcon from '@mui/icons-material/Backpack';                       
function Header() {
    // Get the setIsAuthenticated function from the authentication context
    const { setIsAuthenticated } = useAuth();
    
    // Tool to navigate to different routes
    const navigate = useNavigate();

    return (
        <AppBar position="fixed" style={{ background: '#C22E28' }}>  
            <Toolbar>
                {/** Home Link **/}
                <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/9/98/International_Pokémon_logo.svg"
                        style={{ height: '40px'}}
                    />
                </Box>
                {/* Card Sets (TCG) */}
                <IconButton component={Link} to="/sets" color="inherit" sx={{ mr: 2 }}>
                    <CollectionsBookmarkIcon />
                </IconButton>

                {/* Games / Card Browser (TCG cards) */}
                <IconButton component={Link} to="/games" color="inherit" sx={{ mr: 2 }}>
                    <CatchingPokemonIcon />
                </IconButton>

                {/* In-Game Items / Collectibles */}
                <IconButton component={Link} to="/items" color="inherit" sx={{ mr: 2 }}>
                    <BackpackIcon />
                </IconButton>

                {/** Movies Link **/}
                <IconButton component={Link} to="/movies" color="inherit" sx={{ mr: 2 }}>
                    <MovieIcon/>
                </IconButton>
                {/** Favorite Cards Link **/}
                <IconButton component={Link} to="/pokemon/favorites" color="inherit" sx={{ mr: 2 }}>
                    <FavoriteIcon />
                </IconButton>
                {/** Contact Link **/}
                <IconButton component={Link} to="/contact" color="inherit" sx={{ mr: 2 }}>
                    < HelpOutlineIcon />
                </IconButton>
                
            </Toolbar>
        </AppBar>
    );
}

export default Header;