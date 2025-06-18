// src/pages/LeagueDetails.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';

function LeagueDetails() {
  const { leagueCode } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/leagues', {
          headers: { Authorization: `Bearer ${token}` },
        });

        const foundLeague = res.data.find(l => l.code === leagueCode);

        if (foundLeague) {
          setLeague({
            name: foundLeague.name,
            size: foundLeague.participants?.length || 0,
            type: foundLeague.type || 'Private',
            password: leagueCode
          });
        } else {
          setError('League not found');
        }
      } catch (err) {
        console.error(err);
        setError('Error fetching league data');
      }
    };

    fetchLeagueDetails();
  }, [leagueCode]);

  if (error) return <div className="p-6 text-red-600">{error}</div>;
  if (!league) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6">
      <Button onClick={() => navigate('/my-leagues')} className="mb-4">← Back to My Groups</Button>

      <h1 className="text-2xl font-bold">{league.name}</h1>
      <p className="text-gray-600">Group Size: {league.size}</p>
      <p className="text-gray-600">Group Type: {league.type}</p>
      {league.type === 'Private' && (
        <p className="text-gray-600">Password: {league.password}</p>
      )}

      {/* Tabs */}
      <div className="mt-6 flex space-x-6 border-b border-gray-300">
        <button className="pb-2 border-b-2 border-blue-500 font-semibold">Results</button>
        <button className="pb-2 text-gray-500 hover:text-blue-500">Most Picked</button>
      </div>

      {/* Placeholder Table */}
      <div className="mt-4 grid grid-cols-3 font-semibold text-sm text-gray-700">
        <div>Rank</div>
        <div>Bracket Name</div>
        <div>Points</div>
      </div>

      {/* Placeholder rows */}
      <div className="mt-2 grid grid-cols-3 text-sm text-gray-600">
        <div>–</div>
        <div>–</div>
        <div>–</div>
      </div>
    </div>
  );
}

export default LeagueDetails;
