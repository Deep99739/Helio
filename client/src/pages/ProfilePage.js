import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import { Github, Link as LinkIcon, Twitter, MessageSquare, Linkedin, Camera } from 'lucide-react';
import { SiCodeforces, SiLeetcode } from 'react-icons/si';
import NiceAvatar, { genConfig } from 'react-nice-avatar';
import ImagePickerModal from '../components/ImagePickerModal';

const ProfilePage = () => {
    const { username } = useParams();
    const { user: currentUser, token } = useAuth();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    // Image Picker State
    const [showImageModal, setShowImageModal] = useState(false);
    const [modalType, setModalType] = useState('avatar'); // 'avatar' or 'cover'

    // Edit Form State
    const [bio, setBio] = useState('');
    const [socialHandles, setSocialHandles] = useState({});
    const [newSocialType, setNewSocialType] = useState('codeforces');
    const [newSocialUrl, setNewSocialUrl] = useState('');

    // Note: We use profile state directly for previewing images during edit
    // effectively "optimistic UI" for the edit form

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await axios.get(`/users/${username}`);
                setProfile(res.data);
                setBio(res.data.bio || '');
                setSocialHandles(res.data.socialHandles || {});
            } catch (error) {
                console.error(error);
                toast.error('Failed to load profile');
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, [username]);

    const handleSave = async () => {
        try {
            if (!token) {
                toast.error("Please login to save profile");
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            const cleanedHandles = {};
            if (socialHandles && typeof socialHandles === 'object') {
                Object.entries(socialHandles).forEach(([key, value]) => {
                    if (key && value && value.trim() !== '') {
                        cleanedHandles[key] = value.trim();
                    }
                });
            }

            const payload = {
                bio: bio || '',
                socialHandles: cleanedHandles,
                avatar: profile.avatar, // Send current state (updated via modal)
                coverPhoto: profile.coverPhoto
            };

            const res = await axios.put('/users/profile', payload, config);
            setProfile(res.data);
            setIsEditing(false);
            toast.success('Profile updated successfully');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Update failed';
            toast.error(`Error ${error.response?.status}: ${msg}`);
        }
    };

    const handleImageUpdate = (imageData) => {
        // imageData: { type: 'preset'|'upload'|'generated', value: ... }
        if (modalType === 'avatar') {
            setProfile(prev => ({ ...prev, avatar: imageData }));
        } else {
            setProfile(prev => ({ ...prev, coverPhoto: imageData }));
        }
        setShowImageModal(false);
    };

    const addSocial = () => {
        if (!newSocialUrl) return;
        setSocialHandles(prev => ({ ...prev, [newSocialType]: newSocialUrl }));
        setNewSocialUrl('');
    };

    const removeSocial = (key) => {
        const newHandles = { ...socialHandles };
        delete newHandles[key];
        setSocialHandles(newHandles);
    };

    const [isSendingRequest, setIsSendingRequest] = useState(false);

    const handleSendRequest = async () => {
        if (isSendingRequest) return;
        setIsSendingRequest(true);
        try {
            if (!token) {
                toast.error('You must be logged in');
                return;
            }
            if (!profile || !profile._id) {
                toast.error('Invalid profile');
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.post(`/users/request/${profile._id}`, {}, config);
            setProfile(prev => ({
                ...prev,
                friendshipStatus: 'PENDING_SENT'
            }));
            toast.success('Friend request sent!');
        } catch (error) {
            console.error(error);
            const msg = error.response?.data?.message || 'Request failed';
            toast.error(`Error ${error.response?.status}: ${msg}`);
        } finally {
            setIsSendingRequest(false);
        }
    };

    const handleAcceptRequest = async () => {
        try {
            if (!profile.friendRequestId) {
                toast.error("Cannot accept: Missing request ID");
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            };

            await axios.put(`/users/accept/${profile.friendRequestId}`, {}, config);
            setProfile(prev => ({ ...prev, friendshipStatus: 'FRIENDS' }));
            toast.success('Friend request accepted!');
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Failed to accept request');
        }
    };

    const getSocialIcon = (key) => {
        switch (key.toLowerCase()) {
            case 'github': return <Github size={16} />;
            case 'twitter': return <Twitter size={16} />;
            case 'linkedin': return <Linkedin size={16} />;
            case 'codeforces': return <SiCodeforces size={16} />;
            case 'leetcode': return <SiLeetcode size={16} />;
            default: return <LinkIcon size={16} />;
        }
    };

    // Helper to render Avatar
    const renderAvatar = (avatarData) => {
        // Fallback for old data or defaults
        if (!avatarData || typeof avatarData === 'string') {
            // Generate a default config based on username if legacy string
            return <NiceAvatar style={{ width: '100%', height: '100%' }} {...genConfig(profile.username)} />;
        }

        // Only handle generated or fallback. Removed 'upload' support.
        if (avatarData.type === 'generated' && avatarData.value) {
            try {
                const config = JSON.parse(avatarData.value);
                return <NiceAvatar style={{ width: '100%', height: '100%' }} {...config} />;
            } catch (e) {
                return <NiceAvatar style={{ width: '100%', height: '100%' }} {...genConfig(profile.username)} />;
            }
        } else {
            // Fallback
            return <NiceAvatar style={{ width: '100%', height: '100%' }} {...genConfig(profile.username)} />;
        }
    };

    // Helper to get Cover Background
    const getCoverBackground = (coverData) => {
        if (!coverData || typeof coverData === 'string') {
            return coverData || 'linear-gradient(to right, #007acc, #6366f1)';
        }
        // Removed 'upload' support
        return coverData.value;
    };


    if (loading) return <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;
    if (!profile) return <div style={{ minHeight: '100vh', backgroundColor: '#1e1e1e', color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>User not found</div>;

    const isOwner = currentUser && (currentUser.username === profile.username || currentUser.id === profile._id);
    const { friendshipStatus } = profile;

    const pageContainerStyle = {
        minHeight: '100vh',
        backgroundColor: '#1e1e1e',
        display: 'flex',
        flexDirection: 'column',
    };

    const contentWrapperStyle = {
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        padding: '40px 20px',
        marginTop: '20px'
    };

    const cardStyle = {
        backgroundColor: '#252526',
        borderRadius: '15px',
        width: '100%',
        maxWidth: '600px',
        boxShadow: '0 8px 16px rgba(0,0,0,0.5)',
        textAlign: 'center',
        overflow: 'hidden',
        paddingBottom: '40px',
        position: 'relative'
    };

    // Cover Photo
    const coverPhotoStyle = {
        height: '120px',
        width: '100%',
        background: getCoverBackground(profile.coverPhoto),
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        position: 'relative'
    };

    // Avatar Container
    const avatarContainerStyle = {
        width: '110px',
        height: '110px',
        borderRadius: '50%',
        backgroundColor: '#1e1e1e',
        margin: '-55px auto 0 auto',
        position: 'relative',
        border: '4px solid #1e1e1e',
        zIndex: 10,
        overflow: 'hidden' // Ensure img doesn't overflow border radius
    };

    const editOverlayStyle = {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        opacity: 0,
        transition: 'opacity 0.2s'
    };

    const usernameStyle = {
        fontSize: '2rem',
        color: 'white',
        fontWeight: 'bold',
        marginTop: '60px',
        marginBottom: '10px'
    };

    const actionButtonStyle = (disabled = false, variant = 'primary') => ({
        width: '100%',
        padding: '12px',
        backgroundColor: disabled ? '#555' : (variant === 'green' ? '#4ade80' : '#007acc'),
        color: variant === 'green' ? '#1a202c' : 'white',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1rem',
        fontWeight: 'bold',
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'all 0.2s'
    });

    const socialLinkStyle = {
        color: '#ccc',
        textDecoration: 'none',
        border: '1px solid #444',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '0.9rem',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        backgroundColor: 'rgba(255,255,255,0.05)'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px',
        backgroundColor: '#3c3c3c',
        border: '1px solid #555',
        color: 'white',
        borderRadius: '8px',
        fontSize: '1rem',
        marginBottom: '15px',
        outline: 'none'
    };


    return (
        <div style={pageContainerStyle}>
            <Navbar />
            <div style={contentWrapperStyle}>
                <div style={cardStyle}>
                    {/* Cover Photo */}
                    <div style={coverPhotoStyle}>
                        {isEditing && (
                            <div
                                style={{ ...editOverlayStyle, opacity: 1 }}
                                onClick={() => { setModalType('cover'); setShowImageModal(true); }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'}
                            >
                                <Camera color="white" size={24} />
                            </div>
                        )}
                    </div>

                    {/* Avatar */}
                    <div style={avatarContainerStyle}>
                        {renderAvatar(profile.avatar)}

                        {isEditing && (
                            <div
                                style={{ ...editOverlayStyle, opacity: 1, borderRadius: '50%' }}
                                onClick={() => { setModalType('avatar'); setShowImageModal(true); }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.6)'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.4)'}
                            >
                                <Camera color="white" size={24} />
                            </div>
                        )}
                    </div>

                    {/* Username */}
                    <div style={usernameStyle}>{profile.username}</div>

                    <div style={{ padding: '0 40px' }}>
                        {!isEditing ? (
                            <>
                                {/* Action Buttons */}
                                <div style={{ marginBottom: '30px' }}>
                                    {!isOwner && (
                                        <>
                                            {friendshipStatus === 'NONE' && (
                                                <button style={actionButtonStyle(isSendingRequest)} onClick={handleSendRequest} disabled={isSendingRequest}>
                                                    {isSendingRequest ? 'Sending...' : 'Send Friend Request'}
                                                </button>
                                            )}
                                            {friendshipStatus === 'PENDING_SENT' && (
                                                <button style={actionButtonStyle(true)} disabled>
                                                    Request Sent
                                                </button>
                                            )}
                                            {friendshipStatus === 'PENDING_RECEIVED' && (
                                                <button style={actionButtonStyle(false, 'green')} onClick={handleAcceptRequest}>
                                                    Accept Request
                                                </button>
                                            )}
                                            {friendshipStatus === 'FRIENDS' && (
                                                <button style={actionButtonStyle()} onClick={() => navigate(`/chat/${profile._id}`)}>
                                                    <MessageSquare size={18} /> Message
                                                </button>
                                            )}
                                        </>
                                    )}

                                    {isOwner && (
                                        <button
                                            style={{ ...actionButtonStyle(), backgroundColor: '#3c3c3c', border: '1px solid #555' }}
                                            onClick={() => setIsEditing(true)}
                                        >
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                {/* Bio Section */}
                                <div style={{ marginBottom: '30px', textAlign: 'left' }}>
                                    <h4 style={{ color: '#007acc', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>BIO</h4>
                                    <p style={{ color: '#e5e5e5', lineHeight: '1.6', fontSize: '1rem', margin: 0 }}>
                                        {profile.bio || <span style={{ color: '#888', fontStyle: 'italic' }}>No bio yet.</span>}
                                    </p>
                                </div>

                                {/* Socials Section */}
                                <div style={{ textAlign: 'left' }}>
                                    <h4 style={{ color: '#007acc', fontSize: '0.8rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '15px', letterSpacing: '1px' }}>SOCIALS</h4>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                        {Object.entries(profile.socialHandles || {}).length > 0 ? (
                                            Object.entries(profile.socialHandles || {}).map(([key, url]) => (
                                                <a
                                                    key={key}
                                                    href={url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={socialLinkStyle}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.backgroundColor = '#007acc';
                                                        e.currentTarget.style.color = 'white';
                                                        e.currentTarget.style.borderColor = '#007acc';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
                                                        e.currentTarget.style.color = '#ccc';
                                                        e.currentTarget.style.borderColor = '#444';
                                                    }}
                                                >
                                                    {getSocialIcon(key)} {key.charAt(0).toUpperCase() + key.slice(1)}
                                                </a>
                                            ))
                                        ) : (
                                            <div style={{ fontStyle: 'italic', color: '#888' }}>No social links added.</div>
                                        )}
                                    </div>
                                </div>
                            </>
                        ) : (
                            // Edit Mode
                            <div style={{ marginTop: '10px' }}>
                                <div style={{ marginBottom: '20px', textAlign: 'left' }}>
                                    <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>Bio</label>
                                    <textarea
                                        style={{ ...inputStyle, minHeight: '100px', resize: 'vertical' }}
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        placeholder="Tell us about yourself..."
                                    />
                                </div>

                                <div style={{ marginBottom: '25px', textAlign: 'left' }}>
                                    <label style={{ display: 'block', color: '#ccc', marginBottom: '8px', fontSize: '0.9rem' }}>Add Social Link</label>
                                    <div style={{ display: 'flex', gap: '10px' }}>
                                        <select
                                            style={{ ...inputStyle, width: '140px', marginBottom: 0 }}
                                            value={newSocialType}
                                            onChange={(e) => setNewSocialType(e.target.value)}
                                        >
                                            <option value="codeforces">Codeforces</option>
                                            <option value="github">GitHub</option>
                                            <option value="leetcode">LeetCode</option>
                                            <option value="linkedin">LinkedIn</option>
                                            <option value="twitter">Twitter</option>
                                            <option value="website">Website</option>
                                        </select>
                                        <input
                                            type="text"
                                            style={{ ...inputStyle, marginBottom: 0 }}
                                            placeholder="URL"
                                            value={newSocialUrl}
                                            onChange={(e) => setNewSocialUrl(e.target.value)}
                                        />
                                        <button
                                            onClick={addSocial}
                                            style={{ ...actionButtonStyle(), width: 'auto', padding: '0 20px', marginBottom: 0 }}
                                        >
                                            Add
                                        </button>
                                    </div>
                                </div>

                                {/* Active Tags */}
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginBottom: '30px' }}>
                                    {Object.entries(socialHandles).map(([key, url]) => (
                                        <div key={key} style={{ backgroundColor: '#333', color: 'white', padding: '6px 12px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.9rem', border: '1px solid #444' }}>
                                            {getSocialIcon(key)}
                                            <span>{key}</span>
                                            <button
                                                onClick={() => removeSocial(key)}
                                                style={{ background: 'none', border: 'none', color: '#ff5555', cursor: 'pointer', fontSize: '1.2rem', display: 'flex', alignItems: 'center' }}
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>

                                <div style={{ display: 'flex', gap: '15px' }}>
                                    <button
                                        style={actionButtonStyle()}
                                        onClick={handleSave}
                                    >
                                        Save Changes
                                    </button>
                                    <button
                                        style={{ ...actionButtonStyle(), backgroundColor: 'transparent', border: '1px solid #555', color: '#ccc' }}
                                        onClick={() => setIsEditing(false)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <ImagePickerModal
                isOpen={showImageModal}
                onClose={() => setShowImageModal(false)}
                onSave={handleImageUpdate}
                type={modalType}
            />
        </div>
    );
};

export default ProfilePage;
