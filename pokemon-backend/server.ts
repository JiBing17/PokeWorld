import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from a .env file into process.env

// Import required modules
import express, { NextFunction, Request, Response } from 'express'; // Creates the backend server and routes
import axios from 'axios'; // Makes HTTP requests to external APIs
import cors from 'cors'; // Allows frontend and backend to communicate across different ports/domains
import helmet from 'helmet';
import bodyParser from 'body-parser'; // Parses JSON request bodies so req.body is readable
import bcrypt from 'bcryptjs'; // Hashes and compares passwords
import rateLimit from 'express-rate-limit'; // Limits repeated requests to protect routes from spam
import jwt from 'jsonwebtoken'; // Creates and verifies login tokens
import connectToDatabase from './db'; // Connects to MongoDB
import type { UpdateFilter, Document } from 'mongodb';
import { OAuth2Client } from 'google-auth-library'; // Verifies Google login credentials
import { CACHE_TTL, getCached } from './apiCache';
import { getQuickPromptReply } from './chatbotFallback';
import { AGENT_NAME, SITE_ASSISTANT_PROMPT } from './chatbotPrompt';
import { chatbotError } from './chatbotErrors';
import { validateCredentials, isValidContactEmail, isValidPokemonName } from './authValidation';
import { apiProxyLimiter, proxyTmdb, proxyTcg } from './apiProxies';
import { requireApiToken } from './apiAuth';
import { sendContactEmail } from './contactEmail';
import { batchFetchPokemon } from './pokemonBatch';

declare global {
  namespace Express {
    interface Request {
      user?: {
        username?: string;
        email?: string;
      };
    }
  }
}

const app = express(); // Initialize the Express application
app.set('trust proxy', 1); // Required on Render for rate limiting behind a reverse proxy
const PORT = process.env.PORT || 5000; // Define the port number
const BASE_URL = 'https://pokeapi.co/api/v2'; // Base URL for the PokeAPI
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID); // Google auth client for verifying Google login
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL ?? 'gemini-2.5-flash-lite';
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models';
const IS_PROD = process.env.NODE_ENV === 'production';

const ALLOWED_ORIGINS = (process.env.FRONTEND_URL ?? 'http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function publicApiError(fallback: string, error?: unknown): string {
  if (!IS_PROD && error instanceof Error) {
    return error.message;
  }
  return fallback;
}

function isZeroQuotaError(message?: string): boolean {
  return typeof message === 'string' && message.includes('limit: 0');
}

function isRetryableGeminiError(status?: number, message?: string): boolean {
  if (status === 503) return true;
  if (status !== 429) return false;
  return !isZeroQuotaError(message);
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function requestGeminiReply(
  contents: Array<{ role: string; parts: Array<{ text: string }> }>,
): Promise<string> {
  const maxAttempts = 3;
  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      const response = await axios.post<{
        candidates?: Array<{
          content?: { parts?: Array<{ text?: string }> };
        }>;
      }>(
        `${GEMINI_API_URL}/${GEMINI_MODEL}:generateContent`,
        {
          systemInstruction: {
            parts: [{ text: SITE_ASSISTANT_PROMPT }],
          },
          contents,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': GEMINI_API_KEY,
          },
        },
      );

      const reply = response.data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (!reply) {
        throw new Error('No response from assistant.');
      }

      return reply;
    } catch (error) {
      lastError = error;

      if (!axios.isAxiosError(error)) {
        throw error;
      }

      const status = error.response?.status;
      const apiMessage = (error.response?.data as { error?: { message?: string } } | undefined)
        ?.error?.message;

      if (!isRetryableGeminiError(status, apiMessage) || attempt === maxAttempts - 1) {
        throw error;
      }

      const retryAfterHeader = error.response?.headers?.['retry-after'];
      const retryAfterMs = retryAfterHeader ? Number(retryAfterHeader) * 1000 : 1000 * 2 ** attempt;
      await wait(Number.isFinite(retryAfterMs) ? retryAfterMs : 1000);
    }
  }

  throw lastError;
}

interface ChatHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

const chatbotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  handler: (_req, res) => {
    res
      .status(429)
      .json(
        chatbotError(
          'AGENT_RATE_LIMITED',
          `${AGENT_NAME} needs a short break — too many messages at once. Please wait a few minutes and try again.`,
        ),
      );
  },
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: 'Too many messages sent. Please try again later.',
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts. Please try again later.',
});

const pokemonLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: 'Too many Pokémon API requests. Please try again later.',
});

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  }),
);

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || ALLOWED_ORIGINS.includes(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('Not allowed by CORS'));
    },
  }),
);
app.use(bodyParser.json()); // Parses JSON request bodies (req.body is readable)

app.use('/api', requireApiToken);

// Middleware that checks if the request has a valid login token
function authenticateUser(req: Request, res: Response, next: NextFunction) {
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload & {
      username?: string;
      email?: string;
    };

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
  } catch (error) {
    // Token is invalid or expired, so block the request
    res.status(401).send('Invalid or expired token');
  }
}

