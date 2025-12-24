import React from 'react';
import Avatar from 'react-avatar';
import { useNavigate } from 'react-router-dom';
import { useAudioLevel } from '../hooks/useAudioLevel';

function Client({ username, isOwner, stream }) {
  const navigate = useNavigate();
  const isGuest = username.toString().startsWith("Guest-");
  const isSpeaking = useAudioLevel(stream);

  // Generate initials (e.g., "Deepak Kumar" -> "DK")
  // Simple fallback to first 2 letters if no space
  const name = username.toString();

  return (
    <div
      className="d-flex align-items-center mb-2"
      onClick={() => {
        if (!isGuest) {
          navigate(`/profile/${username}`);
        }
      }}
      style={{
        padding: '6px 10px',
        borderRadius: '4px',
        cursor: isGuest ? 'default' : 'pointer',
        transition: 'background 0.1s',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        border: '1px solid transparent' // Prevent layout shift on hover if we added border
      }}
      onMouseEnter={(e) => {
        if (!isGuest) e.currentTarget.style.background = 'var(--bg-panel)';
      }}
      onMouseLeave={(e) => {
        if (!isGuest) e.currentTarget.style.background = 'transparent';
      }}
    >
      {/* Avatar Container */}
      <div style={{ position: 'relative' }}>
        <div style={{
          borderRadius: '50%',
          padding: isOwner ? '1px' : '0',
          background: isOwner ? 'linear-gradient(45deg, #FFD700, #FDB931)' : 'transparent',
          boxShadow: isSpeaking ? '0 0 8px #4ade80' : 'none',
          transition: 'box-shadow 0.2s'
        }}>
          <Avatar
            name={name}
            size={28}
            round="50%"
            color="#0066cc" // slightly darker blue
            fgColor="#fff"
            textSizeRatio={2}
            style={{
              border: isSpeaking ? '2px solid #4ade80' : '2px solid var(--bg-dark)',
              display: 'block',
              transition: 'border 0.2s'
            }}
          />
        </div>

        {/* Status Dot */}
        <div style={{
          position: 'absolute',
          bottom: '0px',
          right: '0px',
          width: '8px',
          height: '8px',
          backgroundColor: '#4ade80',
          borderRadius: '50%',
          border: '2px solid var(--bg-dark)',
          zIndex: 10
        }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{
          fontSize: '0.85rem',
          color: 'var(--text-primary)',
          fontWeight: '500',
          lineHeight: '1.2'
        }}>
          {username}
        </span>
        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
          Editing...
        </span>
      </div>
    </div>
  );
}

export default Client;
