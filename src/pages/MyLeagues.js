import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyLeagues.css';

const MyLeagues = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [countdowns, setCountdowns] = useState({});
  const navigate = useNavigate();

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

  // Setup countdowns for all leagues every second
  useEffect(() => {
    if (!user?.leagues) return;

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
          // No draft time set
          newCountdowns[league.code] = 'No date chosen yet';
        }
      });

      setCountdowns(newCountdowns);
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const handleGoHome = () => {
    navigate('/home');
  };

  return (
    <div className="my-leagues-container">
      <div className="outer-box">
        <div className="group-box">
          <h2>My Leagues</h2>

          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && user?.leagues?.length === 0 && (
            <p>You are not part of any leagues yet.</p>
          )}

          {!loading && !error && user?.leagues?.length > 0 && (
            <div className="leagues-box">
              <h3>Your Leagues</h3>
              <div className="league-list">
                {user.leagues.map((league, idx) => (
                  <div 
                    key={idx} 
                    className="league-item" 
                    style={{ cursor: 'pointer' }} 
                    onClick={() => navigate(`/league/${league.code}`)}
                  >
                    <div className="league-header">
                      <span className="league-name">{league.name}</span>
                      <span className="league-code">Code: {league.code}</span>
                    </div>
                    {league.groupSize !== undefined && (
                      <div className="group-size">Group Size: {league.groupSize}</div>
                    )}
                    <div className="countdown">
                      Draft Countdown: {countdowns[league.code] || 'Calculating...'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <button className="nav-button" onClick={handleGoHome}>
        ⬅ Back to Home
      </button>
    </div>
  );
};

export default MyLeagues;
