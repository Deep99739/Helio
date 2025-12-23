import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token'));
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    // Configure axios defaults
    axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL ? `${process.env.REACT_APP_BACKEND_URL}/api` : 'http://localhost:5000/api';
    if (token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, [token]);

    // Axios interceptor to handle 401s globally
    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response && error.response.status === 401) {
                    console.log("401 detected, logging out...");
                    logout();
                }
                return Promise.reject(error);
            }
        );

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const login = async (email, password) => {
        try {
            const res = await axios.post('/auth/login', { email, password });
            const { token, user } = res.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            setToken(token);
            setUser(user);

            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
            navigate('/dashboard');
            return { success: true };
        } catch (error) {
            console.error("Login failed", error);
            return { success: false, error: error.response?.data?.message || 'Login failed' };
        }
    };

    const register = async (username, email, password) => {
        try {
            await axios.post('/auth/register', { username, email, password });
            // Auto login after register or redirect to login? 
            // Let's redirect to login for clarity or better yet, auto-login.
            // For now, let's just return success so the page can redirect.
            return { success: true };
        } catch (error) {
            console.error("Registration failed", error);
            return { success: false, error: error.response?.data?.message || 'Registration failed' };
        }
    }

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user'); // Keep this line from original logout
        setToken(null);
        setUser(null);
        delete axios.defaults.headers.common['Authorization']; // Keep this line from original logout
        navigate('/login'); // Keep this line from original logout
        toast.success('Logged out successfully'); // Added from the provided edit
    };

    // Verify OTP
    const verifyOtp = async (email, otp) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/verify-otp`, { email, otp });
            return true;
        } catch (error) {
            throw error;
        }
    };

    // Send OTP
    const sendOtp = async (email) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/send-otp`, { email });
            return true;
        } catch (error) {
            throw error;
        }
    };

    // Reset Password
    const resetPassword = async (email, otp, newPassword) => {
        try {
            await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/auth/reset-password`, { email, otp, newPassword });
            return true;
        } catch (error) {
            throw error;
        }
    };

    const value = {
        user,
        token,
        login,
        register,
        logout,
        loading,
        sendOtp,
        verifyOtp,
        resetPassword
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
