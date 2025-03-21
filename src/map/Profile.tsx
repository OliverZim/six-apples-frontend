import { useState, useEffect } from 'react'
import styles from './Profile.module.css'
import { tr } from '@/translation/Translation'
import compassLogo from './compass-logo.png'
import { AuthService } from '@/services/AuthService'
import SignupWizard, { WizardData } from '@/components/SignupWizard/SignupWizard'
import { userPreferencesStore } from '@/stores/UserPreferencesStore'
import ProfileEdit from './ProfileEdit'
import UserData from './UserData'
import { getQueryStore } from '@/stores/Stores'
import { SetVehicleProfile } from '@/actions/Actions'
import PathAvoidanceEdit from './PathAvoidance'

interface ProfileState {
    isLoggedIn: boolean
    username?: string
    email?: string
}

interface ProfileProps {
    isOpen: boolean
    onClose: () => void
}

interface AuthFormData {
    username: string
    email: string
    password: string
}

export default function Profile({ isOpen, onClose }: ProfileProps) {
    const [isLogin, setIsLogin] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [profileState, setProfileState] = useState<ProfileState>({
        isLoggedIn: false
    })
    const [formData, setFormData] = useState<AuthFormData>({
        username: '',
        email: '',
        password: ''
    })
    const [showWizard, setShowWizard] = useState(false)
    const [showProfileEdit, setShowProfileEdit] = useState(false)
    const [showUserData, setShowUserData] = useState(false)
    const [showPathAvoidanceEdit, setShowPathAvoidanceEdit] = useState(false)
    useEffect(() => {
        const checkAuth = async () => {
            const user = await AuthService.getCurrentUser()
            if (user) {
                setProfileState({
                    isLoggedIn: true,
                    username: user.username,
                    email: user.email
                })
            }
        }
        checkAuth()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)

        try {
            const response = isLogin
                ? await AuthService.login(formData.email, formData.password)
                : await AuthService.signup(formData.username, formData.email, formData.password)

            if (response.success && response.user) {
                setProfileState({
                    isLoggedIn: true,
                    username: response.user.username,
                    email: response.user.email
                })
                
                // Update profile selection after login
                await getQueryStore().handleUserLogin()
                
                // Show wizard only after successful signup
                if (!isLogin) {
                    setShowWizard(true)
                } else {
                    // Force reload after login
                    window.location.reload()
                }
            } else {
                setError(response.error || 'Authentication failed')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        }
    }

    const handleLogout = async () => {
        await AuthService.logout()
        setProfileState({ isLoggedIn: false })
        userPreferencesStore.resetPreferences()
        
        // Clear URL parameters
        const url = new URL(window.location.href)
        url.searchParams.delete('profile')
        window.history.replaceState({}, '', url.toString())
        
        // Reset to default profile
        getQueryStore().reduce(getQueryStore().state, new SetVehicleProfile({ name: 'foot' }))
        
        // Force reload after logout
        window.location.reload()
    }

    const handleWizardComplete = async (data: WizardData) => {
        const success = await AuthService.savePreferences({
            difficulty: data.difficulty,
            age: data.preferences.age,
            avoidStairs: data.preferences.avoidStairs,
            preferElevators: data.preferences.preferElevators
        });
        
        if (success) {
            userPreferencesStore.setPreferences(data);
            setShowWizard(false);
        } else {
            setError('Failed to save preferences. Please try again.');
        }
    }

    const handleWizardClose = () => {
        setShowWizard(false)
    }

    const handleProfileUpdate = (username: string, email: string) => {
        setProfileState(prev => ({
            ...prev,
            username,
            email
        }))
    }

    if (!isOpen) return null

    return (
        <div className={styles.overlay}>
            <div className={styles.profilePanel}>
                <div className={styles.header}>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                    <div className={styles.logoContainer}>
                        <img src={compassLogo}
                             alt="6 Apples a Day" 
                             className={styles.logo}
                        />
                        <h1 className={styles.logoText}>6 Apples a Day</h1>
                    </div>
                </div>

                {profileState.isLoggedIn ? (
                    <>
                        <div className={styles.userInfo}>
                            <div className={styles.avatar}>
                                {profileState.username?.charAt(0).toUpperCase()}
                            </div>
                            <div className={styles.userDetails}>
                                <h2>{profileState.username}</h2>
                                <p>{profileState.email}</p>
                                <button className={styles.manageButton} onClick={handleLogout}>
                                    {tr('Sign Out')}
                                </button>
                            </div>
                        </div>

                        <div className={styles.menuItems}>
                            <button className={styles.menuItem} onClick={() => setShowProfileEdit(true)}>
                                <span className={styles.icon}>👤</span>
                                {tr('Your profile')}
                            </button>
                            <button className={styles.menuItem} onClick={() => setShowPathAvoidanceEdit(true)}>
                                <span className={styles.icon}>📊</span>
                                {tr('Community')}
                            </button>
                            <button className={styles.menuItem}>
                                <span className={styles.icon}>📍</span>
                                {tr('Location sharing')}
                            </button>
                            <button className={styles.menuItem} onClick={() => setShowUserData(true)}>
                                <span className={styles.icon}>🔒</span>
                                {tr('Your data')}
                            </button>
                            <button className={styles.menuItem}>
                                <span className={styles.icon}>⚙️</span>
                                {tr('Settings')}
                            </button>
                        </div>
                    </>
                ) : (
                    <div className={styles.authContainer}>
                        <div className={styles.authToggle}>
                            <button
                                className={`${styles.authToggleButton} ${isLogin ? styles.active : ''}`}
                                onClick={() => setIsLogin(true)}
                            >
                                {tr('Login')}
                            </button>
                            <button
                                className={`${styles.authToggleButton} ${!isLogin ? styles.active : ''}`}
                                onClick={() => setIsLogin(false)}
                            >
                                {tr('Sign Up')}
                            </button>
                        </div>

                        {error && <div className={styles.error}>{error}</div>}

                        <form onSubmit={handleSubmit} className={styles.authForm}>
                            {!isLogin && (
                                <div className={styles.formGroup}>
                                    <label htmlFor="username">{tr('Username')}</label>
                                    <input
                                        type="text"
                                        id="username"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            )}
                            <div className={styles.formGroup}>
                                <label htmlFor="email">{tr('Email')}</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label htmlFor="password">{tr('Password')}</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <button type="submit" className={styles.submitButton}>
                                {isLogin ? tr('Login') : tr('Sign Up')}
                            </button>
                        </form>
                    </div>
                )}

                <div className={styles.footer}>
                    <a href="#">{tr('Privacy Policy')}</a>
                    <span className={styles.dot}>•</span>
                    <a href="#">{tr('Terms of Service')}</a>
                </div>
            </div>

            {showWizard && (
                <SignupWizard
                    onComplete={handleWizardComplete}
                    onClose={handleWizardClose}
                    username={profileState.username || ''}
                />
            )}

            {showProfileEdit && profileState.username && profileState.email && (
                <ProfileEdit
                    username={profileState.username}
                    email={profileState.email}
                    onClose={() => setShowProfileEdit(false)}
                    onUpdate={handleProfileUpdate}
                />
            )}

            {showUserData && (
                <UserData
                    onClose={() => setShowUserData(false)}
                />
            )}

            {showPathAvoidanceEdit && (
                <PathAvoidanceEdit
                    onClose={() => setShowPathAvoidanceEdit(false)}
                />
            )}
        </div>
    )
} 