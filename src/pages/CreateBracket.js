import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import './CreateBracket.css';
import { jwtDecode } from 'jwt-decode';

function CreateBracket() {
  const [bracketName, setBracketName] = useState('');
  const [error, setError] = useState('');
  const [selectedLeagueCode, setSelectedLeagueCode] = useState('');
  const [availableLeagues, setAvailableLeagues] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeagues = async () => {
      try {
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

      const decoded = jwtDecode(token);
      const email = decoded.email;

      const response = await axios.post(
        'http://localhost:5000/api/create-bracket',
        {
          email,
          bracketName,
          leagueCode: selectedLeagueCode || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 201 || response.status === 200) {
        alert('Bracket created successfully!');
        navigate('/my-brackets');
      } else {
        setError('Failed to create bracket.');
      }
    } catch (err) {
      console.error('Error creating bracket:', err);
      setError('Something went wrong.');
    }
  };

  return (
    <div className="create-bracket-container">
      <h1>Create a Bracket</h1>
      {error && <p className="error-message">{error}</p>}

      <input
        type="text"
        placeholder="Bracket Name"
        value={bracketName}
        onChange={(e) => setBracketName(e.target.value)}
        className="bracket-input"
      />

      <select
        className="bracket-input"
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
        <Button onClick={() => navigate('/my-brackets')}>Back</Button>
      </div>
    </div>
  );
}

export default CreateBracket;
