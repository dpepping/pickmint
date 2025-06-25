import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import './LeagueDetails.css';

function LeagueDetails() {
  const { leagueCode } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(
          `http://localhost:5000/api/league?code=${leagueCode}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = res.data;
        setLeague({
          name: data.name,
          size: data.groupSize,
          type: data.groupType || 'Private',
          password: data.groupPassword,
          participants: data.participants || [],
        });
      } catch (err) {
        console.error(err);
        setError('Error fetching league data');
      }
    };

    fetchLeagueDetails();
  }, [leagueCode]);

  const handleDeleteLeague = async () => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the league "${league?.name}"? This action cannot be undone.`
    );
    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/league/${leagueCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      alert('League deleted successfully');
      navigate('/my-leagues');
    } catch (err) {
      console.error('Error deleting league:', err);
      setMessage('Failed to delete league');
    }
  };

  if (error) {
    return (
      <div className="league-container">
        <p className="error-text">{error}</p>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="league-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="league-container">
      <div className="league-box">
        <Button onClick={() => navigate('/my-leagues')} className="back-btn">
          ← Back to My Groups
        </Button>

        <h1 className="league-title">{league.name}</h1>
        <p className="league-info">Group Size: {league.size}</p>
        <p className="league-info">Group Type: {league.type}</p>
        {league.type === 'Private' && (
          <p className="league-info">Password: {league.password}</p>
        )}

        <h2 className="participants-title">Participants</h2>
        {league.participants.length > 0 ? (
          <ul className="participants-list">
            {league.participants.map((p, idx) => (
              <li key={idx} className="participant-item">
                <div className="participant-name">
                  {p.firstName} {p.lastName} ({p.email})
                </div>

                {p.teams.length > 0 ? (
                  <ul className="team-list">
                    {p.teams.map((team, i) => (
                      <li
                        key={i}
                        className="team-item clickable"
                        onClick={() => navigate(`/team/${team._id}`)}
                        style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                        title="View Team Details"
                      >
                        Team: {team.name} ({team.points} pts)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="participant-team">No team</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-participants">No participants yet.</p>
        )}

        <div className="tabs">
          <button className="tab active">Results</button>
          <button className="tab">Most Picked</button>
        </div>

        <Button
          className="delete-btn"
          onClick={handleDeleteLeague}
          style={{ backgroundColor: 'red', color: 'white', marginTop: '1.5rem' }}
        >
          Delete League
        </Button>

        {message && <p className="error-text" style={{ marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
}

export default LeagueDetails;
