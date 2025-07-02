import { useEffect, useState } from 'react';
import '../index.css';

function deduplicateTeams(teams) {
  const map = new Map();
  for (const team of teams) {
    const existing = map.get(team.Name);
    if (!existing || team.Games > existing.Games) {
      map.set(team.Name, team);
    }
  }
  return Array.from(map.values());
}

function Standings() {
  const [rounds, setRounds] = useState([]);
  const [knockoutGames, setKnockoutGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStandings = async () => {
      try {
        setLoading(true);

        // Fetch standings
        const res = await fetch('http://localhost:5000/api/soccer/standings/75/2025');
        if (!res.ok) throw new Error('Failed to fetch standings');
        const data = await res.json();
        setRounds(data);

        // Fetch all games to find knockout stage
        const gamesRes = await fetch('https://api.sportsdata.io/v4/soccer/scores/json/CompetitionDetails/75?key=a092451ea8284793906cb7d7cd8a334d');
        const gamesData = await gamesRes.json();

        const knockouts = gamesData.Games?.filter(game => game.SeasonType === 3) || [];
        setKnockoutGames(knockouts);

        setError('');
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStandings();
    const intervalId = setInterval(fetchStandings, 60000);
    return () => clearInterval(intervalId);
  }, []);

  const groupStage = rounds.find(
    (round) => round.Name === 'Group Stage' && round.Standings?.length > 0
  );

  const groupedStandings = groupStage
    ? groupStage.Standings.reduce((groups, team) => {
        const groupName = team.Group || 'No Group';
        if (!groups[groupName]) groups[groupName] = [];
        groups[groupName].push(team);
        return groups;
      }, {})
    : {};

  const sortedGroups = Object.entries(groupedStandings).sort(([groupA], [groupB]) => {
    const extractLetter = (group) => {
      const match = group.match(/Group\s([A-Z])/i);
      return match ? match[1] : 'Z';
    };
    return extractLetter(groupA).localeCompare(extractLetter(groupB));
  });

  const formatStartTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    date.setHours(date.getHours() - 5); // Adjust for your timezone offset
    return date.toLocaleString([], { dateStyle: 'short', timeStyle: 'short' });
  };

  return (
    <div className="home-container">
      <div className="header">
        <h1>League Standings</h1>
      </div>

      {loading && <p>Loading standings...</p>}
      {error && <p className="text-red-500">Error: {error}</p>}

      {!loading && !error && (
        <>
          {/* Group Stage Standings */}
          {groupStage ? (
            <>
              <h2>{groupStage.Name}</h2>
              {sortedGroups.map(([groupName, teams]) => {
                const uniqueTeams = deduplicateTeams(teams);
                return (
                  <div key={groupName} style={{ marginBottom: '2rem' }}>
                    <h3>{groupName}</h3>
                    <table className="standings-table">
                      <thead>
                        <tr>
                          <th>Position</th>
                          <th>Team</th>
                          <th>Games</th>
                          <th>Wins</th>
                          <th>Losses</th>
                          <th>Draws</th>
                          <th>Goals Scored</th>
                          <th>Goals Against</th>
                          <th>Goal Diff</th>
                          <th>Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueTeams
                          .sort((a, b) => a.Order - b.Order)
                          .map((team, index) => (
                            <tr key={team.TeamId || team.StandingId}>
                              <td>{index + 1}</td>
                              <td>{team.Name}</td>
                              <td>{team.Games}</td>
                              <td>{team.Wins}</td>
                              <td>{team.Losses}</td>
                              <td>{team.Draws}</td>
                              <td>{team.GoalsScored}</td>
                              <td>{team.GoalsAgainst}</td>
                              <td>{team.GoalsDifferential}</td>
                              <td>{team.Points}</td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                );
              })}
            </>
          ) : (
            <p>No group stage standings available.</p>
          )}

          <h2>Knockout Stage Matches</h2>
{knockoutGames.length === 0 ? (
  <p>No knockout games available.</p>
) : (
  <table className="standings-table">
    <thead>
      <tr>
        <th>Date</th>
        <th>Home Team</th>
        <th>Away Team</th>
        <th>Score</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      {knockoutGames.map(game => {
        const homeWin = game.HomeTeamScore > game.AwayTeamScore;
        const awayWin = game.AwayTeamScore > game.HomeTeamScore;

        return (
          <tr key={game.GameId}>
            <td>{formatStartTime(game.DateTime)}</td>
            <td
              style={{
                backgroundColor: homeWin ? 'gold' : undefined,
                fontWeight: homeWin ? 'bold' : undefined,
              }}
            >
              {game.HomeTeamName}
            </td>
            <td
              style={{
                backgroundColor: awayWin ? 'gold' : undefined,
                fontWeight: awayWin ? 'bold' : undefined,
              }}
            >
              {game.AwayTeamName}
            </td>
            <td>
              {game.HomeTeamScore != null && game.AwayTeamScore != null
                ? `${game.HomeTeamScore} - ${game.AwayTeamScore}`
                : '-'}
            </td>
            <td>{game.Status}</td>
          </tr>
        );
      })}
    </tbody>
  </table>
)}

        </>
      )}
    </div>
  );
}

export default Standings;
