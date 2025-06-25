import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyTeam.css';

const MyTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users/me/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(response.data.teams);
        setLoading(false);
      } catch (err) {
        setError('Failed to load teams');
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleGoHome = () => {
    navigate('/home');
  };

  const handleCreateTeam = () => {
    navigate('/create-teams');
  };

  return (
    <div className="my-teams-container">
      <div className="outer-box">
        <div className="group-box">
          <h2>My Teams</h2>

          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && teams.length === 0 && (
            <p>You have not created any teams yet.</p>
          )}

          {!loading && !error && teams.length > 0 && (
            <div className="teams-box">
              <h3>Your Teams</h3>
              <div className="team-list">
                {teams.map((team, idx) => (
                  <div
                    key={idx}
                    className="team-item clickable"
                    onClick={() => navigate(`/team/${team._id}`)}
                  >
                    <div className="team-header">
                      <span className="team-name">{team.name}</span>
                      <span className="team-points">Points: {team.points}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Buttons below the container */}
      <button className="nav-button" onClick={handleCreateTeam}>
        ➕ Create New Team
      </button>
      <button className="nav-button" onClick={handleGoHome}>
        ⬅ Back to Home
      </button>
    </div>
  );
};

export default MyTeams;
