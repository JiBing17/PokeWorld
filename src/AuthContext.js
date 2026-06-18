import React, { createContext, useContext, useState } from 'react';

// Creates a shared authentication context for the app
const AuthContext = createContext();

export function AuthProvider({ children }) {
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
export function useAuth() {
    return useContext(AuthContext);
}