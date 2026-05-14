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
const { OAuth2Client } = require('google-auth-library');
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const BASE_URL = 'https://pokeapi.co/api/v2'; // Base URL for the PokeAPI

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).send('No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    req.user = {
      username: decoded.username,
      email: decoded.email,
    };

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

app.get('/api/users/favorites', authenticateUser, async (req, res) => {
  try {
    const db = await connectToDatabase();
    const collection = db.collection('users');

    const userQuery = req.user.email
      ? { email: req.user.email }
      : { username: req.user.username };

    const user = await collection.findOne(userQuery);

    if (!user) {
      return res.status(404).send('User not found');
    }

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
      req.user.email ? { email: req.user.email } : { username: req.user.username },
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
      req.user.email ? { email: req.user.email } : { username: req.user.username },
      { $pull: { favorites: pokemonName } }
    );

    res.send('Favorite removed');
  } catch (error) {
    res.status(500).send('Failed to remove favorite');
  }
});

// Route to handle Google login/signup
app.post('/api/users/google', async (req, res) => {
  const { credential } = req.body;

  if (!credential) {
    return res.status(400).send('Google credential is required');
  }

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const googleId = payload.sub;
    const email = payload.email;
    const username = payload.name || email;

    const db = await connectToDatabase();
    const collection = db.collection('users');

    let user = await collection.findOne({
      $or: [
        { googleId },
        { email }
      ]
    });

    if (!user) {
      await collection.insertOne({
        username,
        email,
        googleId,
        authProvider: 'google',
        favorites: [],
      });

      user = await collection.findOne({ googleId });
    }

    const token = jwt.sign(
      {
        username: user.username,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Google login successful',
      token,
      username: user.username,
    });
  } catch (error) {
    console.error('Google auth error:', error);
    res.status(401).send('Google authentication failed');
  }
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many messages sent. Please try again later.',
});

app.post('/api/contact', contactLimiter, async (req, res) => {
  const { name, email, subject, message, website } = req.body;

  if (website) {
    return res.status(400).send('Invalid request.');
  }

  if (!name || !email || !subject || !message) {
    return res.status(400).send('All fields are required.');
  }

  if (name.length > 80) {
    return res.status(400).send('Name is too long.');
  }

  if (email.length > 120) {
    return res.status(400).send('Email is too long.');
  }

  if (subject.length > 120) {
    return res.status(400).send('Subject is too long.');
  }

  if (message.length > 2000) {
    return res.status(400).send('Message is too long.');
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.CONTACT_RECEIVER_EMAIL,
      replyTo: email,
      subject: `PokéWorld Contact: ${subject}`,
      text: `
Name: ${name}
Email: ${email}
Subject: ${subject}

Message:
${message}
      `,
    });

    res.status(200).send('Message sent successfully.');
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).send('Failed to send message.');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`); 
});