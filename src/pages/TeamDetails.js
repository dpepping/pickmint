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

        // Fetch league details for all league codes of this team
        if (res.data.leagueCodes && res.data.leagueCodes.length > 0) {
          const leagueDetailsPromises = res.data.leagueCodes.map(code =>
            axios.get(`http://localhost:5000/api/league?code=${code}`, {
              headers: { Authorization: `Bearer ${token}` },
            }).then(r => r.data)
              .catch(() => null) // in case some league not found
          );

          const leaguesData = await Promise.all(leagueDetailsPromises);
          // Filter out nulls (failed fetches)
          setLeagues(leaguesData.filter(l => l !== null));
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
        {
          teamId: id,
          leagueCode,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setMessage(res.data.message || 'Team added to league');

      // Update team state with new league code
      setTeam((prev) => ({
        ...prev,
        leagueCodes: [...(prev.leagueCodes || []), leagueCode],
      }));

      // Fetch league detail for the newly added league
      const leagueRes = await axios.get(
        `http://localhost:5000/api/league?code=${leagueCode}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setLeagues((prev) => [...prev, leagueRes.data]);

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
          Leagues:{' '}
          {leagues.length > 0 ? (
            leagues.map((league, idx) => (
              <span key={league.code}>
                {league.name} ({league.code})
                {idx < leagues.length - 1 ? ', ' : ''}
              </span>
            ))
          ) : (
            'Not assigned to any leagues'
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
