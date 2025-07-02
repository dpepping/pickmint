import React, { useEffect, useState } from 'react';
import './DraftPage.css';  // Import the CSS file

function TeamsWithPlayers() {
  const [teamsWithPlayers, setTeamsWithPlayers] = useState({});
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const PLAYER_STATS_API = 'https://api.sportsdata.io/v4/soccer/stats/json/PlayerSeasonStats/75/2025?key=a092451ea8284793906cb7d7cd8a334d';

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch(PLAYER_STATS_API);
        if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);

        const data = await res.json();

        const playerSeasons = data[0]?.PlayerSeasons || [];

        // Group players by team as before
        const grouped = playerSeasons.reduce((acc, player) => {
          if (!player.Team) return acc;

          if (!acc[player.Team]) acc[player.Team] = [];
          acc[player.Team].push({
            name: player.Name,
            position: player.Position,
            fantasyPoints: player.FantasyPoints,
            goals: player.Goals,
            assists: player.Assists,
            tackles: player.Tackles,
            saves: player.GoalkeeperSaves,
            passes: player.Passes,
          });
          return acc;
        }, {});

        // Calculate top 10 players overall (sorted descending by fantasyPoints)
        const sortedTop10 = playerSeasons
          .filter(p => p.FantasyPoints != null)
          .sort((a, b) => b.FantasyPoints - a.FantasyPoints)
          .slice(0, 10)
          .map(p => ({
            name: p.Name,
            team: p.Team,
            position: p.Position,
            fantasyPoints: p.FantasyPoints,
            goals: p.Goals,
            assists: p.Assists,
            tackles: p.Tackles,
            saves: p.GoalkeeperSaves,
            passes: p.Passes,
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

  if (loading) return <p className="loading">Loading player stats...</p>;
  if (error) return <p className="error">{error}</p>;

  return (
    <div className="container">
      <h1>Top 10 Players by Fantasy Points</h1>
      <ol className="top-player-list">
        {topPlayers.map((p, i) => (
          <li key={i} className="top-player-item">
            <strong>{i + 1}.</strong> {p.name} ({p.position}) — {p.team} — Fantasy Points: {p.fantasyPoints.toFixed(1)}
          </li>
        ))}
      </ol>

      <h1>Player Stats by Team</h1>
      {Object.entries(teamsWithPlayers).map(([team, players]) => (
        <div key={team} className="team">
          <h2 className="team-name">{team}</h2>
          <ul className="player-list">
            {players
              .slice() // create a shallow copy so we don’t mutate original
              .sort((a, b) => (b.fantasyPoints || 0) - (a.fantasyPoints || 0)) // sort descending
              .map((p, i) => (
                <li key={i} className="player-item">
                  <div className="player-name">{p.name} ({p.position})</div>
                  <div className="player-stats">
                    <span>Fantasy Points: {p.fantasyPoints}</span>
                    <span>Goals: {p.goals}</span>
                    <span>Assists: {p.assists}</span>
                    <span>Tackles: {p.tackles}</span>
                    <span>Saves: {p.saves}</span>
                    <span>Passes: {p.passes}</span>
                  </div>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export default TeamsWithPlayers;
