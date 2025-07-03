import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './DraftPage.css';

function TeamsWithPlayers() {
  const [teamsWithPlayers, setTeamsWithPlayers] = useState({});
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingPlayerId, setCreatingPlayerId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [userTeams, setUserTeams] = useState([]); // store user's teams

  // Fetch user's teams on mount
  useEffect(() => {
    async function fetchUserTeams() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in.');
          setLoading(false);
          return;
        }
        const res = await axios.get('http://localhost:5000/api/users/me/teams', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserTeams(res.data.teams || []);
      } catch (err) {
        console.error('Failed to fetch user teams:', err);
        setError('Failed to fetch user teams.');
      }
    }
    fetchUserTeams();
  }, []);

  // Fetch players from external API (unchanged)
  useEffect(() => {
    async function fetchData() {
      try {
        const API_KEY = 'c633d833084c488e8606ed07120d30b3';
        const PLAYER_STATS_API = `https://api.sportsdata.io/v3/cbb/stats/json/PlayerSeasonStats/2025?key=${API_KEY}`;
        const res = await fetch(PLAYER_STATS_API);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
        const data = await res.json();

        if (!data || !Array.isArray(data)) {
          throw new Error('Invalid data format received.');
        }

        // Group players by team (optional)
        const grouped = data.reduce((acc, player) => {
          const team = player.Team || 'Unknown';
          if (!acc[team]) acc[team] = [];
          acc[team].push({
            name: player.Name,
            position: player.Position,
            fantasyPoints: player.FantasyPoints,
            games: player.Games,
            points: player.Points,
            rebounds: player.Rebounds,
            assists: player.Assists,
            steals: player.Steals,
            blocks: player.BlockedShots,
            PlayerID: player.PlayerID,
          });
          return acc;
        }, {});

        // Top 10 players overall
        const sortedTop10 = data
          .filter(p => p.FantasyPoints != null)
          .sort((a, b) => b.FantasyPoints - a.FantasyPoints)
          .slice(0, 10)
          .map(p => ({
            name: p.Name,
            PlayerID: p.PlayerID,
            team: p.Team,
            position: p.Position,
            fantasyPoints: p.FantasyPoints,
            games: p.Games,
            points: p.Points,
            rebounds: p.Rebounds,
            assists: p.Assists,
            steals: p.Steals,
            blocks: p.BlockedShots,
          }));

        setTeamsWithPlayers(grouped);
        setTopPlayers(sortedTop10);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Error fetching data.');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Function to draft player to a team
  async function createPlayer(name, PlayerID) {
  const token = localStorage.getItem('token');
  if (!token) {
    setError('You must be logged in.');
    return;
  }
  if (userTeams.length === 0) {
    setError('You have no teams to draft players to.');
    return;
  }
  setError('');
  setSuccessMsg('');
  setCreatingPlayerId(PlayerID);

  const teamId = userTeams[0]._id;
  const leagueCode = userTeams[0].leagueCodes[0];  // Assuming leagueCodes is an array

  try {
    const res = await axios.post(
      `http://localhost:5000/api/team/${teamId}/draft-player`,
      { name, PlayerID, leagueCode },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    console.log('✅ Player drafted:', res.data);
    setSuccessMsg(`Player "${name}" drafted successfully!`);
  } catch (err) {
    console.error('❌ Failed to draft player:', err);
    setError('Failed to draft player. Try again.');
  } finally {
    setCreatingPlayerId(null);
  }
}


  if (loading) return <p className="loading">Loading player stats...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="container">
      <h1>🏀 Players by Fantasy Points</h1>

      {successMsg && <p className="success-message">{successMsg}</p>}
      {error && <p className="error-message">{error}</p>}

      <ol className="top-player-list">
        {topPlayers.map((p, i) => (
          <li key={i} className="top-player-item">
            {p.name} ({p.position}) — {p.team}
            <button
              disabled={creatingPlayerId === p.PlayerID}
              onClick={() => createPlayer(p.name, p.PlayerID)}
            >
              {creatingPlayerId === p.PlayerID ? 'Drafting...' : 'Draft Player'}
            </button>

            <div className="player-stats">
              <span>Fantasy Points: {p.fantasyPoints}</span>
              <span>Games: {p.games}</span>
              <span>Points: {p.points}</span>
              <span>Rebounds: {p.rebounds}</span>
              <span>Assists: {p.assists}</span>
              <span>Steals: {p.steals}</span>
              <span>Blocks: {p.blocks}</span>
              <span>PlayerID: {p.PlayerID}</span>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default TeamsWithPlayers;
