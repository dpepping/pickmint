import React, { useEffect, useState } from 'react';
import axios from 'axios';

const MyLeagues = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('No authentication token found. Please log in.');
          setLoading(false);
          return;
        }

        const response = await axios.get('http://localhost:5000/api/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load user data');
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div style={{ color: 'red' }}>{error}</div>;
  if (!user) return <div>No user data available.</div>;

  return (
    <div>
      <h2>My Leagues</h2>
      {user.leagues && user.leagues.length === 0 ? (
        <p>You are not part of any leagues yet.</p>
      ) : (
        <ul>
          {user.leagues.map((league, idx) => (
            <li key={idx}>
              <strong>{league.name}</strong> (Code: {league.code})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyLeagues;
