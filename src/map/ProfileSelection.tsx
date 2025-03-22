import { useState, useEffect } from 'react'
import styles from './ProfileSelection.module.css'
import { RoutingProfile } from '@/api/graphhopper'
import Dispatcher from '@/stores/Dispatcher'
import { SetVehicleProfile } from '@/actions/Actions'
import { icons } from '@/sidebar/search/routingProfiles/profileIcons'
import { tr } from '@/translation/Translation'
import { AuthService } from '@/services/AuthService'

interface ProfileSelectionProps {
    profiles: RoutingProfile[]
    selectedProfile: RoutingProfile
    isOpen: boolean
    onClose: () => void
}

// Map user difficulty to routing profiles
const difficultyToProfile: Record<string, string> = {
    'no impairment': 'foot',
    'crutches/walking stick': 'elderly',
    'prosthesis': 'prosthesis',
    'wheelchair': 'wheelchair'
}

export default function ProfileSelection({ profiles, selectedProfile, isOpen, onClose }: ProfileSelectionProps) {
    const [userDifficulty, setUserDifficulty] = useState<string | null>(null)

    useEffect(() => {
        const loadUserPreferences = async () => {
            const user = await AuthService.getCurrentUser()
            if (user?.preferences?.difficulty) {
                setUserDifficulty(user.preferences.difficulty)
            }
        }
        loadUserPreferences()
    }, [])

    if (!isOpen) return null

    let customProfiles: Record<string, Array<string>> = {}
    profiles.forEach(p => {
        const key = (Object.keys(icons).find(k => p.name.startsWith(k + '_')) || '') + '_'
        if (!icons[p.name]) customProfiles[key] = [...(customProfiles[key] || []), p.name]
    })

    // Filter and sort profiles based on user difficulty
    profiles = profiles.filter(p => p.name !== 'negative' && p.name !== 'wheelchair_automatic')
    
    // If user is logged in and has preferences, prioritize their difficulty-matched profile
    if (userDifficulty) {
        const preferredProfile = difficultyToProfile[userDifficulty]
        profiles = profiles.sort((a, b) => {
            if (a.name === preferredProfile) return -1
            if (b.name === preferredProfile) return 1
            return 0
        })
    }

    const handleProfileSelect = (profile: RoutingProfile) => {
        Dispatcher.dispatch(new SetVehicleProfile(profile))
        onClose()
    }

    return (
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
                <h3 className={styles.title}>{tr('select_profile')}</h3>
                <div className={styles.profileGrid}>
                    {profiles.map(profile => {
                        const Icon = icons[profile.name] || icons.question_mark
                        const isSelected = profile.name === selectedProfile.name
                        const isRecommended = userDifficulty && profile.name === difficultyToProfile[userDifficulty]
                        return (
                            <button
                                key={profile.name}
                                className={`${styles.profileButton} ${isSelected ? styles.selected : ''} ${isRecommended ? styles.recommended : ''}`}
                                onClick={() => handleProfileSelect(profile)}
                                title={tr(profile.name)}
                            >
                                <Icon />
                                <span>{tr(profile.name)}</span>
                                {isRecommended && <span className={styles.recommendedBadge}>{tr('recommended')}</span>}
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
} 