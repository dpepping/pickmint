import React, { useEffect, useState } from 'react';
// import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyLeagues.css';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import '../index.css'

const MyLeagues = () => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [countdowns, setCountdowns] = useState({});

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('token');
                const response = await axios.get('http://localhost:5000/api/users/me', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setUser(response.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load user data');
                setLoading(false);
            }
        };

        fetchUser();
    }, []);

    useEffect(() => {
        // Ensure user and user.leagues exist before setting up the interval
        if (user && user.leagues) {
            const interval = setInterval(() => {
                const newCountdowns = {};
                user.leagues.forEach((league) => {
                    if (league.draftTime) {
                        const diff = new Date(league.draftTime).getTime() - Date.now();
                        if (diff <= 0) {
                            newCountdowns[league.code] = 'Draft is starting!';
                        } else {
                            const hours = Math.floor(diff / (1000 * 60 * 60));
                            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
                            const seconds = Math.floor((diff % (1000 * 60)) / 1000);
                            newCountdowns[league.code] = `${hours}h ${minutes}m ${seconds}s`;
                        }
                    } else {
                        newCountdowns[league.code] = 'No date chosen yet';
                    }
                });
                setCountdowns(newCountdowns);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [user]);

    return (
        <div className="dashboard-container">
            <Navbar />
            <div className="main-layout">
                <Sidebar />
                <div className="my-leagues-container">
                    <div className="outer-box">
                        <div className="group-box">

                            {loading && <p>Loading...</p>}
                            {error && <p>{error}</p>}
                            {!loading && !error && user?.leagues?.length === 0 && (
                                <p>You are not part of any leagues yet.</p>
                            )}

                            <main className="content-area">
                                <section className="my-leagues-section">
                                    <div className="section-header">
                                        <h2>My Leagues</h2>
                                        <div className="filters">
                                            <input type="text" placeholder="Search my leagues..." className="search-input" />
                                            <button className="filter-btn active">All Leagues</button>
                                            <button className="filter-btn">Active Drafts</button>
                                            <button className="filter-btn">My Teams</button>
                                            <button className="filter-btn">Completed</button>
                                            <select className="filter-btn sort-by-select">
                                                <option value="latest">Sort By: Latest</option>
                                                <option value="next-draft">Sort By: Next Draft</option>
                                                <option value="alphabetical">Sort By: A-Z</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="leagues-grid">
                                        {/* Now correctly map over the leagues with null checks */}
                                        {user?.leagues?.map((league, index) => (
                                            <div className="league-card" key={league.code} tabIndex={index}>
                                                <div className="card-header">
                                                    <h3 className="league-name">{league.name}</h3>
                                                </div>
                                                <div className="card-body">
                                                    <p className="draft-status live-draft">Draft Countdown: {countdowns[league.code] || 'Calculating...'}</p>
                                                    <p className="group-size">Group Size: {league.groupSize}</p>
                                                </div>
                                                <div className="card-footer">
                                                    <span className="league-code">Code: {league.code}</span>
                                                    <button className="copy-code-btn" title="Copy Code">
                                                        <i className="icon-copy"></i>
                                                    </button>
                                                    <a href={'league/'+league.code}><button className="btn-primary go-to-league">Go to League</button></a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </main>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyLeagues;