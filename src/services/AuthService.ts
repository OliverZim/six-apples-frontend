interface User {
    id: number;
    username: string;
    email: string;
}

interface AuthResponse {
    success: boolean;
    user?: User;
    error?: string;
}

export class AuthService {
    private static API_URL = 'http://localhost:3001/api/auth';

    static async login(email: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ email, password }),
            });
            return await response.json();
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    static async signup(username: string, email: string, password: string): Promise<AuthResponse> {
        try {
            const response = await fetch(`${this.API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({ username, email, password }),
            });
            return await response.json();
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: 'Network error' };
        }
    }

    static async logout(): Promise<void> {
        try {
            await fetch(`${this.API_URL}/logout`, {
                method: 'POST',
                credentials: 'include',
            });
        } catch (error) {
            console.error('Logout error:', error);
        }
    }

    static async getCurrentUser(): Promise<User | null> {
        try {
            const response = await fetch(`${this.API_URL}/me`, {
                credentials: 'include',
            });
            if (!response.ok) return null;
            const data = await response.json();
            return data.success ? data.user : null;
        } catch (error) {
            console.error('Get current user error:', error);
            return null;
        }
    }
} 