import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { authAPI } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check for existing session on app load
    useEffect(() => {
        checkAuthSession();
    }, []);

    const checkAuthSession = async () => {
        try {
            const token = await SecureStore.getItemAsync('token');
            const userData = await SecureStore.getItemAsync('user');

            if (token && userData) {
                setUser(JSON.parse(userData));
                setIsLoggedIn(true);
            }
        } catch (error) {
            console.error('Error checking auth session:', error);
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            console.log('Attempting login for:', email);
            const response = await authAPI.login(email, password);
            console.log('Login response:', response.data);

            const { token, user: userData } = response.data;

            await SecureStore.setItemAsync('token', token);
            await SecureStore.setItemAsync('user', JSON.stringify(userData));

            setUser(userData);
            setIsLoggedIn(true);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            console.error('Error response:', error.response?.data);

            // Backend uses 'error' field, not 'message'
            const message = error.response?.data?.error || error.message || 'Login failed';
            return { success: false, error: message };
        }
    };

    const register = async (userData) => {
        try {
            console.log('Attempting registration for:', userData.email);

            // Backend expects fullName, not username
            const registerData = {
                fullName: userData.username || userData.fullName,
                email: userData.email,
                password: userData.password,
            };

            const response = await authAPI.register(registerData);
            console.log('Register response:', response.data);

            return { success: true, message: response.data.message };
        } catch (error) {
            console.error('Register error:', error);
            console.error('Error response:', error.response?.data);

            const message = error.response?.data?.error || error.message || 'Registration failed';
            return { success: false, error: message };
        }
    };

    const logout = async () => {
        try {
            await SecureStore.deleteItemAsync('token');
            await SecureStore.deleteItemAsync('user');
            setUser(null);
            setIsLoggedIn(false);
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const updateUser = async (userData) => {
        try {
            await SecureStore.setItemAsync('user', JSON.stringify(userData));
            setUser(userData);
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            isLoggedIn,
            login,
            register,
            logout,
            updateUser,
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;
