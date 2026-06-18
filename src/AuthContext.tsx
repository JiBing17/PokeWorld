import React, { createContext, useContext, useState } from 'react';
import type { AuthContextValue, AuthProviderProps } from './types';

// Creates a shared authentication context for the app
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: AuthProviderProps) {
    // Checks localStorage for an existing token so login state persists after refresh
    const [isAuthenticated, setIsAuthenticated] = useState(
        !!localStorage.getItem('token')
    );

    return (
        // Makes authentication state available to all child components
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    );
}

// Custom hook used by components to access authentication state
export function useAuth(): AuthContextValue {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
