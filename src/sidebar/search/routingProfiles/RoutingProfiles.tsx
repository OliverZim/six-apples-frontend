import React, { useEffect, useState } from 'react'
import styles from './RoutingProfiles.module.css'
import Dispatcher from '@/stores/Dispatcher'
import { SetVehicleProfile } from '@/actions/Actions'
import { RoutingProfile } from '@/api/graphhopper'
import PlainButton from '@/PlainButton'
import Chevron from './chevron.svg'
import { tr } from '@/translation/Translation'
import { icons } from '@/sidebar/search/routingProfiles/profileIcons'
import Profile from '@/map/Profile'

export default function ({
    routingProfiles,
    selectedProfile,
    showCustomModelBox,
    toggleCustomModelBox,
    customModelBoxEnabled,
}: {
    routingProfiles: RoutingProfile[]
    selectedProfile: RoutingProfile
    showCustomModelBox: boolean
    toggleCustomModelBox: () => void
    customModelBoxEnabled: boolean
}) {
    const [profileScroll, setProfileScroll] = useState(0)
    const [profileWidth, setProfileWidth] = useState(0)
    const [showProfile, setShowProfile] = useState(false)

    function handleResize() {
        const profilesCarouselItems = document.getElementById('profiles_carousel_items')
        if (!profilesCarouselItems) return
        if (profilesCarouselItems.scrollWidth > profilesCarouselItems.clientWidth) {
            for (const chevron of document.getElementsByClassName(styles.chevron)) {
                chevron.classList.add(styles.enabled)
            }
            profilesCarouselItems.classList.remove(styles.profiles_center)
        } else {
            for (const chevron of document.getElementsByClassName(styles.chevron)) {
                chevron.classList.remove(styles.enabled)
            }
            profilesCarouselItems.classList.add(styles.profiles_center)
        }
        setProfileWidth(profilesCarouselItems.scrollWidth - profilesCarouselItems.clientWidth)
    }

    useEffect(() => {
        handleResize()
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [routingProfiles])

    function move(forward: boolean = true) {
        const profilesCarouselItems = document.getElementById('profiles_carousel_items')
        if (!profilesCarouselItems) return

        const scrollAmount = profilesCarouselItems.clientWidth * (forward ? 1 : -1)
        const limit = forward ? profileWidth - profileScroll : -profileScroll
        const scrollValue = forward ? Math.min(scrollAmount, limit) : Math.max(scrollAmount, limit)

        profilesCarouselItems.scrollBy({
            left: scrollValue,
            behavior: 'smooth',
        })
    }

    function onScroll() {
        const profilesCarouselItems = document.getElementById('profiles_carousel_items')
        if (!profilesCarouselItems) return
        setProfileScroll(profilesCarouselItems.scrollLeft)
    }

    let customProfiles: Record<string, Array<string>> = {}
    routingProfiles.forEach(p => {
        const key = (Object.keys(icons).find(k => p.name.startsWith(k + '_')) || '') + '_'
        if (!icons[p.name]) customProfiles[key] = [...(customProfiles[key] || []), p.name]
    })

    return (
        <div className={styles.profilesParent}>
            <div className={styles.buttonContainer}>
                <PlainButton
                    title={tr('profile')}
                    className={styles.profileButton}
                    onClick={() => setShowProfile(true)}
                >
                    <div className={styles.avatar}>R</div>
                </PlainButton>
            </div>
            <Profile isOpen={showProfile} onClose={() => setShowProfile(false)} />
            <div className={styles.carousel}>
                <PlainButton
                    className={styles.chevron}
                    title={tr('back')}
                    onClick={() => move(false)}
                    disabled={profileScroll <= 0}
                >
                    <Chevron />
                </PlainButton>
                <ul className={styles.profiles} id="profiles_carousel_items" onScroll={onScroll}>
                    {routingProfiles.map(profile => {
                        const className =
                            profile.name === selectedProfile.name
                                ? styles.selectedProfile + ' ' + styles.profileBtn
                                : styles.profileBtn
                        return (
                            <li key={profile.name}>
                                <PlainButton
                                    title={tr(profile.name)}
                                    onClick={() => Dispatcher.dispatch(new SetVehicleProfile(profile))}
                                    className={className}
                                >
                                    {getIcon(profile.name, customProfiles)}
                                </PlainButton>
                            </li>
                        )
                    })}
                </ul>
                <PlainButton
                    className={styles.chevron + ' ' + styles.flip}
                    title={tr('next')}
                    onClick={() => move()}
                    disabled={profileScroll >= profileWidth}
                >
                    <Chevron />
                </PlainButton>
            </div>
        </div>
    )
}

function getIcon(profileName: string, customProfiles: Record<string, Array<string>>) {
    let icon = icons[profileName]
    if (icon) return React.createElement(icon)

    for (const [key, value] of Object.entries(customProfiles)) {
        const index = value.findIndex(p => p == profileName) + 1
        if (index >= 1) {
            let icon = icons[key.slice(0, -1)]
            if (!icon) icon = icons.question_mark
            return key === '_' ? <NumberIcon number={index} /> : <IconWithBatchNumber baseIcon={icon} number={index} />
        }
    }

    return React.createElement(icons.question_mark)
}

function IconWithBatchNumber({ baseIcon, number }: { baseIcon: any; number: number }) {
    return (
        <div className={styles.iconContainer}>
            {React.createElement(baseIcon)}
            <div className={styles.batchNumber}>
                <NumberIcon number={number} />
            </div>
        </div>
    )
}

function NumberIcon({ number }: { number: number }) {
    return <span>{number}</span>
}
