import React from 'react';

const Input = ({ label, error, ...props }) => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
            {label && (
                <label style={{
                    color: 'var(--text-secondary)',
                    fontSize: '0.9rem',
                    fontWeight: '500'
                }}>
                    {label}
                </label>
            )}
            <input
                style={{
                    background: 'rgba(13, 17, 23, 0.6)',
                    border: error ? '1px solid var(--accent-red)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)',
                    padding: '12px 16px',
                    color: 'var(--text-primary)',
                    fontSize: '1rem',
                    fontFamily: 'var(--font-ui)',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    width: '100%'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent-blue)'}
                onBlur={(e) => e.target.style.borderColor = error ? 'var(--accent-red)' : 'var(--border-subtle)'}
                {...props}
            />
            {error && (
                <span style={{ color: 'var(--accent-red)', fontSize: '0.8rem' }}>
                    {error}
                </span>
            )}
        </div>
    );
};

export default Input;
