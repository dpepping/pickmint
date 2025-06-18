import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import './MyTeam.css'; // Optional if you want styling

function MyTeams() {
  const [teams, setTeams] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserTeams = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('🔑 Token from localStorage:', token);

        if (!token) {
          setError('No token found. Please log in.');
          return;
        }

        const response = await axios.get('http://localhost:5000/api/user/teams', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✅ Teams fetch response:', response.data);

        setTeams(response.data.teams || []);
        setError(''); // Clear error if successful
      } catch (err) {
        // Log full error info
        console.error('❌ Error fetching teams:', err);
        if (err.response) {
          console.error('Response data:', err.response.data);
          console.error('Response status:', err.response.status);
          console.error('Response headers:', err.response.headers);
          setError(`Error fetching teams: ${err.response.data.message || err.message}`);
        } else if (err.request) {
          // Request was made but no response received
          console.error('No response received:', err.request);
          setError('No response from server. Please try again later.');
        } else {
          // Other errors
          setError(`Request error: ${err.message}`);
        }
      }
    };

    fetchUserTeams();
  }, []);

  return (
    <div className="my-teams-container">
      <h1>My Teams</h1>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div className="outer-box">
        <div className="group-box">
          <h2>Teams</h2>

          {teams.length > 0 ? (
            <div className="team-list">
              {teams.map((team, index) => (
                <div key={index} className="team-item">
                  <div className="team-header">
                    <span className="team-name">{team.name}</span>
                    <span className="team-points">{team.points} pts</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>You haven't created any teams yet.</p>
          )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={() => navigate('/create-teams')}>
          Create Team
        </Button>
        <Button onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}

export default MyTeams;