// Route to handle POST request for new user
app.post('/api/users/register', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).send(validationError);
  }

  const trimmedUsername = String(username).trim();
  const hashedPassword = bcrypt.hashSync(String(password), 10);

  try {
    const db = await connectToDatabase(); // Connect to the database
    const collection = db.collection('users'); // Access the 'users' collection

    const existingUser = await collection.findOne({ username: trimmedUsername });
    if (existingUser) {
      return res.status(409).send('User already exists');
    }

    await collection.insertOne({
      username: trimmedUsername,
      password: hashedPassword,
      favorites: [],
    });
    res.status(201).send('User created'); // Send a success response
  } catch (error) {
    res.status(500).send('Failed to register user'); // Send an error response if registration fails
  }
});

// Route for logging in returning users
app.post('/api/users/login', authLimiter, async (req, res) => {
  const { username, password } = req.body;
  const validationError = validateCredentials(username, password);
  if (validationError) {
    return res.status(400).send(validationError);
  }

  const trimmedUsername = String(username).trim();

  try {
    // Connect to the users collection
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Look for a user with this username
    const user = await collection.findOne({ username: trimmedUsername });

    // Check that the user exists and the password matches the hashed password
    if (user && bcrypt.compareSync(password, user.password)) {
      // Create a JWT token that proves the user is logged in
      // expiresIn: '1d' means the token expires after 1 day
      const token = jwt.sign({ username: user.username }, process.env.JWT_SECRET as string, {
        expiresIn: '1d',
      });

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
        username: user.username,
      });
    } else {
      // User was not found or password was incorrect
      res.status(401).send('Invalid username or password');
    }
  } catch (error) {
    // Something went wrong while logging in
    res.status(500).send('Login error');
  }
});

// Route for getting one page/range of Pokémon
app.get('/api/pokemon', pokemonLimiter, async (req, res) => {
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
    const cacheKey = `pokeapi:list:${offset}:${limit}`;
    const data = await getCached(
      cacheKey,
      async () => {
        const response = await axios.get(`${BASE_URL}/pokemon?offset=${offset}&limit=${limit}`, {
          headers: {
            'User-Agent': 'PokeWorld/1.0 (fan project; https://pokeapi.co)',
          },
        });
        return response.data;
      },
      CACHE_TTL.MEDIUM,
    );

    res.set('Cache-Control', 'public, max-age=300');
    res.json(data);
  } catch (error) {
    console.error('PokeAPI list error:', error);
    res.status(500).json({ error: publicApiError('Failed to fetch Pokémon data.', error) });
  }
});

app.post('/api/pokemon/batch', pokemonLimiter, (req, res) => {
  void batchFetchPokemon(req, res);
});

// GET request handler for the /api/pokemon/:name endpoint
app.get('/api/pokemon/:name', pokemonLimiter, async (req, res) => {
  const { name } = req.params;

  if (!isValidPokemonName(name)) {
    return res.status(400).json({ error: 'Invalid Pokémon name.' });
  }

  try {
    const cacheKey = `pokeapi:pokemon:${name.toLowerCase()}`;
    const data = await getCached(
      cacheKey,
      async () => {
        const response = await axios.get(`${BASE_URL}/pokemon/${name}`, {
          headers: {
            'User-Agent': 'PokeWorld/1.0 (fan project; https://pokeapi.co)',
          },
        });
        return response.data;
      },
      CACHE_TTL.LONG,
    );

    res.set('Cache-Control', 'public, max-age=3600');
    res.json(data);
  } catch (error) {
    console.error('PokeAPI detail error:', error);
    res.status(500).json({ error: publicApiError('Failed to fetch Pokémon data.', error) });
  }
});

// Gets the logged-in user's favorite Pokémon
app.get('/api/users/favorites', authenticateUser, async (req, res) => {
  try {
    // Connect to the users collection
    const db = await connectToDatabase();
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
  } catch (error) {
    res.status(500).send('Failed to get favorites');
  }
});

// Adds a Pokémon to the logged-in user's favorites
app.post('/api/users/favorites', authenticateUser, async (req, res) => {
  // Example request body:
  // { pokemonName: "pikachu" }
  const { pokemonName } = req.body;

  if (!isValidPokemonName(pokemonName)) {
    return res.status(400).send('Invalid Pokémon name.');
  }

  try {
    // Connect to the users collection
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // $addToSet adds the Pokémon only if it is not already in favorites
    await collection.updateOne(
      req.user?.email ? { email: req.user.email } : { username: req.user?.username },
      { $addToSet: { favorites: pokemonName } },
    );

    res.send('Favorite added');
  } catch (error) {
    res.status(500).send('Failed to add favorite');
  }
});

