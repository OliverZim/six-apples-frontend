import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { AuthService, UserPreferences } from './services/auth';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
    origin: [
        'http://localhost:3000',
        'https://sister-carb-capability-ie.trycloudflare.com',
        'https://carries-sick-seas-oklahoma.trycloudflare.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Content-Length', 'X-Requested-With']
}));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Type definition for session
declare module 'express-session' {
    interface SessionData {
        userId?: number;
    }
}

// Handle preflight requests
app.options('*', cors());

// Routes
app.post('/api/auth/signup', async (req, res) => {
    const { username, email, password } = req.body;
    
    if (!username || !email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        const result = await AuthService.signup(username, email, password);
        if (result.success && result.user) {
            req.session.userId = result.user.id;
            return res.json(result);
        } else {
            return res.status(400).json(result);
        }
    } catch (error) {
        console.error('Signup error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    try {
        const result = await AuthService.login(email, password);
        if (result.success && result.user) {
            req.session.userId = result.user.id;
            return res.json(result);
        } else {
            return res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/auth/preferences', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const preferences: UserPreferences = req.body;
    
    try {
        const success = await AuthService.saveUserPreferences(req.session.userId, preferences);
        if (success) {
            return res.json({ success: true });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to save preferences' });
        }
    } catch (error) {
        console.error('Save preferences error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.error('Logout error:', err);
            return res.status(500).json({ success: false, error: 'Error logging out' });
        } else {
            return res.json({ success: true });
        }
    });
});

app.get('/api/auth/me', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    try {
        const user = await AuthService.findUserById(req.session.userId);
        if (user) {
            return res.json({ success: true, user });
        } else {
            return res.status(404).json({ success: false, error: 'User not found' });
        }
    } catch (error) {
        console.error('Get current user error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

app.post('/api/auth/profile', async (req, res) => {
    if (!req.session.userId) {
        return res.status(401).json({ success: false, error: 'Not authenticated' });
    }

    const { username, email, currentPassword, newPassword } = req.body;
    
    try {
        const user = await AuthService.findUserById(req.session.userId);
        if (!user) {
            return res.status(404).json({ success: false, error: 'User not found' });
        }

        // If trying to change password, verify current password
        if (newPassword) {
            const isValid = await AuthService.verifyPassword(req.session.userId, currentPassword);
            if (!isValid) {
                return res.status(400).json({ success: false, error: 'Current password is incorrect' });
            }
        }

        const success = await AuthService.updateProfile(req.session.userId, {
            username,
            email,
            newPassword
        });

        if (success) {
            const updatedUser = await AuthService.findUserById(req.session.userId);
            return res.json({ success: true, user: updatedUser });
        } else {
            return res.status(500).json({ success: false, error: 'Failed to update profile' });
        }
    } catch (error) {
        console.error('Update profile error:', error);
        return res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 