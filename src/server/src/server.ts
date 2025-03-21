import express from 'express';
import session from 'express-session';
import cors from 'cors';
import { AuthService } from './services/auth';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(express.json());
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
}));

// Type definition for session
declare module 'express-session' {
    interface SessionData {
        userId?: number;
    }
}

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

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ success: false, error: 'Internal server error' });
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 