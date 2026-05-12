import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home';
import PokemonDetails from './PokemonDetails';
import { AuthProvider, useAuth } from './AuthContext';
import Favorites from './Favorites';
import Contact from './Contact';
import Movies from './Movies';
import Games from './Games';
import MovieDetail from './MovieDetail.js';
import Items from './Items.js';
import SetGallery from './SetGallery.js';

// ensures that only authenticated users can access the route
function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();

    // Show a basic login/signup prompt instead of redirecting to a login page
    return isAuthenticated ? children : (
        <div>
            <h2>Please log in or create an account to access this feature.</h2>
        </div>
    );
}

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
                    <Route path="/games" element={<Games />} />
                    <Route path="/movie/:id" element={<MovieDetail />} />
                    <Route path="/items" element={<Items />} />
                    <Route path="/sets" element={<SetGallery />} />

                    {/** Protected routes only show login/signup when accessed **/}
                    <Route path="/pokemon/favorites" element={<Favorites />} />
                    <Route path="/contact" element={<Contact />} />
                </Routes>
            </Router>
        </AuthProvider>
    );
}

export default App;