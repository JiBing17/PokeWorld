import React, { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    TextField,
    Typography,
} from '@mui/material';
import { useAuth } from '../AuthContext';
import { GoogleLogin } from '@react-oauth/google';

function AuthPopup({ onClose, onSuccess }) {
    const { setIsAuthenticated } = useAuth();

    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleGoogleSuccess = async (credentialResponse) => {
        setError('');

        if (!credentialResponse.credential) {
            setError('Google credential was not received.');
            return;
        }

        try {
            const response = await axios.post('http://localhost:5000/api/users/google', {
                credential: credentialResponse.credential,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);

            setIsAuthenticated(true);

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            setError(err.response?.data || 'Google authentication failed.');
        }
    };

    const handleSubmit = async () => {
        setError('');

        const cleanedUsername = username.trim();

        if (!cleanedUsername || !password) {
            setError('Username and password are required.');
            return;
        }

        try {
            if (isSignup) {
                await axios.post('http://localhost:5000/api/users/register', {
                    username: cleanedUsername,
                    password,
                });
            }

            const response = await axios.post('http://localhost:5000/api/users/login', {
                username: cleanedUsername,
                password,
            });

            localStorage.setItem('token', response.data.token);
            localStorage.setItem('username', response.data.username);

            setIsAuthenticated(true);

            if (onSuccess) {
                onSuccess();
            }

            onClose();
        } catch (err) {
            setError(err.response?.data || 'Authentication failed.');
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
                        width="312"
                    />
                </Box>

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