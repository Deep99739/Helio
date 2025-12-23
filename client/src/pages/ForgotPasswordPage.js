import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './Auth.css';

const ForgotPasswordPage = () => {
    // Steps: 1 = Email, 2 = OTP + New Password
    const [step, setStep] = useState(1);

    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const { sendOtp, resetPassword } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    // Step 1: Send OTP
    const handleSendOtp = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await sendOtp(email);
            toast.success(`Reset code sent to ${email}`);
            setStep(2);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    // Step 2: Reset Password
    const handleReset = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            return toast.error("Passwords do not match");
        }

        setLoading(true);
        try {
            await resetPassword(email, otp, newPassword);
            toast.success('Password Reset Successfully!');
            navigate('/login');
        } catch (err) {
            toast.error(err.response?.data?.message || 'Reset failed. Check OTP.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-left">
                <div className="auth-brand-content">
                    <span className="auth-logo">Helix</span>
                    <h1 className="auth-headline">
                        Recover <br />
                        <span>Access</span>
                    </h1>
                    <p className="auth-subhead">
                        Don't worry, it happens to the best of us.
                    </p>
                </div>
            </div>

            <div className="auth-right">
                <div className="auth-card">
                    <div className="auth-header">
                        <h2 className="auth-title">Reset Password</h2>
                        <p className="auth-subtitle">
                            {step === 1 && "Enter email to receive code."}
                            {step === 2 && "Secure your account with a new password."}
                        </p>
                    </div>

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
                                {loading ? 'Sending Code...' : 'Send Reset Code'}
                            </button>
                        </form>
                    )}

                    {step === 2 && (
                        <form onSubmit={handleReset}>
                            <div className="auth-form-group">
                                <label className="auth-label">Verification Code (OTP)</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type="text"
                                        className="auth-input"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        required
                                        placeholder="123456"
                                        style={{ letterSpacing: '5px', textAlign: 'center' }}
                                    />
                                </div>
                            </div>

                            <div className="auth-form-group">
                                <label className="auth-label">New Password</label>
                                <div className="auth-input-wrapper">
                                    <input
                                        type="password"
                                        className="auth-input"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>

                            <div className="auth-form-group">
                                <label className="auth-label">Confirm New Password</label>
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
                                {loading ? 'Resetting...' : 'Set New Password'}
                            </button>
                        </form>
                    )}

                    <p style={{ marginTop: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                        Remembered it? <Link to="/login" className="auth-link">Login</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
