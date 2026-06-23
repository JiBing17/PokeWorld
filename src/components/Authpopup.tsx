import React, { useState } from 'react';
import { isAxiosError } from 'axios';
import {
    Box,
    Button,
    Link,
    TextField,
    Typography,
    useMediaQuery,
    useTheme,
} from '@mui/material';
import { useAuth } from '../AuthContext';
import { GoogleLogin, CredentialResponse } from '@react-oauth/google';
import { apiClient } from '../utils/apiClient';
import type { AuthPopupProps } from '../types';

interface AuthResponse {
    token: string;
    username: string;
}

function AuthPopup({ onClose, onSuccess }: AuthPopupProps) {

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { setIsAuthenticated } = useAuth(); // lets this popup update the global login state
    const [isSignup, setIsSignup] = useState(false); // false = login mode, true = signup mode
    const [username, setUsername] = useState(''); // stores the username typed into the form
    const [password, setPassword] = useState(''); // stores the password typed into the form
    const [error, setError] = useState(''); // stores an error message to show in the popup

    // Handles a successful Google login/signup response
    const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    // Clear any previous error message
    setError('');

    // Make sure Google returned a credential token
    if (!credentialResponse.credential) {
        setError('Google credential was not received.');
        return;
    }

    try {
        // Example request body:
        // {
        //   credential: "googleCredentialToken..."
        // }
        //
        // Backend verifies the Google credential and returns app login data
        const response = await apiClient.post<AuthResponse>('/users/google', {
        credential: credentialResponse.credential,
        });

        // Example response.data:
        // {
        //   token: "jwtToken...",
        //   username: "Ash Ketchum"
        // }

        // Save login info so the user stays logged in after refresh
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);

        // Update global auth state
        setIsAuthenticated(true);

        // Run success callback, like refreshing favorites
        if (onSuccess) {
        onSuccess();
        }

        // Close the popup after login succeeds
        onClose();
    } catch (err) {
        // Show backend error if available, otherwise show fallback message
        setError(
            (isAxiosError(err) ? err.response?.data : undefined) || 'Google authentication failed.'
        );
    }
    };

    // Handles normal login or signup form submission
    const handleSubmit = async () => {
    // Clear any previous error message
    setError('');

    // Remove extra spaces around the username
    const cleanedUsername = username.trim();

    // Make sure both fields are filled in
    if (!cleanedUsername || !password) {
        setError('Username and password are required.');
        return;
    }

    try {
        // If the popup is in signup mode, create the account first
        if (isSignup) {
        // Example request body:
        // {
        //   username: "ash",
        //   password: "pikachu123"
        // }
        await apiClient.post('/users/register', {
            username: cleanedUsername,
            password,
        });
        }

        // After signup, or if already in login mode, log the user in
        const response = await apiClient.post<AuthResponse>('/users/login', {
        username: cleanedUsername,
        password,
        });

        // Example response.data:
        // {
        //   token: "jwtToken...",
        //   username: "ash"
        // }

        // Save login info so the user stays logged in after refresh
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('username', response.data.username);

        // Update global auth state
        setIsAuthenticated(true);

        // Run success callback, like refreshing favorites
        if (onSuccess) {
        onSuccess();
        }

        // Close the popup after login/signup succeeds
        onClose();
    } catch (err) {
        // Show backend error if available, otherwise show fallback message
        setError(
            (isAxiosError(err) ? err.response?.data : undefined) || 'Authentication failed.'
        );
    }
    };

    return (
        <Box
            onClick={onClose}
            sx={{
                position: 'fixed',
                inset: 0,
                bgcolor: 'rgba(0,0,0,0.5)',
                zIndex: 2000,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                px: 2,
            }}
        >
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    bgcolor: 'white',
                    p: 3,
                    borderRadius: 2,
                    width: '100%',
                    maxWidth: 360,
                    boxShadow: 6,
                }}
            >
                <Typography variant="h6" sx={{ mb: 2 }}>
                    {isSignup ? 'Create Account' : 'Login'}
                </Typography>

                <TextField
                    fullWidth
                    label="Username"
                    size="small"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    sx={{ mb: 2 }}
                />

                <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    size="small"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={{ mb: 2 }}
                />

                {error && (
                    <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                        {error}
                    </Typography>
                )}

                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleSubmit}
                    sx={{
                        bgcolor: '#C22E28',
                        '&:hover': { bgcolor: '#B22222' },
                        mb: 1,
                    }}
                >
                    {isSignup ? 'Sign Up' : 'Login'}
                </Button>

                <Button
                    fullWidth
                    variant="text"
                    onClick={() => {
                        setIsSignup(!isSignup);
                        setError('');
                    }}
                    sx={{
                        color: '#C22E28',
                        mb: 1,
                    }}
                >
                    {isSignup
                        ? 'Already have an account? Login'
                        : "Don't have an account? Sign up"}
                </Button>

                <Box sx={{ display: 'flex', alignItems: 'center', my: 2 }}>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#ddd' }} />
                    <Typography
                        variant="body2"
                        sx={{
                            mx: 1.5,
                            color: 'text.secondary',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        or
                    </Typography>
                    <Box sx={{ flex: 1, height: '1px', bgcolor: '#ddd' }} />
                </Box>

                <Box
                    sx={{
                        mb: 1.5,
                        display: 'flex',
                        justifyContent: 'center',
                        width: '100%',
                    }}
                >
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Google login failed.')}
                        theme="outline"
                        size="large"
                        shape="rectangular"
                        text={isSignup ? 'signup_with' : 'signin_with'}
                        logo_alignment="left"
                        width={isMobile ? '260' : '312'}
                    />
                </Box>

                <Typography variant="caption" sx={{ display: 'block', mt: 1.5, color: 'text.secondary' }}>
                    By signing in, you agree to our{' '}
                    <Link href="/privacy" underline="hover">
                        Privacy Policy
                    </Link>
                    .
                </Typography>

                <Button
                    fullWidth
                    variant="text"
                    onClick={onClose}
                    sx={{
                        mt: 1,
                        color: 'text.secondary',
                        '&:hover': {
                            bgcolor: 'rgba(0, 0, 0, 0.04)',
                        },
                    }}
                >
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}

export default AuthPopup;
