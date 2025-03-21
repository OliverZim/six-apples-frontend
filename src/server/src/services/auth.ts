import bcrypt from 'bcryptjs';
import db from './database';

export interface User {
    id: number;
    username: string;
    email: string;
}

interface DBUser {
    id: number;
    username: string;
    email: string;
    password_hash: string;
    created_at: string;
}

export interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export class AuthService {
    static async findUserByEmail(email: string): Promise<User | null> {
        return new Promise((resolve, reject) => {
            db.get<DBUser>('SELECT id, username, email FROM users WHERE email = ?', [email], (err, row) => {
                if (err) reject(err);
                if (!row) {
                    resolve(null);
                    return;
                }
                resolve({
                    id: row.id,
                    username: row.username,
                    email: row.email
                });
            });
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

                        resolve({
                            success: true,
                            user: {
                                id: user.id,
                                username: user.username,
                                email: user.email
                            }
                        });
                    }
                );
            });
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Server error' };
        }
    }

    static async findUserById(id: number): Promise<User | null> {
        return new Promise((resolve, reject) => {
            db.get<DBUser>('SELECT id, username, email FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                if (!row) {
                    resolve(null);
                    return;
                }
                resolve({
                    id: row.id,
                    username: row.username,
                    email: row.email
                });
            });
        });
    }
} 