import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Button from '../components/ui/Button';
import './MyBrackets.css'; // Optional if you want styling

function MyBrackets() {
  const [brackets, setBrackets] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBrackets = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No token found');
          return;
        }

        const { data } = await axios.get('http://localhost:5000/api/brackets', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setBrackets(data || []);
      } catch (err) {
        console.error('Error fetching brackets:', err);
        setError('Error fetching brackets');
      }
    };

    fetchBrackets();
  }, []);

  return (
    <div className="my-brackets-container">
      <h1>My Brackets</h1>

      {error && <p>{error}</p>}

      <div className="outer-box">
        <div className="group-box">
          <h2>Brackets</h2>


            {brackets.length > 0 ? (
              <div className="bracket-list">
                {brackets.map((bracket, index) => (
                  <div key={index} className="bracket-item">
                    <div className="bracket-header">
                      <span className="bracket-name">{bracket.name}</span>
                      <span className="bracket-points">{bracket.points} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>You haven't created any brackets yet.</p>
            )}
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <Button onClick={() => navigate('/create-bracket')}>
          Create Bracket
        </Button>
        <Button onClick={() => navigate('/home')}>
          Back to Home
        </Button>
      </div>
    </div>
  );
}

export default MyBrackets;
