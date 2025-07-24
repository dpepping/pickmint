import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import './TeamDetails.css';

function TeamDetailsInLeague() {
  const { leagueCode, teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [league, setLeague] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Authentication token missing');

        // Fetch team details
        const teamResponse = await axios.get(`http://localhost:5000/api/team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // Fetch league details
        const leagueResponse = await axios.get(`http://localhost:5000/api/league?code=${leagueCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTeam(teamResponse.data);
        setLeague(leagueResponse.data);
        setError('');
      } catch (err) {
        console.error('Failed to load team or league details:', err);
        setError('Failed to load team or league details.');
      }
    };

    fetchData();
  }, [teamId, leagueCode]);

  const handleRemoveFromLeague = async () => {
    if (!window.confirm(`Are you sure you want to remove team "${team?.name}" from league "${league?.name}"?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/remove-team-from-league',
        { teamId, leagueCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Team removed from league successfully.');
      navigate(`/league/${leagueCode}`);
    } catch (err) {
      console.error('Failed to remove team from league:', err);
      setMessage('Failed to remove team from league.');
    }
  };

  if (error) {
    return (
      <div className="team-details-container">
        <p className="error-text">{error}</p>
        <Button onClick={() => navigate(`/league/${leagueCode}`)}>Back to League</Button>
      </div>
    );
  }

  if (!team || !league) {
    return (
      <div className="team-details-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="team-details-container">
      <div className="team-box">
        <Button onClick={() => navigate(`/league/${leagueCode}`)} className="back-btn">
          ← Back to League
        </Button>

        <h1 className="team-title">{team.name}</h1>
        <p className="team-info">Points: {team.points}</p>
        <p className="team-info">
          League: {league.name} ({league.code})
        </p>

        <Button
          onClick={handleRemoveFromLeague}
          style={{ backgroundColor: 'orange', color: 'black', marginTop: '1.5rem' }}
        >
          Remove Team from League
        </Button>

        {message && <p className="error-text" style={{ marginTop: '1rem' }}>{message}</p>}
      </div>
    </div>
  );
}

export default TeamDetailsInLeague;
