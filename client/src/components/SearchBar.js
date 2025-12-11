import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaSearch } from 'react-icons/fa';
import Avatar from 'react-avatar';

const SearchBar = () => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const navigate = useNavigate();
    const wrapperRef = useRef(null);

    // Custom debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                setLoading(true);
                try {
                    const res = await axios.get(`/users/search?query=${query}`);
                    setResults(res.data);
                    setIsOpen(true);
                } catch (error) {
                    console.error("Search failed", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [query]);

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    const handleSelect = (username) => {
        setIsOpen(false);
        setQuery('');
        navigate(`/profile/${username}`);
    };

    return (
        <div className="search-bar" ref={wrapperRef}>
            <FaSearch className="search-icon" />
            <input
                type="text"
                placeholder="Search users..."
                className="glass-input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => query && setIsOpen(true)}
            />

            {isOpen && (
                <div className="search-dropdown">
                    {loading ? (
                        <div className="search-item">Loading...</div>
                    ) : results.length > 0 ? (
                        results.map(user => (
                            <div key={user._id} className="search-item" onClick={() => handleSelect(user.username)}>
                                <Avatar name={user.username} size="30" round="50%" />
                                <div className="search-info">
                                    <span className="search-username">{user.username}</span>
                                    {user.bio && <span className="search-bio">{user.bio.substring(0, 30)}...</span>}
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="search-item">No users found</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default SearchBar;
