import React, { useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const CreateLeague = () => {
  const [leagueName, setLeagueName] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();


  // Function to generate a 6-character alphanumeric league code
  const generateLeagueCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generated = '';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return generated;
  };

  const handleCreateLeague = async () => {
  const generatedCode = generateLeagueCode(); // Generate code here
  const token = localStorage.getItem('token'); // Get token from localStorage

  try {
    const { data } = await axios.post(
      'http://localhost:5000/api/league/create',
      {
        name: leagueName,
        code: generatedCode, // Send the generated code to the backend
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,  // Add the Bearer token here
        },
      }
    );
    setCode(generatedCode); // Show the code to the user
    console.log(data); // You can log the data to see what the response contains
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to create league');
  }
};


  const handleBack = () => {
    navigate('/home');
  };

  return (
    <div>
      <h2>Create a League</h2>
      <input
        type="text"
        placeholder="League Name"
        value={leagueName}
        onChange={(e) => setLeagueName(e.target.value)}
      />
      <button onClick={handleCreateLeague}>Create League</button>

      {code && (
        <p>Your league code: <strong>{code}</strong></p>
      )}

      <button onClick={handleBack} style={{ marginTop: '10px' }}>← Back to Home</button>
    </div>
  );
};

export default CreateLeague;
