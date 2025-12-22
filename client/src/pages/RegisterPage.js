import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

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

    return (
        <div className="auth-container">
            {/* LEFT SPLIT: VISUAL */}
            <div className="auth-left">
                <div className="auth-brand-content">
                    <span className="auth-logo">Helix</span>
                    <h1 className="auth-headline">
                        Join the <br />
                        <span>Future of Development</span>
                    </h1>
                    <p className="auth-subhead">
                        Create an account to start coding securely with your team in real-time.
                    </p>
                </div>
            </div>

            {/* RIGHT SPLIT: FORM */}
            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Create Account</h2>
                        <p className="auth-subtitle">Sign up to get started.</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        <div className="auth-form-group">
                            <label className="auth-label">Username</label>
                            <div className="auth-input-wrapper">
                                <input
                                    type="text"
                                    className="auth-input"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    placeholder="JohnDoe"
                                />
                            </div>
                        </div>

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
                            <label className="auth-label">Password</label>
                            <div className="auth-input-wrapper">
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
                            Create Account
                        </button>
                    </form>

                    <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
