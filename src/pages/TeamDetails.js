import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import './TeamDetails.css';

const TeamDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [leagues, setLeagues] = useState([]); // For league details
  const [leagueCode, setLeagueCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
  const fetchTeam = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/team/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTeam(res.data);

      // Gracefully attempt to fetch league details
      if (res.data.leagueCode) {
        try {
          const leagueRes = await axios.get(`http://localhost:5000/api/league?code=${res.data.leagueCode}`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setLeagues([leagueRes.data]);
        } catch (leagueErr) {
          console.warn('League not found or deleted, clearing league assignment');
          setLeagues([]);
        }
      } else {
        setLeagues([]);
      }

    } catch (err) {
      console.error('Error fetching team:', err);
      setError('Failed to load team details');
    }
  };

  fetchTeam();
}, [id]);



  const handleDeleteTeam = async () => {
  if (!window.confirm('Are you sure you want to delete this team?')) return;

  try {
    const token = localStorage.getItem('token');
    await axios.delete(`http://localhost:5000/api/team/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    setMessage('Team deleted successfully');
    
    // Redirect back to My Teams after short delay
    setTimeout(() => navigate('/my-team'), 1000);

  } catch (err) {
    console.error('Error deleting team:', err);
    setError(err.response?.data?.message || 'Failed to delete team');
  }
};


  const handleAddToLeague = async () => {
  try {
    const token = localStorage.getItem('token');
    const res = await axios.post(
      'http://localhost:5000/api/add-team-to-league',
      { teamId: id, leagueCode },
      { headers: { Authorization: `Bearer ${token}` } }
      
    );
    console.log('Team fetched:', res.data);
console.log('leagueCode:', res.data.leagueCode);


    setMessage(res.data.message || 'Team added to league');

    // Refetch team after adding to league
    const teamRes = await axios.get(`http://localhost:5000/api/team/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setTeam(teamRes.data);

    // Fetch league details using updated leagueCode from DB
    if (teamRes.data.leagueCode) {
      const leagueRes = await axios.get(
        `http://localhost:5000/api/league?code=${teamRes.data.leagueCode}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeagues([leagueRes.data]);
    } else {
      setLeagues([]);
    }

    setLeagueCode('');
  } catch (err) {
    console.error('Error adding to league:', err);
    setError(err.response?.data?.message || 'Failed to add team to league');
    
  }
};




  if (error) {
    return (
      <div className="team-details-container">
        <p className="error-text">{error}</p>
        <Button onClick={() => navigate('/my-team')}>Back to My Teams</Button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="team-details-container">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="team-details-container">
      <div className="team-box">
        <Button onClick={() => navigate('/my-team')} className="back-btn">
          ← Back to My Teams
        </Button>

        <h1 className="team-title">{team.name}</h1>
        <p className="team-info">Points: {team.points}</p>

        <p className="team-info">
  League:{' '}
  {leagues.length > 0 ? (
    <span>
      {leagues[0].name} ({leagues[0].code})
    </span>
  ) : (
    'Not assigned to any league'
  )}
</p>


        <div className="add-league-section">
          <h3>Add to League</h3>
          <input
            type="text"
            placeholder="Enter League Code"
            value={leagueCode}
            onChange={(e) => setLeagueCode(e.target.value)}
            className="league-input"
          />
          <Button onClick={handleAddToLeague}>Add</Button>
        </div>

        <div className="delete-team-section">
  <h3>Danger Zone</h3>
  <Button onClick={handleDeleteTeam} className="delete-btn">Delete Team</Button>
</div>


        {message && <p className="success-message">{message}</p>}
      </div>
    </div>
  );
};

export default TeamDetails;
