import sqlite3 from 'sqlite3';
import { Database } from 'sqlite3';
import path from 'path';
import fs from 'fs';

const dbPath = path.resolve(__dirname, '../../../database/users.db');

// Ensure the database directory exists
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db: Database = new sqlite3.Database(dbPath);

// Initialize database schema
const schema = `
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
        user_id INTEGER PRIMARY KEY,
        difficulty VARCHAR(50) NOT NULL,
        max_slope INTEGER NOT NULL,
        avoid_stairs BOOLEAN NOT NULL,
        prefer_elevators BOOLEAN NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`;

db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating database schema:', err);
    } else {
        console.log('Database schema initialized successfully');
    }
});

export default db; 