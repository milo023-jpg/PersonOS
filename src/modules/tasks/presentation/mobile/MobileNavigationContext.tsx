import { createContext, useContext, useState, type ReactNode } from 'react';

type ViewType = 'home' | 'list';
type FilterType = 'inbox' | 'today' | 'all' | 'list';

interface MobileNavigationState {
    view: ViewType;
    filter: FilterType;
    listId?: string;
}

interface MobileNavigationContextType extends MobileNavigationState {
    goToHome: () => void;
    goToList: (filter: FilterType, listId?: string) => void;
    goBack: () => void;
}

const MobileNavigationContext = createContext<MobileNavigationContextType | null>(null);

export function MobileNavigationProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<MobileNavigationState>({
        view: 'home',
        filter: 'inbox'
    });

    const goToHome = () => {
        setState({ view: 'home', filter: 'inbox' });
    };

    const goToList = (filter: FilterType, listId?: string) => {
        setState({ view: 'list', filter, listId });
    };

    const goBack = () => {
        setState({ view: 'home', filter: 'inbox' });
    };

    return (
        <MobileNavigationContext.Provider value={{ ...state, goToHome, goToList, goBack }}>
            {children}
        </MobileNavigationContext.Provider>
    );
}

export function useTasksMobileNavigation() {
    const context = useContext(MobileNavigationContext);
    if (!context) {
        throw new Error('useTasksMobileNavigation must be used within MobileNavigationProvider');
    }
    return context;
}