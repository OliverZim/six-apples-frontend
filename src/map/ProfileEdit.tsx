import { useState } from 'react'
import styles from './ProfileEdit.module.css'
import { tr } from '@/translation/Translation'
import { AuthService } from '@/services/AuthService'

interface ProfileEditProps {
    username: string
    email: string
    onClose: () => void
    onUpdate: (username: string, email: string) => void
}

interface ProfileFormData {
    username: string
    email: string
    currentPassword: string
    newPassword: string
    confirmPassword: string
}

export default function ProfileEdit({ username, email, onClose, onUpdate }: ProfileEditProps) {
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)
    const [formData, setFormData] = useState<ProfileFormData>({
        username,
        email,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        // Validate passwords if trying to change them
        if (formData.newPassword) {
            if (!formData.currentPassword) {
                setError('Current password is required to change password')
                return
            }
            if (formData.newPassword !== formData.confirmPassword) {
                setError('New passwords do not match')
                return
            }
        }

        try {
            const response = await AuthService.updateProfile({
                username: formData.username,
                email: formData.email,
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword
            })

            if (response.success && response.user) {
                setSuccess('Profile updated successfully')
                onUpdate(response.user.username, response.user.email)
                // Clear password fields
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }))
            } else {
                setError(response.error || 'Failed to update profile')
            }
        } catch (err) {
            setError('An unexpected error occurred')
        }
    }

    return (
        <div className={styles.overlay}>
            <div className={styles.modal}>
                <div className={styles.header}>
                    <h2>{tr('Edit Profile')}</h2>
                    <button className={styles.closeButton} onClick={onClose}>
                        ✕
                    </button>
                </div>

                {error && <div className={styles.error}>{error}</div>}
                {success && <div className={styles.success}>{success}</div>}

                <form onSubmit={handleSubmit} className={styles.form}>
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

                    <div className={styles.passwordSection}>
                        <h3>{tr('Change Password')}</h3>
                        <div className={styles.formGroup}>
                            <label htmlFor="currentPassword">{tr('Current Password')}</label>
                            <input
                                type="password"
                                id="currentPassword"
                                name="currentPassword"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="newPassword">{tr('New Password')}</label>
                            <input
                                type="password"
                                id="newPassword"
                                name="newPassword"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="confirmPassword">{tr('Confirm New Password')}</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                            />
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