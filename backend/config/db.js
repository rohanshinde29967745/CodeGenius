import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const { Pool } = pg;

// Create a connection pool
const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || "codegenius",
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD,
    max: 20, // Maximum number of connections
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Test the connection
pool.on("connect", () => {
    console.log("✅ Connected to PostgreSQL database");
});

pool.on("error", (err) => {
    console.error("❌ PostgreSQL connection error:", err);
});

// Helper function to run queries
export const query = (text, params) => pool.query(text, params);

// Get a client for transactions
export const getClient = () => pool.connect();

export default pool;
