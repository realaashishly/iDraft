// lib/db.ts
import { type Db, MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}
if (!process.env.MONGODB_DB_NAME) {
  throw new Error("Please define the MONGODB_DB_NAME environment variable");
}

// Augment the global type to hold our cached connection
const globalForMongo = global as typeof globalThis & {
  _mongoClientPromise?: Promise<MongoClient>;
};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let db: Db;

if (process.env.NODE_ENV === "development") {
  // In development mode, use a global variable so that the value
  // is preserved across module reloads caused by HMR (Hot Module Replacement).
  if (!globalForMongo._mongoClientPromise) {
    client = new MongoClient(process.env.MONGODB_URI);
    globalForMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalForMongo._mongoClientPromise;
} else {
  // In production mode, it's best to not use a global variable.
  client = new MongoClient(process.env.MONGODB_URI);
  clientPromise = client.connect();
}

// Get the 'db' instance from the client promise
// We're connecting to the DB specified in the environment variable
db = (await clientPromise).db(process.env.MONGODB_DB_NAME);

// Export the 'db' instance directly
export { db };

// Optional: Export the client promise if you need to access the client itself
export { clientPromise };
