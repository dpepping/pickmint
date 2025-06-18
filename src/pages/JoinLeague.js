import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
        const decoded = jwtDecode(token);
      setUserEmail(decoded.email);
    }
  }, []);

  const handleJoinLeague = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/league/join', {
        code,
        userEmail,
      });
      setMessage(response.data.message);
    } catch (error) {
      setMessage(error.response?.data?.message || 'Failed to join league');
    }
  };

  const handleBack = () => {
    navigate('/home'); // Replace with '/' if that's your actual home route
  };

  return (
    <div>
      <h2>Join a League</h2>
      <input
        type="text"
        placeholder="League Code"
        value={code}
        onChange={(e) => setCode(e.target.value)}
      />
      <button onClick={handleJoinLeague}>Join League</button>
      {message && <p>{message}</p>}

      {/* Back to Home button */}
      <button onClick={handleBack} style={{ marginTop: '10px' }}>← Back to Home</button>
    </div>
  );
};

export default JoinLeague;
