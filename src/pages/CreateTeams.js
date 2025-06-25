import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import './CreateTeams.css';

function CreateTeam() {
  const [teamName, setTeamName] = useState('');
  const [error, setError] = useState('');
  const [selectedLeagueCode, setSelectedLeagueCode] = useState('');
  const [availableLeagues, setAvailableLeagues] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
        //const response = await axios.get('https://pickmint-fb40314ffafe.herokuapp.com/api/leagues');
        const response = await axios.get('http://localhost:5000/api/leagues');
        setAvailableLeagues(response.data);
      } catch (err) {
        console.error('Failed to fetch leagues', err);
      }
    };

    fetchLeagues();
  }, []);

  const handleCreate = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }

    const response = await axios.post(
      'http://localhost:5000/api/create-team',
      {
        teamName,
        leagueCode: selectedLeagueCode || null
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 201 || response.status === 200) {
      alert('Team created successfully!');
      navigate('/my-team');
    } else {
      setError('Failed to create team.');
    }
  } catch (err) {
    console.error('Error creating team:', err);
    setError('Something went wrong.');
  }
};



  //'https://pickmint-fb40314ffafe.herokuapp.com/api/create-team',
  return (
    <div className="create-team-container">
      <h1>Create a Team</h1>
      {error && <p className="error-message">{error}</p>}

      <input
        type="text"
        placeholder="Team Name"
        value={teamName}
        onChange={(e) => setTeamName(e.target.value)}
        className="team-input"
      />

      <select
        className="team-input"
        value={selectedLeagueCode}
        onChange={(e) => setSelectedLeagueCode(e.target.value)}
      >
        <option value="">-- Select League (optional) --</option>
        {availableLeagues.map((league) => (
          <option key={league.code} value={league.code}>
            {league.name} ({league.code})
          </option>
        ))}
      </select>

      <div className="button-group">
        <Button onClick={handleCreate}>Create</Button>
        <Button onClick={() => navigate('/my-team')}>Back</Button>
      </div>
    </div>
  );
}

export default CreateTeam;
