import { useState } from 'react'
import styles from './Account.module.css'
import Profile from './Profile'
import PlainButton from '@/PlainButton'
import ProfileIcon from './profile.svg'

export default function Account() {
    const [showProfile, setShowProfile] = useState(false)

    return (
        <div className={styles.accountContainer}>
            <PlainButton 
                className={styles.accountButton} 
                onClick={() => setShowProfile(true)}
                title="Your account"
            >
                <ProfileIcon />
                <div className={styles.buttonContent}>
                    Account
                </div>
            </PlainButton>
            <Profile 
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
            />
        </div>
    )
} 