// Removes a Pokémon from the logged-in user's favorites
app.delete('/api/users/favorites/:pokemonName', authenticateUser, async (req, res) => {
  // Example request:
  // DELETE /api/users/favorites/pikachu
  const pokemonName = req.params.pokemonName;

  if (!isValidPokemonName(pokemonName)) {
    return res.status(400).send('Invalid Pokémon name.');
  }

  try {
    // Connect to the users collection
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // $pull removes the Pokémon name from the favorites array
    await collection.updateOne(
      req.user?.email ? { email: req.user.email } : { username: req.user?.username },
      { $pull: { favorites: pokemonName } } as unknown as UpdateFilter<Document>,
    );

    res.send('Favorite removed');
  } catch (error) {
    res.status(500).send('Failed to remove favorite');
  }
});

// Route for Google login/signup
app.post('/api/users/google', authLimiter, async (req, res) => {
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
    const googleId = payload!.sub;
    const email = payload!.email;
    const username = payload!.name || email;

    // Connect to the users collection
    const db = await connectToDatabase();
    const collection = db.collection('users');

    // Find an existing Google user by googleId or email
    let user = await collection.findOne({
      $or: [{ googleId }, { email }],
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
    const token = jwt.sign(
      {
        username: user!.username,
        email: user!.email,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: '1d' }, // Token expires after 1 day
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
      username: user!.username,
    });
  } catch (error) {
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

  if (!isValidContactEmail(String(email))) {
    return res.status(400).send('Invalid email address.');
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
    await sendContactEmail({
      name: String(name),
      email: String(email),
      subject: String(subject),
      message: String(message),
    });

    res.status(200).send('Message sent successfully.');
  } catch (error) {
    console.error('Contact email error:', error);
    res.status(500).send('Failed to send message.');
  }
});

app.use('/api/tmdb', apiProxyLimiter, (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  void proxyTmdb(req, res);
});

app.use('/api/tcg', apiProxyLimiter, (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }
  void proxyTcg(req, res);
});

app.post('/api/chatbot', chatbotLimiter, async (req, res) => {
  const { message, history } = req.body as {
    message?: string;
    history?: ChatHistoryItem[];
  };

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required.' });
  }

  if (message.length > 500) {
    return res.status(400).json({ error: 'Message is too long.' });
  }

  const quickReply = getQuickPromptReply(message);
  if (quickReply) {
    return res.json({ reply: quickReply });
  }

  if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your_gemini_api_key_here') {
    return res
      .status(503)
      .json(
        chatbotError(
          'AGENT_OFFLINE',
          `${AGENT_NAME} isn't connected right now. You can still explore the site — or visit the Contact page if you need help.`,
        ),
      );
  }

  const safeHistory = Array.isArray(history)
    ? history
        .filter(
          (item) =>
            item &&
            (item.role === 'user' || item.role === 'assistant') &&
            typeof item.content === 'string',
        )
        .slice(-10)
        .map((item) => ({
          role: item.role,
          content: item.content.slice(0, 500),
        }))
    : [];

  const contents = [
    ...safeHistory.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    {
      role: 'user',
      parts: [{ text: message }],
    },
  ];

  try {
    const reply = await requestGeminiReply(contents);
    res.json({ reply });
  } catch (error) {
    console.error('Chatbot error:', error);

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const apiError = error.response?.data as {
        error?: { message?: string; status?: string };
      };
      const apiMessage = apiError?.error?.message;

      if (status === 429) {
        if (isZeroQuotaError(apiMessage)) {
          return res
            .status(503)
            .json(
              chatbotError(
                'AGENT_OFFLINE',
                `${AGENT_NAME} can't answer custom questions right now. Try the quick prompts below, or use the Contact page — those always work!`,
              ),
            );
        }

        if (apiMessage?.toLowerCase().includes('high demand')) {
          return res
            .status(503)
            .json(
              chatbotError(
                'AGENT_BUSY',
                `${AGENT_NAME} is a little overwhelmed — lots of trainers asking questions at once! Wait a few seconds and try again.`,
              ),
            );
        }

        return res
          .status(429)
          .json(
            chatbotError(
              'AGENT_RATE_LIMITED',
              `${AGENT_NAME} needs a breather — you've hit the message limit. Wait a minute and try again.`,
            ),
          );
      }

      if (status === 503 || apiMessage?.toLowerCase().includes('high demand')) {
        return res
          .status(503)
          .json(
            chatbotError(
              'AGENT_BUSY',
              `${AGENT_NAME} is taking a quick rest — the servers are busy. Try again in a few seconds!`,
            ),
          );
      }

      if (status === 401 || status === 403) {
        return res
          .status(503)
          .json(
            chatbotError(
              'AGENT_OFFLINE',
              `${AGENT_NAME} isn't available right now. Use the quick prompts below or the Contact page in the meantime.`,
            ),
          );
      }

      if (apiMessage) {
        return res
          .status(500)
          .json(chatbotError('AGENT_ERROR', `${AGENT_NAME} ran into a hiccup. Please try again.`));
      }
    }

    res
      .status(500)
      .json(chatbotError('AGENT_ERROR', `${AGENT_NAME} ran into a hiccup. Please try again.`));
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
