import React from 'react';
import Avatar from 'react-avatar';
import { Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

function Client({ username, isOwner }) {
  const navigate = useNavigate();
  const isGuest = username.toString().startsWith("Guest-");

  return (
    <div
      className="d-flex align-items-center mb-2 p-2 rounded hover-bg-dark"
      onClick={() => {
        if (!isGuest) {
          navigate(`/profile/${username}`);
        }
      }}
      style={{
        transition: 'background 0.2s',
        cursor: isGuest ? 'default' : 'pointer',
        border: isGuest ? 'none' : '1px solid transparent'
      }}
      onMouseEnter={(e) => {
        if (!isGuest) {
          e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
          e.currentTarget.style.borderColor = '#007acc';
        }
      }}
      onMouseLeave={(e) => {
        if (!isGuest) {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.borderColor = 'transparent';
        }
      }}
    >
      <Avatar name={username.toString()} size={35} round="8px" className="mr-2" textSizeRatio={2} />
      <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
        <span style={{ fontWeight: '600', fontSize: '0.9rem', color: '#e7e7e7', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {username.toString()}
          {isOwner && <Crown size={14} color="#fbbf24" fill="#fbbf24" />}
        </span>
        <span style={{ fontSize: '0.7rem', color: '#666' }}>{isOwner ? 'Owner' : 'Member'}</span>
      </div>
    </div>
  );
}

export default Client;
