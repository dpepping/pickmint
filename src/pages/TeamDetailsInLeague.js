import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import './TeamDetails.css';  // reuse your existing styles

function TeamDetailsInLeague() {
  const { leagueCode, teamId } = useParams();
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [league, setLeague] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTeamAndLeague = async () => {
      try {
        const token = localStorage.getItem('token');

        // Fetch team details
        const teamRes = await axios.get(`http://localhost:5000/api/team/${teamId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeam(teamRes.data);

        // Fetch league details (optional if you want to show league info)
        const leagueRes = await axios.get(`http://localhost:5000/api/league?code=${leagueCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setLeague(leagueRes.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load team or league details.');
      }
    };

    fetchTeamAndLeague();
  }, [teamId, leagueCode]);

  const handleRemoveFromLeague = async () => {
    const confirmRemove = window.confirm(
      `Are you sure you want to remove the team "${team?.name}" from league "${league?.name}"?`
    );
    if (!confirmRemove) return;

    try {
      const token = localStorage.getItem('token');
      // Assuming you have a DELETE or POST API to remove team from league:
      await axios.post(
        'http://localhost:5000/api/remove-team-from-league',
        { teamId, leagueCode },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('Team removed from league successfully');
      navigate(`/league/${leagueCode}`); // back to league details
    } catch (err) {
      console.error(err);
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
