import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const RegisterPage = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await register(username, email, password);
            toast.success('Registration successful! Please login.');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.msg || 'Registration failed');
        }
    };

    // --- INLINE STYLES (Matches Login Page) ---
    const pageContainerStyle = {
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px'
    };

    const cardStyle = {
        backgroundColor: '#252526',
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
        backgroundColor: '#3c3c3c',
        border: '1px solid #555',
        borderRadius: '4px',
        color: '#ffffff',
        fontSize: '1rem',
        outline: 'none'
    };

    const buttonStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#007acc',
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

                <h3 style={headerStyle}>Create Account</h3>

                <form onSubmit={handleRegister}>
                    <div style={inputGroupStyle}>
                        <label style={labelStyle}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            style={inputStyle}
                            onFocus={(e) => e.target.style.borderColor = '#007acc'}
                            onBlur={(e) => e.target.style.borderColor = '#555'}
                        />
                    </div>
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
                        Register
                    </button>
                </form>

                <p style={{ marginTop: '20px', color: '#cccccc' }}>
                    Already have an account? <Link to="/login" style={footerLinkStyle}>Login</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
