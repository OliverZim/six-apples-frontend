import { WizardData } from '@/components/SignupWizard/SignupWizard';

interface UserPreferencesState {
    preferences: WizardData | null;
    isWizardCompleted: boolean;
}

class UserPreferencesStore {
    private state: UserPreferencesState = {
        preferences: null,
        isWizardCompleted: false,
    };

    private listeners: ((state: UserPreferencesState) => void)[] = [];

    getState(): UserPreferencesState {
        return this.state;
    }

    setPreferences(preferences: WizardData) {
        this.state = {
            ...this.state,
            preferences,
            isWizardCompleted: true,
        };
        this.notifyListeners();
    }

    resetPreferences() {
        this.state = {
            preferences: null,
            isWizardCompleted: false,
        };
        this.notifyListeners();
    }

    register(listener: (state: UserPreferencesState) => void) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notifyListeners() {
        this.listeners.forEach(listener => listener(this.state));
    }
}

export const userPreferencesStore = new UserPreferencesStore(); 