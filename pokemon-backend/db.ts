import { MongoClient, Db } from 'mongodb'; // Import the MongoClient class from the mongodb package

import dotenv from 'dotenv';

dotenv.config(); // Load environment variables from a .env file into process.env

let client: MongoClient | null = null;

let db: Db | undefined; // Initialize a variable to hold the database connection

// Function to connect to the MongoDB database and it returns the database connection object
export default async function connectToDatabase(): Promise<Db> {
  // If the database connection is not already established, establish it
  if (!db) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error('MONGODB_URI is missing from .env');
    }

    try {
      // Connect to the MongoDB server and select the targeted database
      client = new MongoClient(uri);
      await client.connect();
      db = client.db('pokeAPI');
      console.log('Connected to MongoDB Atlas');

      // Log any errors that occur during the connection process
    } catch (err) {
      console.error('Failed to connect to MongoDB', err);
      throw err;
    }
  }

  // Return the database connection object
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = undefined;
  }
}
