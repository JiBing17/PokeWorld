require('dotenv').config(); // Load environment variables from a .env file into process.env

// Import required modules
const express = require('express');
const axios = require('axios');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');

const connectToDatabase = require('./db'); // Import the database connection function

const app = express(); // Initialize the Express application
const PORT = process.env.PORT || 5000; // Define the port number

app.use(cors()); // Allows communication between one domain to another (front-end to back-end)
app.use(bodyParser.json()); // Parses JSON request bodies (req.body is readable)
const jwt = require('jsonwebtoken');

const BASE_URL = 'https://pokeapi.co/api/v2'; // Base URL for the PokeAPI

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.username = decoded.username;
    next();
  } catch (error) {
    res.status(401).send('Invalid or expired token');
  }
}

// Route to handle POST request for new user
app.post('/api/users/register', async (req, res) => {
  const { username, password } = req.body; // Extract username and password from the request body
  const hashedPassword = bcrypt.hashSync(password, 8); // Hash the password for security

  try {
    const db = await connectToDatabase(); // Connect to the database
    const collection = db.collection('users'); // Access the 'users' collection
    
    const existingUser = await collection.findOne({ username }); // Check if the username already exists
    if (existingUser) {
      return res.status(409).send('User already exists'); // If user exists, send a conflict response
    }

    await collection.insertOne({  // Insert the new user into the database
      username,
      password: hashedPassword,
      favorites: []
    });
    res.status(201).send('User created'); // Send a success response
  } catch (error) {
    res.status(500).send('Failed to register user'); // Send an error response if registration fails
  }
});

// Route to handle POST request for logging in returning users
app.post('/api/users/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    const user = await collection.findOne({ username });

    if (user && bcrypt.compareSync(password, user.password)) {
      const token = jwt.sign(
        { username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        message: 'User logged in',
        token,
        username: user.username
      });
    } else {
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    res.status(500).send('Login error');
  }
});

// GET request handler for the /api/pokemon endpoint
app.get('/api/pokemon', async (req, res) => {
  const { page = 1, limit = 48 } = req.query; // Get pagination parameters from the query string
  const offset = (page - 1) * limit; // Calculate the offset

  try {
    const response = await axios.get(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`); // Fetch Pokémon data from the PokeAPI using variables defined above
    res.json(response.data); // Send the fetched data as a JSON response
  } catch (error) {
    res.status(500).json({ error: error.message }); // Send an error response if the fetch fails
  }
});

// GET request handler for the /api/pokemon/:name endpoint
app.get('/api/pokemon/:name', async (req, res) => {
  const { name } = req.params; // Extract the Pokémon name from the request parameters

  try {
    const response = await axios.get(`${BASE_URL}/pokemon/${name}`); // Fetch Pokémon data by name from the PokeAPI using name defined above
    res.json(response.data); // Send the fetched data as a JSON response
  } catch (error) {
    res.status(500).json({ error: error.message }); // Send an error response if the fetch fails
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); 
});

app.get('/api/users/favorites', authenticateUser, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    const user = await collection.findOne({ username: req.username });

    res.json(user.favorites || []);
  } catch (error) {
    res.status(500).send('Failed to get favorites');
  }
});

app.post('/api/users/favorites', authenticateUser, async (req, res) => {
  const { pokemonName } = req.body;

  if (!pokemonName) {
    return res.status(400).send('Pokemon name is required');
  }

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    await collection.updateOne(
      { username: req.username },
      { $addToSet: { favorites: pokemonName } }
    );

    res.send('Favorite added');
  } catch (error) {
    res.status(500).send('Failed to add favorite');
  }
});

app.delete('/api/users/favorites/:pokemonName', authenticateUser, async (req, res) => {
  const { pokemonName } = req.params;

  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    await collection.updateOne(
      { username: req.username },
      { $pull: { favorites: pokemonName } }
    );

    res.send('Favorite removed');
  } catch (error) {
    res.status(500).send('Failed to remove favorite');
  }
});