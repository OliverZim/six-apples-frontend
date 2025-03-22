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
        difficulty VARCHAR(50),
        age INTEGER,
        avoid_stairs INTEGER DEFAULT 0,
        prefer_elevators INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;

// Add migration for existing databases
const migration = `
    BEGIN TRANSACTION;
    
    -- Create temporary table with new schema
    CREATE TABLE users_new (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        difficulty VARCHAR(50),
        age INTEGER,
        avoid_stairs INTEGER DEFAULT 0,
        prefer_elevators INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    
    -- Copy data from old table to new table
    INSERT INTO users_new 
    SELECT 
        id,
        username,
        email,
        password_hash,
        difficulty,
        NULL as age,
        CASE WHEN avoid_stairs = 1 THEN 1 ELSE 0 END as avoid_stairs,
        CASE WHEN prefer_elevators = 1 THEN 1 ELSE 0 END as prefer_elevators,
        created_at
    FROM users;
    
    -- Drop old table and rename new table
    DROP TABLE users;
    ALTER TABLE users_new RENAME TO users;
    
    COMMIT;
`;

db.exec(schema, (err) => {
    if (err) {
        console.error('Error creating database schema:', err);
    } else {
        console.log('Database schema initialized successfully');
        // Run migration
        db.exec(migration, (migrationErr) => {
            if (migrationErr) {
                console.error('Error running migration:', migrationErr);
            } else {
                console.log('Database migration completed successfully');
            }
        });
    }
});

export default db; 