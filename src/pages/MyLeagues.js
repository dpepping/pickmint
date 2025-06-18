import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import './MyLeagues.css';
import { Link } from 'react-router-dom';

function MyLeagues() {
  const [leagues, setLeagues] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
  const fetchLeagues = async () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('No token found');
      return;
    }

    const res = await axios.get('http://localhost:5000/api/user/leagues', {
      headers: { Authorization: `Bearer ${token}` }, // Fix the backticks!
    });

    setLeagues(res.data.leagues || []); // No need for additional mapping
  } catch (error) {
    console.error('❌ Error fetching leagues:', error.response ? error.response.data : error);
    setError('Error fetching leagues');
  }
};


  fetchLeagues();
}, []);




  

  return (
    <div className="my-leagues-container">
      <h1>My Leagues</h1>

      {error && <p>{error}</p>}

      {/* Outer big box */}
      <div className="outer-box">
        {/* Group box */}
        <div className="group-box">
          <h2>Groups</h2>

          {/* Smaller box with leagues */}
          <div className="leagues-box">
            <h3>My Groups</h3>

            {/* League list */}
            {leagues.length > 0 ? (
              <div className="league-list">
                {leagues.map((league, index) => (
                  <div key={index} className="league-item">
                    <div className="league-header">
                      {/* Link the league name */}
                      <Link
                        to={`/league/${league.code}`} // Link to LeagueDetails page
                        className="text-lg font-bold text-blue-600 hover:underline"
                      >
                        {league.name}
                      </Link>
                      <span className="text-sm text-gray-600">Password: {league.code}</span>
                    </div>

                    {/* Group size beneath name */}
                    <div className="group-size">Group Size: {league.groupSize || 0}</div>


                    {/* Rank, Bracket Name, Points Table */}
                    <div className="league-stats">
                      <div className="league-stats-header">
                        <span>Rank</span>
                        <span>Bracket Name</span>
                        <span>Points</span>
                      </div>
                      {league.teams?.map((team, idx) => (
                        <div key={idx} className="league-stats-row">
                            <span>{team.rank || 'N/A'}</span>
                            <span>{team.bracketName || 'N/A'}</span>
                            <span>{team.points || '0'}</span>
                      </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p>You are not a part of any leagues yet.</p>
            )}
          </div>
        </div>
      </div>

      <Button onClick={() => navigate('/home')} className="nav-button">
        Back to Home
      </Button>
    </div>
  );
}

export default MyLeagues;
