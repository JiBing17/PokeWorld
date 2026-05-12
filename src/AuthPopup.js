import React, { useState } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    TextField,
    Typography,
} from '@mui/material';
import { useAuth } from './AuthContext';

function AuthPopup({ onClose, onSuccess }) {
    const { setIsAuthenticated } = useAuth();

    const [isSignup, setIsSignup] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async () => {
        setError('');

        if (!username || !password) {
            setError('Username and password are required.');
            return;
        }

        try {
            if (isSignup) {
                await axios.post('http://localhost:5000/api/users/register', {
                    username,
                    password,
                });
            }

            const response = await axios.post('http://localhost:5000/api/users/login', {
                username,
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
            }}
        >
            <Box
                onClick={(e) => e.stopPropagation()}
                sx={{
                    bgcolor: 'white',
                    p: 3,
                    borderRadius: 2,
                    width: '90%',
                    maxWidth: 360,
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
                    onClick={() => setIsSignup(!isSignup)}
                    sx={{ color: '#C22E28' }}
                >
                    {isSignup
                        ? 'Already have an account? Login'
                        : "Don't have an account? Sign up"}
                </Button>

                <Button fullWidth variant="text" onClick={onClose}>
                    Cancel
                </Button>
            </Box>
        </Box>
    );
}

export default AuthPopup;