import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const AuthSuccessPage = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setToken, setUser } = useAuth(); // Need to expose setters or reload method

    useEffect(() => {
        const token = searchParams.get('token');
        if (token) {
            localStorage.setItem('token', token);
            // We need to fetch user details or decode token?
            // Ideally backend sends user info too, or we fetch /me
            // For now, let's just reload or let AuthContext pick it up.

            // Force reload to trigger AuthContext useEffect? 
            // Better: update context directly. 
            // But AuthContext loads from localStorage on mount/change?
            // AuthContext listens to 'token' state.

            // Let's do a hard reload to be safe and simple for now, 
            // or navigate to dashboard and let Context fetch profile.

            window.location.href = '/dashboard';
        } else {
            toast.error("Social Login Failed");
            navigate('/login');
        }
    }, [searchParams, navigate]);

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            background: '#1e1e1e',
            color: '#fff'
        }}>
            <h2>Authenticating...</h2>
        </div>
    );
};

export default AuthSuccessPage;
