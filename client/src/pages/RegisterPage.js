import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const RegisterPage = () => {
    // Steps: 1 = Email, 2 = OTP, 3 = Details
    const [step, setStep] = useState(1);

    // Form State
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { register, sendOtp, verifyOtp } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendOtp(email);
            toast.success(`Verification code sent to ${email}`);
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await verifyOtp(email, otp);
            toast.success('Email Verified!');
            setStep(3);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Invalid Code');
        } finally {
            setLoading(false);
        }
    };

    // Step 3: Final Register
    const handleRegister = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setLoading(true);
        try {
            await register(username, email, password);
            toast.success('Account created successfully!');
            navigate('/dashboard'); // Auto-login handles redirect usually, but good to be explicit
        } catch (err) {
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
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
                        <p className="auth-subtitle">
                            {step === 1 && "Enter your email to get started."}
                            {step === 2 && "We sent a code to your email."}
                            {step === 3 && "Secure your account."}
                        </p>
                    </div>

                    {/* SOCIAL SIGNUP (Only on Step 1) */}
                    {step === 1 && (
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
                                Sign up with Google
                            </a>
                            <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0', color: 'var(--text-secondary)' }}>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                                <span style={{ padding: '0 10px', fontSize: '0.9rem' }}>OR</span>
                                <div style={{ flex: 1, height: '1px', background: 'var(--glass-border)' }}></div>
                            </div>
                        </div>
                    )}

                    {/* STEP 1: EMAIL */}
                    {step === 1 && (
                        <form onSubmit={handleSendOtp}>
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
                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Sending Code...' : 'Continue'}
                            </button>
                        </form>
                    )}

                    {/* STEP 2: OTP */}
                    {step === 2 && (
                        <form onSubmit={handleVerifyOtp}>
                            <div className="auth-form-group">
                                <label className="auth-label">Verification Code</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type="text"
                                        className="auth-input"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="123456"
                                        style={{ letterSpacing: '5px', textAlign: 'center', fontSize: '1.2rem' }}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>
                            <button
                                type="button"
                                className="auth-link"
                                onClick={() => setStep(1)}
                                style={{ display: 'block', margin: '20px auto', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Change Email
                            </button>
                        </form>
                    )}

                    {/* STEP 3: DETAILS */}
                    {step === 3 && (
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

                            <div className="auth-form-group">
                                <label className="auth-label">Confirm Password</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type="password"
                                        className="auth-input"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <button type="submit" className="auth-btn" disabled={loading}>
                                {loading ? 'Creating Account...' : 'Complete Registration'}
                            </button>
                        </form>
                    )}

                    <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Already have an account? <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
