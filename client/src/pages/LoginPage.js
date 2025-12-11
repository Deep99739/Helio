import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            await login(email, password);
            toast.success('Logged in successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Login failed');
        }
    };

    // --- INLINE STYLES ---
    const pageContainerStyle = {
        minHeight: '100vh',
        backgroundColor: '#1e1e1e', // Main dark background
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
    };

    const cardStyle = {
        backgroundColor: '#252526', // Lighter card background
        padding: '40px',
        borderRadius: '8px',
        boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
    };

    const logoStyle = {
        color: '#ffffff',
        fontSize: '2rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        letterSpacing: '1px'
    };

    const headerStyle = {
        color: '#ffffff',
        fontSize: '1.5rem',
        marginBottom: '1.5rem'
    };

    const inputGroupStyle = {
        marginBottom: '15px',
        textAlign: 'left'
    };

    const labelStyle = {
        display: 'block',
        color: '#cccccc',
        marginBottom: '5px',
        fontSize: '0.9rem'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#3c3c3c', // Input background
        border: '1px solid #555',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '1rem',
        outline: 'none'
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007acc', // Accent blue
        color: '#ffffff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '1.1rem',
        fontWeight: 'bold',
        cursor: 'pointer',
        marginTop: '10px',
        transition: 'background-color 0.2s'
    };

    const footerLinkStyle = {
        color: '#007acc',
        textDecoration: 'none',
        fontWeight: 'bold'
    };

    return (
        <div style={pageContainerStyle}>
            <div style={cardStyle}>
                {/* Fixed Logo Text */}
                <h2 style={logoStyle}>Helix</h2>

                <h3 style={headerStyle}>Sign In</h3>

                <form onSubmit={handleLogin}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = '#007acc'}
                            onBlur={(e) => e.target.style.borderColor = '#555'}
                        />
                    </div>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = '#007acc'}
                            onBlur={(e) => e.target.style.borderColor = '#555'}
                        />
                    </div>
                    <button type="submit" style={buttonStyle} onMouseOver={(e) => e.target.style.backgroundColor = '#005fa3'} onMouseOut={(e) => e.target.style.backgroundColor = '#007acc'}>
                        Login
                    </button>
                </form>

                <p style={{ marginTop: '20px', color: '#cccccc' }}>
                    Don't have an account? <Link to="/register" style={footerLinkStyle}>Register</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
