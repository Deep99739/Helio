import React, { useState } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState('');

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuid();
    toast.success('Created a new room');
    navigate(`/editor/${id}`);
  };

  const joinRoom = () => {
    if (!roomId.trim()) {
      toast.error('Details not present');
      return;
    }

    // Generate Guest Name for anonymous join
    const guestName = `Guest-${Math.floor(Math.random() * 1000)}`;

    navigate(`/editor/${roomId}`, {
      state: {
        username: guestName,
      },
    });
    toast.success("Joined as " + guestName);
  };

  const handleInputEnter = (e) => {
    if (e.code === 'Enter') {
      joinRoom();
    }
  };

  // Dark Theme Styles
  const containerStyle = {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1e1e1e', // Dark background
    color: 'white',
    padding: '20px'
  };

  const cardStyle = {
    backgroundColor: '#252526',
    padding: '40px',
    borderRadius: '15px',
    maxWidth: '500px',
    width: '100%',
    boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
    textAlign: 'center'
  };

  const logoStyle = {
    fontSize: '3rem',
    fontWeight: 'bold',
    marginBottom: '40px',
    letterSpacing: '4px',
    color: 'white'
  };

  const actionContainerStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '30px'
  };

  const btnStyle = {
    padding: '12px 24px',
    borderRadius: '8px',
    border: 'none',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    width: '100%'
  };

  const primaryBtnStyle = {
    ...btnStyle,
    backgroundColor: '#007acc',
    color: 'white'
  };

  const secondaryBtnStyle = {
    ...btnStyle,
    backgroundColor: 'transparent',
    border: '2px solid #007acc',
    color: '#007acc'
  };

  const inputStyle = {
    padding: '12px',
    borderRadius: '8px',
    border: '1px solid #555',
    backgroundColor: '#3c3c3c',
    color: 'white',
    fontSize: '16px',
    width: '100%',
    outline: 'none',
    marginBottom: '10px'
  };

  const labelStyle = {
    display: 'block',
    textAlign: 'left',
    marginBottom: '10px',
    color: '#aaaaaa',
    fontWeight: 'bold',
    fontSize: '14px',
    textTransform: 'uppercase'
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h1 style={logoStyle}>HELIX</h1>

        <div style={actionContainerStyle}>
          {/* Option A: Create New */}
          <div>
            <button onClick={createNewRoom} style={primaryBtnStyle}>
              New Room
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', color: '#555' }}>
            <div style={{ flex: 1, borderBottom: '1px solid #444' }}></div>
            <span style={{ padding: '0 10px', fontSize: '14px' }}>OR</span>
            <div style={{ flex: 1, borderBottom: '1px solid #444' }}></div>
          </div>

          {/* Option B: Join Existing */}
          <div>
            <span style={labelStyle}>Join Existing Room</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <input
                type="text"
                style={inputStyle}
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                onKeyUp={handleInputEnter}
              />
              <button onClick={joinRoom} style={{ ...secondaryBtnStyle, width: 'auto' }}>
                Join
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
