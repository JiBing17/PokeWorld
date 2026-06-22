import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box } from '@mui/material';
import Home from './Home';
import PokemonDetails from './components/pokeAPI/PokemonDetails';
import { AuthProvider } from './AuthContext';
import Favorites from './components/pokeAPI/Favorites';
import Contact from './components/Contact';
import Movies from './components/pokemonMovies/Movies';
import TcgMarket from './components/pokemonTCG/tcgMarket';
import MovieDetail from './components/pokemonMovies/MovieDetail';
import SetGallery from './components/pokemonTCG/SetGallery';
import SiteChatbot from './components/chatbot/SiteChatbot';
import SiteFooter from './components/layout/SiteFooter';
import Privacy from './components/Privacy';

// Sets up the router and provides authentication context to all routes
function App() {
    return (
        <AuthProvider> { /** Provides authentication state to the entire app **/ }
            <Router>
                <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ flex: 1 }}>
                        <Routes>
                            {/** Home page is public and loads first **/}
                            <Route path="/" element={<Home />} />

                            {/** Public routes **/}
                            <Route path="/pokemon/:pokemonName" element={<PokemonDetails />} />
                            <Route path="/movies" element={<Movies />} />
                            <Route path="/trading" element={<TcgMarket />} />
                            <Route path="/movie/:id" element={<MovieDetail />} />
                            <Route path="/sets" element={<SetGallery />} />
                            <Route path="/pokemon/favorites" element={<Favorites />} />
                            <Route path="/contact" element={<Contact />} />
                            <Route path="/privacy" element={<Privacy />} />
                            {/* needs work <Route path="/items" element={<Items />} /> */}
                        </Routes>
                    </Box>
                    <SiteFooter />
                </Box>
                <SiteChatbot />
            </Router>
        </AuthProvider>
    );
}

export default App;
