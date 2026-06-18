"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config(); // Load environment variables from a .env file into process.env
// Import required modules
const express_1 = __importDefault(require("express")); // Creates the backend server and routes
const axios_1 = __importDefault(require("axios")); // Makes HTTP requests to external APIs
const cors_1 = __importDefault(require("cors")); // Allows frontend and backend to communicate across different ports/domains
const body_parser_1 = __importDefault(require("body-parser")); // Parses JSON request bodies so req.body is readable
const bcryptjs_1 = __importDefault(require("bcryptjs")); // Hashes and compares passwords
const nodemailer_1 = __importDefault(require("nodemailer")); // Sends emails from the contact form
const express_rate_limit_1 = __importDefault(require("express-rate-limit")); // Limits repeated requests to protect routes from spam
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken")); // Creates and verifies login tokens
const db_1 = __importDefault(require("./db")); // Connects to MongoDB
const google_auth_library_1 = require("google-auth-library"); // Verifies Google login credentials
const openai_1 = __importDefault(require("openai")); // Connects to the OpenAI API for the chatbot
const app = (0, express_1.default)(); // Initialize the Express application
const PORT = process.env.PORT || 5000; // Define the port number
const BASE_URL = 'https://pokeapi.co/api/v2'; // Base URL for the PokeAPI
const googleClient = new google_auth_library_1.OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Google auth client for verifying Google login
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY, // API key used for chatbot responses
});
const chatbotLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: 'Too many chatbot requests. Please try again later.',
});
const contactLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 3,
    message: 'Too many messages sent. Please try again later.',
});
app.use((0, cors_1.default)()); // Allows communication between one domain to another (front-end to back-end)
app.use(body_parser_1.default.json()); // Parses JSON request bodies (req.body is readable)
// Middleware that checks if the request has a valid login token
function authenticateUser(req, res, next) {
    // Get the Authorization header from the request
    // Example: "Bearer jwtToken..."
    const authHeader = req.headers.authorization;
    // If no token was sent, block the request
    if (!authHeader) {
        return res.status(401).send('No token provided');
    }
    // Extract only the token part after "Bearer"
    const token = authHeader.split(' ')[1];
    try {
        // Verify the token using the same secret used when creating it
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        // Example decoded token:
        // {
        //   username: "ash",
        //   email: "ash@example.com"
        // }
        // Store user info on req so protected routes can use it
        req.user = {
            username: decoded.username,
            email: decoded.email,
        };
        // Token is valid, so continue to the actual protected route
        // Without next(), the request would stop here and never reach the route
        next();
    }
    catch (error) {
        // Token is invalid or expired, so block the request
        res.status(401).send('Invalid or expired token');
    }
}
// Route to handle POST request for new user
app.post('/api/users/register', async (req, res) => {
    const { username, password } = req.body; // Extract username and password from the request body
    const hashedPassword = bcryptjs_1.default.hashSync(password, 8); // Hash the password for security
    try {
        const db = await (0, db_1.default)(); // Connect to the database
        const collection = db.collection('users'); // Access the 'users' collection
        const existingUser = await collection.findOne({ username }); // Check if the username already exists
        if (existingUser) {
            return res.status(409).send('User already exists'); // If user exists, send a conflict response
        }
        await collection.insertOne({
            username,
            password: hashedPassword,
            favorites: []
        });
        res.status(201).send('User created'); // Send a success response
    }
    catch (error) {
        res.status(500).send('Failed to register user'); // Send an error response if registration fails
    }
});
// Route for logging in returning users
app.post('/api/users/login', async (req, res) => {
    // Get username and password from the request body
    const { username, password } = req.body;
    try {
        // Connect to the users collection
        const db = await (0, db_1.default)();
        const collection = db.collection('users');
        // Look for a user with this username
        const user = await collection.findOne({ username });
        // Check that the user exists and the password matches the hashed password
        if (user && bcryptjs_1.default.compareSync(password, user.password)) {
            // Create a JWT token that proves the user is logged in
            // expiresIn: '1d' means the token expires after 1 day
            const token = jsonwebtoken_1.default.sign({ username: user.username }, process.env.JWT_SECRET, { expiresIn: '1d' });
            // Example response:
            // {
            //   message: "User logged in",
            //   token: "jwtToken...",
            //   username: "ash"
            // }
            // Send the token and username back to the frontend
            res.json({
                message: 'User logged in',
                token,
                username: user.username
            });
        }
        else {
            // User was not found or password was incorrect
            res.status(401).send('Invalid username or password');
        }
    }
    catch (error) {
        // Something went wrong while logging in
        res.status(500).send('Login error');
    }
});
// Route for getting one page/range of Pokémon
app.get('/api/pokemon', async (req, res) => {
    // Example frontend request:
    // /api/pokemon?page=2&limit=48
    //
    // page = which page of Pokémon to show
    // limit = how many Pokémon to return on that page
    const page = Number(req.query.page ?? 1);
    const limit = Number(req.query.limit ?? 48);
    // Convert page + limit into the offset format PokeAPI expects
    //
    // Example:
    // page = 2
    // limit = 48
    // offset = (2 - 1) * 48 = 48
    //
    // Meaning:
    // skip the first 48 Pokémon, then return the next 48
    const offset = (page - 1) * limit;
    try {
        // Fetch that specific range/page of Pokémon from PokeAPI
        // Example PokeAPI request:
        // /pokemon?offset=48&limit=48
        const response = await axios_1.default.get(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`);
        // Example response.data used by the frontend:
        // {
        //   count: 1302,
        //   results: [
        //     { name: "venonat", url: "https://pokeapi.co/api/v2/pokemon/48/" },
        //     { name: "venomoth", url: "https://pokeapi.co/api/v2/pokemon/49/" }
        //   ]
        // }
        //
        // Frontend uses:
        // res.data.results -> Pokémon for the current page
        // res.data.count -> total pages calculation
        res.json(response.data);
    }
    catch (error) {
        // Send an error if the PokeAPI request fails
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message });
    }
});
// GET request handler for the /api/pokemon/:name endpoint
app.get('/api/pokemon/:name', async (req, res) => {
    const { name } = req.params; // Extract the Pokémon name from the request parameters
    try {
        const response = await axios_1.default.get(`${BASE_URL}/pokemon/${name}`); // Fetch Pokémon data by name from the PokeAPI using name defined above
        res.json(response.data); // Send the fetched data as a JSON response
    }
    catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        res.status(500).json({ error: message }); // Send an error response if the fetch fails
    }
});
// Gets the logged-in user's favorite Pokémon
app.get('/api/users/favorites', authenticateUser, async (req, res) => {
    try {
        // Connect to the users collection
        const db = await (0, db_1.default)();
        const collection = db.collection('users');
        // Find user by email if they used Google login, otherwise by username
        const userQuery = req.user?.email
            ? { email: req.user.email }
            : { username: req.user?.username };
        // Example userQuery:
        // { username: "ash" }
        // or
        // { email: "ash@example.com" }
        const user = await collection.findOne(userQuery);
        // If the token is valid but the user no longer exists
        if (!user) {
            return res.status(404).send('User not found');
        }
        // Example response:
        // ["pikachu", "charizard"]
        res.json(user.favorites || []);
    }
    catch (error) {
        res.status(500).send('Failed to get favorites');
    }
});
// Adds a Pokémon to the logged-in user's favorites
app.post('/api/users/favorites', authenticateUser, async (req, res) => {
    // Example request body:
    // { pokemonName: "pikachu" }
    const { pokemonName } = req.body;
    // Make sure a Pokémon name was sent
    if (!pokemonName) {
        return res.status(400).send('Pokemon name is required');
    }
    try {
        // Connect to the users collection
        const db = await (0, db_1.default)();
        const collection = db.collection('users');
        // $addToSet adds the Pokémon only if it is not already in favorites
        await collection.updateOne(req.user?.email ? { email: req.user.email } : { username: req.user?.username }, { $addToSet: { favorites: pokemonName } });
        res.send('Favorite added');
    }
    catch (error) {
        res.status(500).send('Failed to add favorite');
    }
});
// Removes a Pokémon from the logged-in user's favorites
app.delete('/api/users/favorites/:pokemonName', authenticateUser, async (req, res) => {
    // Example request:
    // DELETE /api/users/favorites/pikachu
    const pokemonName = req.params.pokemonName;
    try {
        // Connect to the users collection
        const db = await (0, db_1.default)();
        const collection = db.collection('users');
        // $pull removes the Pokémon name from the favorites array
        await collection.updateOne(req.user?.email ? { email: req.user.email } : { username: req.user?.username }, { $pull: { favorites: pokemonName } });
        res.send('Favorite removed');
    }
    catch (error) {
        res.status(500).send('Failed to remove favorite');
    }
});
// Route for Google login/signup
app.post('/api/users/google', async (req, res) => {
    // Google sends a credential token from the frontend
    // Example request body:
    // { credential: "googleCredentialToken..." }
    const { credential } = req.body;
    // Make sure the credential was sent
    if (!credential) {
        return res.status(400).send('Google credential is required');
    }
    try {
        // Verify the Google credential with Google's servers
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        // Get the verified Google user info
        const payload = ticket.getPayload();
        // Example payload fields used:
        // {
        //   sub: "googleUserId...",
        //   email: "ash@example.com",
        //   name: "Ash Ketchum"
        // }
        const googleId = payload.sub;
        const email = payload.email;
        const username = payload.name || email;
        // Connect to the users collection
        const db = await (0, db_1.default)();
        const collection = db.collection('users');
        // Find an existing Google user by googleId or email
        let user = await collection.findOne({
            $or: [
                { googleId },
                { email }
            ]
        });
        // If the Google user does not exist yet, create a new account
        if (!user) {
            await collection.insertOne({
                username,
                email,
                googleId,
                authProvider: 'google',
                favorites: [],
            });
            // Fetch the newly created user
            user = await collection.findOne({ googleId });
        }
        // Create a login token for this Google user
        const token = jsonwebtoken_1.default.sign({
            username: user.username,
            email: user.email,
        }, process.env.JWT_SECRET, { expiresIn: '1d' } // Token expires after 1 day
        );
        // Example response:
        // {
        //   message: "Google login successful",
        //   token: "jwtToken...",
        //   username: "Ash Ketchum"
        // }
        // Send login data back to the frontend
        res.json({
            message: 'Google login successful',
            token,
            username: user.username,
        });
    }
    catch (error) {
        console.error('Google auth error:', error);
        // Send error if Google verification or login fails
        res.status(401).send('Google authentication failed');
    }
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
        const transporter = nodemailer_1.default.createTransport({
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
    }
    catch (error) {
        console.error('Contact email error:', error);
        res.status(500).send('Failed to send message.');
    }
});
app.post('/api/chatbot', chatbotLimiter, async (req, res) => {
    const { message } = req.body;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({ error: 'Message is required.' });
    }
    if (message.length > 500) {
        return res.status(400).json({ error: 'Message is too long.' });
    }
    try {
        const response = await openai.responses.create({
            model: 'gpt-4.1-mini',
            input: [
                {
                    role: 'system',
                    content: `
You are the PokéWorld website assistant.

Your job is to explain basic things about this website in a friendly, concise way.

Website context:
- PokéWorld is a Pokémon fan website.
- Users can browse Pokémon, view Pokémon details, search Pokémon, and filter by generation.
- Users can sign up, log in, or use Google login.
- Logged-in users can save favorite Pokémon/cards to their account.
- Favorites are stored per user in MongoDB Atlas.
- Users can explore Pokémon movies, TCG cards, TCG sets, and items.
- The Contact page lets users send feedback or questions.
- If asked about something unrelated to PokéWorld, politely redirect back to website help.
- Do not claim to perform account changes, purchases, or admin actions.
- Keep answers under 4 sentences unless the user asks for more detail.
          `,
                },
                {
                    role: 'user',
                    content: message,
                },
            ],
        });
        res.json({
            reply: response.output_text,
        });
    }
    catch (error) {
        console.error('Chatbot error:', error);
        res.status(500).json({ error: 'Failed to get chatbot response.' });
    }
});
// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
