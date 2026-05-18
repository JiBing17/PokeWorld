import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import PokemonDetails from './components/pokeAPI/PokemonDetails.js';
import { AuthProvider } from './AuthContext';
import Favorites from './components/pokeAPI/Favorites.js';
import Contact from './components/Contact.js';
import Movies from './components/pokemonMovies/Movies.js';
import TcgMarket from './components/pokemonTCG/tcgMarket.js';
import MovieDetail from './components/pokemonMovies/MovieDetail.js';
import Items from './Items.js';
import SetGallery from './components/pokemonTCG/SetGallery.js';

// Sets up the router and provides authentication context to all routes
function App() {
    return (
        <AuthProvider>
            <Router>
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
                    {/* <Route path="/items" element={<Items />} /> */}
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;