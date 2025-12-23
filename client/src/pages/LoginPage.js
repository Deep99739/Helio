import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const result = await login(email.trim(), password);
            if (result.success) {
                toast.success('Logged in successfully!');
                navigate('/dashboard');
            } else {
                toast.error(result.error);
            }
        } catch (err) {
            console.error(err);
            toast.error('An unexpected error occurred');
        }
    };

    return (
        <div className="auth-container">
            {/* LEFT SPLIT: VISUAL */}
            <div className="auth-left">
                <div className="auth-brand-content">
                    <span className="auth-logo">Helix</span>
                    <h1 className="auth-headline">
                        Innovation <br />
                        <span>Happens Together</span>
                    </h1>
                    <p className="auth-subhead">
                        Experience the next generation of real-time collaboration.
                        Zero latency. Infinite possibilities.
                    </p>
                </div>
            </div>

            {/* RIGHT SPLIT: FORM */}
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Welcome Back</h2>
                        <p className="auth-subtitle">Enter your credentials to access your workspace.</p>
                    </div>

                    {/* SOCIAL LOGIN */}
                    <div style={{ marginBottom: '20px' }}>
                        <a
                            href={`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000'}/api/auth/google`}
                            className="auth-btn"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px',
                                background: '#fff',
                                color: '#333',
                                textDecoration: 'none'
                            }}
                        >
                            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" style={{ width: '20px', height: '20px' }} />
                            Sign in with Google
                        </a>
                        <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                            <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>OR</span>
                            <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                        </div>
                    </div>

                    <form onSubmit={handleLogin}>
                        <div className="auth-form-group">
                            <label className="auth-label">Email Address</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type="email"
                                    className="auth-input"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="name@example.com"
                                />
                            </div>
                        </div>

                        <div className="auth-form-group">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <label className="auth-label" style={{ marginBottom: 0 }}>Password</label>
                                <Link to="/forgot-password" style={{ color: 'var(--accent-blue)', fontSize: '0.8rem', textDecoration: 'none' }}>
                                    Forgot Password?
                                </Link>
                            </div>
                            <div className="auth-input-wrapper" style={{ marginTop: '0.5rem' }}>
                                <input
                                    type="password"
                                    className="auth-input"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button type="submit" className="auth-btn">
                            Sign In
                        </button>
                    </form>

                    <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Don't have an account? <Link to="/register" className="auth-link">Register</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
