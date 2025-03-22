import bcrypt from 'bcryptjs';
import db from './database';

export interface User {
    id: number;
    username: string;
    email: string;
    preferences?: UserPreferences;
}

export interface UserPreferences {
    difficulty: 'no impairment' | 'crutches/walking stick' | 'prosthesis' | 'wheelchair';
    age: number;
    avoidStairs: boolean;
    preferElevators: boolean;
}

interface DBUser {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    difficulty?: string;
    age?: number;
    avoid_stairs?: number;
    prefer_elevators?: number;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export class AuthService {
    static async findUserByEmail(email: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            db.get<DBUser>(
                'SELECT id, username, email, difficulty, age, avoid_stairs, prefer_elevators FROM users WHERE email = ?',
                [email],
                (err, row) => {
                    if (err) reject(err);
                    if (!row) {
                        resolve(null);
                        return;
                    }
                    resolve({
                        id: row.id,
                        username: row.username,
                        email: row.email,
                        preferences: row.difficulty ? {
                            difficulty: row.difficulty as UserPreferences['difficulty'],
                            age: row.age || 30,
                            avoidStairs: Boolean(row.avoid_stairs),
                            preferElevators: Boolean(row.prefer_elevators)
                        } : undefined
                    });
                }
            );
        });
    }

    static async findUserById(id: number): Promise<User | null> {
        return new Promise((resolve, reject) => {
            db.get<DBUser>(
                'SELECT id, username, email, difficulty, age, avoid_stairs, prefer_elevators FROM users WHERE id = ?',
                [id],
                (err, row) => {
                    if (err) reject(err);
                    if (!row) {
                        resolve(null);
                        return;
                    }
                    resolve({
                        id: row.id,
                        username: row.username,
                        email: row.email,
                        preferences: row.difficulty ? {
                            difficulty: row.difficulty as UserPreferences['difficulty'],
                            age: row.age || 30,
                            avoidStairs: Boolean(row.avoid_stairs),
                            preferElevators: Boolean(row.prefer_elevators)
                        } : undefined
                    });
                }
            );
        });
    }

    static async saveUserPreferences(userId: number, preferences: UserPreferences): Promise<boolean> {
        return new Promise((resolve, reject) => {
            db.run(
                `UPDATE users 
                SET difficulty = ?, age = ?, avoid_stairs = ?, prefer_elevators = ?
                WHERE id = ?`,
                [
                    preferences.difficulty,
                    preferences.age,
                    preferences.avoidStairs ? 1 : 0,
                    preferences.preferElevators ? 1 : 0,
                    userId
                ],
                (err) => {
                    if (err) reject(err);
                    resolve(true);
                }
            );
        });
    }

    static async signup(username: string, email: string, password: string): Promise<AuthResponse> {
        try {
            // Check if user already exists
            const existingUser = await this.findUserByEmail(email);
            if (existingUser) {
                return { success: false, error: 'Email already registered' };
            }

            // Hash password
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(password, salt);

            // Insert new user
            return new Promise((resolve, reject) => {
                db.run(
                    'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
                    [username, email, passwordHash],
                    function(err) {
                        if (err) {
                            if (err.message.includes('UNIQUE constraint failed: users.username')) {
                                resolve({ success: false, error: 'Username already taken' });
                            } else {
                                reject(err);
                            }
                        } else {
                            resolve({
                                success: true,
                                user: {
                                    id: this.lastID,
                                    username,
                                    email
                                }
                            });
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Server error' };
        }
    }

    static async login(email: string, password: string): Promise<AuthResponse> {
        try {
            return new Promise((resolve, reject) => {
                db.get<DBUser>(
                    'SELECT * FROM users WHERE email = ?',
                    [email],
                    async (err, user) => {
                        if (err) {
                            reject(err);
                            return;
                        }

                        if (!user) {
                            resolve({ success: false, error: 'Invalid credentials' });
                            return;
                        }

                        const isMatch = await bcrypt.compare(password, user.password_hash);
                        if (!isMatch) {
                            resolve({ success: false, error: 'Invalid credentials' });
                            return;
                        }

                        const userWithPrefs = await this.findUserById(user.id);
                        resolve({
                            success: true,
                            user: userWithPrefs || undefined
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Server error' };
        }
    }

    static async initializeDatabase(): Promise<void> {
        return new Promise((resolve, reject) => {
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    difficulty TEXT,
                    age INTEGER,
                    avoid_stairs INTEGER DEFAULT 0,
                    prefer_elevators INTEGER DEFAULT 0
                )
            `, (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    static async verifyPassword(userId: number, password: string): Promise<boolean> {
        return new Promise((resolve, reject) => {
            db.get<DBUser>(
                'SELECT password_hash FROM users WHERE id = ?',
                [userId],
                async (err, user) => {
                    if (err) reject(err);
                    if (!user) {
                        resolve(false);
                        return;
                    }
                    const isMatch = await bcrypt.compare(password, user.password_hash);
                    resolve(isMatch);
                }
            );
        });
    }

    static async updateProfile(userId: number, profileUpdates: { username?: string; email?: string; newPassword?: string }): Promise<boolean> {
        try {
            const updates: string[] = [];
            const values: any[] = [];

            if (profileUpdates.username) {
                updates.push('username = ?');
                values.push(profileUpdates.username);
            }

            if (profileUpdates.email) {
                updates.push('email = ?');
                values.push(profileUpdates.email);
            }

            if (profileUpdates.newPassword) {
                const salt = await bcrypt.genSalt(10);
                const passwordHash = await bcrypt.hash(profileUpdates.newPassword, salt);
                updates.push('password_hash = ?');
                values.push(passwordHash);
            }

            if (updates.length === 0) return true;

            values.push(userId);

            return new Promise((resolve, reject) => {
                db.run(
                    `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
                    values,
                    function(err) {
                        if (err) {
                            if (err.message.includes('UNIQUE constraint failed')) {
                                resolve(false);
                            } else {
                                reject(err);
                            }
                        } else {
                            resolve(true);
                        }
                    }
                );
            });
        } catch (error) {
            console.error('Update profile error:', error);
            return false;
        }
    }
} 