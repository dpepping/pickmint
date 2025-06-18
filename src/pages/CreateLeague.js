import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';

const CreateLeague = () => {
  const [leagueName, setLeagueName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    console.log('Token:', token);  // Check if the token exists
    if (token) {
      const decoded = jwtDecode(token);
      console.log('Decoded Token:', decoded); // Check what you get from decoding
      setUserEmail(decoded.email);  // Set the email from the decoded token
    }
  }, []);  // The empty dependency array ensures this runs only once when the component mounts

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
    try {
      const { data } = await axios.post('http://localhost:5000/api/league/create', {
        name: leagueName,
        ownerEmail: userEmail,
        code: generatedCode, // Send the generated code to the backend
      });
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
