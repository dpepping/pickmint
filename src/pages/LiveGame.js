import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';

function LiveGame() {
  const { gameId } = useParams();
  const [gameInfo, setGameInfo] = useState(null);
  const [boxscore, setBoxscore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLiveGameData = async () => {
      setLoading(true);
      try {
        const compRes = await fetch('https://api.sportsdata.io/v4/soccer/scores/json/CompetitionDetails/75?key=a092451ea8284793906cb7d7cd8a334d');
        const compData = await compRes.json();
        const game = compData.Games.find(g => g.GameId.toString() === gameId);
        if (!game) {
          setGameInfo(null);
          setBoxscore(null);
          setLoading(false);
          return;
        }
        setGameInfo(game);

        const boxRes = await fetch(`https://api.sportsdata.io/v4/soccer/stats/json/BoxScore/75/${gameId}?key=a092451ea8284793906cb7d7cd8a334d`);
        const boxData = await boxRes.json();
        setBoxscore(boxData[0] || null);
      } catch (error) {
        console.error('Error fetching live game data:', error);
        setGameInfo(null);
        setBoxscore(null);
      }
      setLoading(false);
    };

    fetchLiveGameData();
    const intervalId = setInterval(fetchLiveGameData, 30000);

    return () => clearInterval(intervalId);
  }, [gameId]);

  if (loading) return <p>Loading game data...</p>;
  if (!gameInfo) return <p>No game data available.</p>;

  const homePlayers = boxscore ? boxscore.Lineups.filter(p => p.TeamId === gameInfo.HomeTeamId) : [];
  const awayPlayers = boxscore ? boxscore.Lineups.filter(p => p.TeamId === gameInfo.AwayTeamId) : [];

  // Here: goals array, default empty if no goals data
  const goals = boxscore?.Goals || [];

  return (
    <div>
      <h1>{gameInfo.HomeTeamName} vs {gameInfo.AwayTeamName}</h1>
      <p>Score: {gameInfo.HomeTeamScore} - {gameInfo.AwayTeamScore}</p>
      <p>Minute: {gameInfo.ClockDisplay}′</p>

      <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: '2rem' }}>
        {/* Home Team Lineup */}
        <div>
          <h2>{gameInfo.HomeTeamName} Lineup</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {homePlayers.map(player => (
                <tr key={player.PlayerId}>
                  <td>{player.Name}</td>
                  <td>{player.Position}</td>
                  <td>{player.GameMinute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Away Team Lineup */}
        <div>
          <h2>{gameInfo.AwayTeamName} Lineup</h2>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Position</th>
                <th>Minutes</th>
              </tr>
            </thead>
            <tbody>
              {awayPlayers.map(player => (
                <tr key={player.PlayerId}>
                  <td>{player.Name}</td>
                  <td>{player.Position}</td>
                  <td>{player.GameMinute}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Goals Section */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Goals & Assists</h2>
        {goals.length === 0 && <p>No goals scored yet.</p>}
        <ol>
          {goals.map((goal, index) => (
            <li key={goal.GoalId} style={{ marginBottom: '1rem' }}>
              <strong>Goal {index + 1}:</strong> {goal.Name} ({goal.Type === 'OwnGoal' ? 'Own Goal' : 'Goal'}) at {goal.GameMinute}′
              <br />
              { (goal.AssistedByPlayerName1 && goal.AssistedByPlayerName1 !== 'Scrambled') && (
                <span>
                  Assist 1: {goal.AssistedByPlayerName1}
                </span>
              )}
              { (goal.AssistedByPlayerName2 && goal.AssistedByPlayerName2 !== 'Scrambled') && (
                <span>
                  {goal.AssistedByPlayerName1 && goal.AssistedByPlayerName1 !== 'Scrambled' ? ', ' : ''}
                  Assist 2: {goal.AssistedByPlayerName2}
                </span>
              )}
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

export default LiveGame;
