import React, { useState } from 'react';
import styles from './SignupWizard.module.css';

interface SignupWizardProps {
    onComplete: (data: WizardData) => void;
    onClose: () => void;
}

export interface WizardData {
    difficulty: 'normal' | 'prosthesis' | 'wheelchair' | 'severely_disabled';
    preferences: {
        maxSlope: number;
        avoidStairs: boolean;
        preferElevators: boolean;
    };
}

const SignupWizard: React.FC<SignupWizardProps> = ({ onComplete, onClose }) => {
    const [currentStep, setCurrentStep] = useState(1);
    const [wizardData, setWizardData] = useState<WizardData>({
        difficulty: 'normal',
        preferences: {
            maxSlope: 5,
            avoidStairs: false,
            preferElevators: false,
        },
    });

    const handleDifficultySelect = (difficulty: WizardData['difficulty']) => {
        setWizardData(prev => ({
            ...prev,
            difficulty,
        }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep(prev => prev + 1);
        } else {
            onComplete(wizardData);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div className={styles.step}>
                        <h2>Select Your Difficulty Level</h2>
                        <div className={styles.options}>
                            <button
                                className={`${styles.option} ${wizardData.difficulty === 'normal' ? styles.selected : ''}`}
                                onClick={() => handleDifficultySelect('normal')}
                            >
                                Normal
                            </button>
                            <button
                                className={`${styles.option} ${wizardData.difficulty === 'prosthesis' ? styles.selected : ''}`}
                                onClick={() => handleDifficultySelect('prosthesis')}
                            >
                                Prosthesis
                            </button>
                            <button
                                className={`${styles.option} ${wizardData.difficulty === 'wheelchair' ? styles.selected : ''}`}
                                onClick={() => handleDifficultySelect('wheelchair')}
                            >
                                Wheelchair
                            </button>
                            <button
                                className={`${styles.option} ${wizardData.difficulty === 'severely_disabled' ? styles.selected : ''}`}
                                onClick={() => handleDifficultySelect('severely_disabled')}
                            >
                                Severely Disabled
                            </button>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className={styles.step}>
                        <h2>Set Your Preferences</h2>
                        <div className={styles.preferences}>
                            <div className={styles.preferenceItem}>
                                <label>Maximum Slope (%)</label>
                                <input
                                    type="range"
                                    min="0"
                                    max="15"
                                    value={wizardData.preferences.maxSlope}
                                    onChange={(e) => setWizardData(prev => ({
                                        ...prev,
                                        preferences: {
                                            ...prev.preferences,
                                            maxSlope: Number(e.target.value),
                                        },
                                    }))}
                                />
                                <span>{wizardData.preferences.maxSlope}%</span>
                            </div>
                            <div className={styles.preferenceItem}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={wizardData.preferences.avoidStairs}
                                        onChange={(e) => setWizardData(prev => ({
                                            ...prev,
                                            preferences: {
                                                ...prev.preferences,
                                                avoidStairs: e.target.checked,
                                            },
                                        }))}
                                    />
                                    Avoid Stairs
                                </label>
                            </div>
                            <div className={styles.preferenceItem}>
                                <label>
                                    <input
                                        type="checkbox"
                                        checked={wizardData.preferences.preferElevators}
                                        onChange={(e) => setWizardData(prev => ({
                                            ...prev,
                                            preferences: {
                                                ...prev.preferences,
                                                preferElevators: e.target.checked,
                                            },
                                        }))}
                                    />
                                    Prefer Elevators
                                </label>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className={styles.step}>
                        <h2>Review Your Settings</h2>
                        <div className={styles.review}>
                            <p><strong>Difficulty Level:</strong> {wizardData.difficulty}</p>
                            <p><strong>Maximum Slope:</strong> {wizardData.preferences.maxSlope}%</p>
                            <p><strong>Avoid Stairs:</strong> {wizardData.preferences.avoidStairs ? 'Yes' : 'No'}</p>
                            <p><strong>Prefer Elevators:</strong> {wizardData.preferences.preferElevators ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className={styles.wizard}>
            <div className={styles.header}>
                <h1>Welcome to Six Apples</h1>
                <button className={styles.closeButton} onClick={onClose}>×</button>
            </div>
            <div className={styles.progress}>
                <div className={styles.progressBar} style={{ width: `${(currentStep / 3) * 100}%` }} />
            </div>
            {renderStep()}
            <div className={styles.actions}>
                {currentStep > 1 && (
                    <button className={styles.backButton} onClick={handleBack}>
                        Back
                    </button>
                )}
                <button className={styles.nextButton} onClick={handleNext}>
                    {currentStep === 3 ? 'Complete' : 'Next'}
                </button>
            </div>
        </div>
    );
};

export default SignupWizard; 