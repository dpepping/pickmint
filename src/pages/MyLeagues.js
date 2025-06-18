import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyLeagues.css';

const MyLeagues = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('https://pickmint-fb40314ffafe.herokuapp.com/api/users/me', {
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
                  <div key={idx} className="league-item">
                    <div className="league-header">
                      <span className="league-name">{league.name}</span>
                      <span className="league-code">Code: {league.code}</span>
                    </div>
                    {league.groupSize && (
                      <div className="group-size">Group Size: {league.groupSize}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons below the container */}
      <button className="nav-button" onClick={handleGoHome}>
        ⬅ Back to Home
      </button>
    </div>
  );
};

export default MyLeagues;
