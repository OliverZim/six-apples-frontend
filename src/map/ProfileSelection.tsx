import { useState } from 'react'
import styles from './ProfileSelection.module.css'
import { RoutingProfile } from '@/api/graphhopper'
import Dispatcher from '@/stores/Dispatcher'
import { SetVehicleProfile } from '@/actions/Actions'
import { icons } from '@/sidebar/search/routingProfiles/profileIcons'
import { tr } from '@/translation/Translation'

interface ProfileSelectionProps {
    profiles: RoutingProfile[]
    selectedProfile: RoutingProfile
    isOpen: boolean
    onClose: () => void
}

export default function ProfileSelection({ profiles, selectedProfile, isOpen, onClose }: ProfileSelectionProps) {
    if (!isOpen) return null

    let customProfiles: Record<string, Array<string>> = {}
    profiles.forEach(p => {
        const key = (Object.keys(icons).find(k => p.name.startsWith(k + '_')) || '') + '_'
        if (!icons[p.name]) customProfiles[key] = [...(customProfiles[key] || []), p.name]
    })


    // exclude the "negative" profile
    profiles = profiles.filter(p => p.name !== 'negative' && p.name !== 'wheelchair_automatic');
    

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
                        return (
                            <button
                                key={profile.name}
                                className={`${styles.profileButton} ${isSelected ? styles.selected : ''}`}
                                onClick={() => handleProfileSelect(profile)}
                                title={tr(profile.name)}
                            >
                                <Icon />
                                <span>{tr(profile.name)}</span>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
} 