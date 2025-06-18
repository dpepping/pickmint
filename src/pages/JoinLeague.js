import React, { useState} from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // Import useNavigate


const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Initialize navigate

  const handleJoinLeague = async () => {
  try {
    const token = localStorage.getItem('token'); // ✅ Get token
    if (!token) {
      setMessage('No token found');
      return;
    }

    const response = await axios.post(
      'http://localhost:5000/api/league/join',
      { code }, // No need to send userEmail — backend gets it from token
      { headers: { Authorization: `Bearer ${token}` } } // ✅ Add token to headers
    );

    setMessage(response.data.message);
  } catch (error) {
    console.error('Join League Error:', error);
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
