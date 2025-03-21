import { useState } from 'react'
import styles from './Profile.module.css'
import { tr } from '@/translation/Translation'
import compassLogo from './compass-logo.png'

interface ProfileState {
    isLoggedIn: boolean
    username?: string
    email?: string
}

interface ProfileProps {
    isOpen: boolean
    onClose: () => void
}

export default function Profile({ isOpen, onClose }: ProfileProps) {
    const [profileState] = useState<ProfileState>({
        isLoggedIn: true,
        username: 'Richard Bonello',
        email: 'bonellorichie@gmail.com'
    })

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

                <div className={styles.userInfo}>
                    <div className={styles.avatar}>
                        {profileState.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.userDetails}>
                        <h2>{profileState.username}</h2>
                        <p>{profileState.email}</p>
                        <button className={styles.manageButton}>
                            {tr('Manage your Account')}
                        </button>
                    </div>
                </div>

                <div className={styles.menuItems}>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>🕶️</span>
                        {tr('Turn on Incognito mode')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>👤</span>
                        {tr('Your profile')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>📊</span>
                        {tr('Your timeline')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>📍</span>
                        {tr('Location sharing')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>💾</span>
                        {tr('Offline maps')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>🔒</span>
                        {tr('Your data in Maps')}
                    </button>
                    <button className={styles.menuItem}>
                        <span className={styles.icon}>⚙️</span>
                        {tr('Settings')}
                    </button>

                    <div className={styles.divider} />

                    <button className={styles.menuItem}>
                        {tr('Add a missing place')}
                    </button>
                    <button className={styles.menuItem}>
                        {tr('Add your business')}
                    </button>
                    <button className={styles.menuItem}>
                        {tr('Help and feedback')}
                    </button>

                    <div className={styles.footer}>
                        <a href="#">{tr('Privacy Policy')}</a>
                        <span className={styles.dot}>•</span>
                        <a href="#">{tr('Terms of Service')}</a>
                    </div>
                </div>
            </div>
        </div>
    )
} 