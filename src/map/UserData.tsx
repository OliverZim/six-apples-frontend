import { useState, useEffect } from 'react'
import styles from './UserData.module.css'
import { tr } from '@/translation/Translation'
import { AuthService } from '@/services/AuthService'
import { UserPreferences } from '@/server/src/services/auth'

interface UserDataProps {
    onClose: () => void
}

interface UserDataFormData {
    preferences: UserPreferences
}

const defaultPreferences: UserPreferences = {
    difficulty: 'no impairment',
    age: 30,
    avoidStairs: false,
    preferElevators: false
}

export default function UserData({ onClose }: UserDataProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [formData, setFormData] = useState<UserDataFormData>({
        preferences: defaultPreferences
    })

    useEffect(() => {
        const loadUserData = async () => {
            const user = await AuthService.getCurrentUser()
            if (user?.preferences) {
                setFormData({
                    preferences: user.preferences
                })
            }
        }
        loadUserData()
    }, [])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target
        setFormData(prev => ({
            ...prev,
            preferences: {
                ...prev.preferences,
                [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
            }
        }))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        try {
            const success = await AuthService.savePreferences(formData.preferences)
            if (success) {
                setSuccess('Preferences updated successfully')
            } else {
                setError('Failed to update preferences')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{tr('Your Data')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.section}>
                        <h3>{tr('Accessibility Preferences')}</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="difficulty">{tr('Mobility Level')}</label>
                            <select
                                id="difficulty"
                                name="difficulty"
                                value={formData.preferences.difficulty}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="no impairment">{tr('No Impairment')}</option>
                                <option value="crutches/walking stick">{tr('Crutches/Walking Stick')}</option>
                                <option value="prosthesis">{tr('Prosthesis')}</option>
                                <option value="wheelchair">{tr('Wheelchair')}</option>
                            </select>
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="age">{tr('Age')}</label>
                            <input
                                type="range"
                                id="age"
                                name="age"
                                min="0"
                                max="100"
                                value={formData.preferences.age}
                                onChange={handleInputChange}
                                required
                            />
                            <span className={styles.rangeValue}>{formData.preferences.age}</span>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h3>{tr('Route Preferences')}</h3>
                        <div className={styles.checkboxGroup}>
                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="avoidStairs"
                                    checked={formData.preferences.avoidStairs}
                                    onChange={handleInputChange}
                                />
                                {tr('Avoid Stairs')}
                            </label>

                            <label className={styles.checkboxLabel}>
                                <input
                                    type="checkbox"
                                    name="preferElevators"
                                    checked={formData.preferences.preferElevators}
                                    onChange={handleInputChange}
                                />
                                {tr('Prefer Elevators')}
                            </label>
                        </div>
                    </div>

                    <div className={styles.actions}>
                        <button type="button" className={styles.cancelButton} onClick={onClose}>
                            {tr('Cancel')}
                        </button>
                        <button type="submit" className={styles.saveButton}>
                            {tr('Save Changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
} 