import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Button from '../components/ui/Button';
import '../index.css';

function Home() {
  const navigate = useNavigate();
  const [todayGames, setTodayGames] = useState([]);
  const [loading, setLoading] = useState(true);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleMyLeagues = () => navigate('/my-leagues');
  const handleMyTeam = () => navigate('/my-team');
  const handleStandings = () => navigate('/standings');

  useEffect(() => {
  const fetchTodayGames = async () => {
    try {
      setLoading(true);
      const res = await fetch('https://api.sportsdata.io/v4/soccer/scores/json/CompetitionDetails/75?key=a092451ea8284793906cb7d7cd8a334d');
      const data = await res.json();

      const now = new Date();
      const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

      const gamesToday = data.Games?.filter(game => {
        if (!game.DateTime) return false;

        const gameDate = new Date(game.DateTime);
        gameDate.setHours(gameDate.getHours() - 5); // Subtract 5 hours to convert UTC to your timezone

        const adjustedDate = `${gameDate.getFullYear()}-${String(gameDate.getMonth() + 1).padStart(2, '0')}-${String(gameDate.getDate()).padStart(2, '0')}`;

        return adjustedDate === localToday;
      }) || [];

      setTodayGames(gamesToday);
    } catch (err) {
      console.error('Error fetching today games:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchTodayGames();
  //const intervalId = setInterval(fetchTodayGames, 60000);
  //return () => clearInterval(intervalId);
}, []);



  const formatStartTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  date.setHours(date.getHours() - 5); // Convert UTC to your timezone
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};


  return (

    
    <div className="home-container">
      <Button onClick={handleLogout} className="nav-button logout-button" variant="outline">
        Logout
      </Button>

      <div className="header">
        <h1>Welcome to PickMint</h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: '2rem', marginTop: '2rem' }}>
        
        {/* Left - Buttons */}
        <div>
          <div className="buttons-container">
            <Button onClick={handleMyLeagues} className="big-button">My Leagues</Button>
            <Button onClick={handleMyTeam} className="big-button">My Teams</Button>
            <Button onClick={() => navigate('/join-league')} className="big-button">Join League</Button>
            <Button variant="outline" onClick={() => navigate('/create-league')} className="big-button">Create New League</Button>
            <Button onClick={handleStandings} className="big-button">March Madness Bracket</Button>
          </div>
        </div>

        {/* Right - Today's Matches */}
        <div style={{ width: '300px', backgroundColor: '#f5f5f5', padding: '1rem', borderRadius: '8px', boxShadow: '0 0 8px rgba(0,0,0,0.1)' }}>
          <h2>Today's Matches</h2>
          {loading && <p>Loading games...</p>}
          {todayGames.length === 0 && !loading && <p>No games today.</p>}
          {todayGames.map(game => (
            <div
              key={game.GameId}
              onClick={() => navigate(`/live-game/${game.GameId}`)}
              style={{
                marginBottom: '1rem',
                padding: '0.5rem',
                backgroundColor: '#fff',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              <strong>{game.HomeTeamName} vs {game.AwayTeamName}</strong>
              <p>Score: {game.HomeTeamScore} - {game.AwayTeamScore}</p>
              {game.Status === 'InProgress' || game.Status === 'Break' ? (
                <p>Minute: {game.ClockDisplay}′</p>
              ) : (
                <p>Starts at: {formatStartTime(game.DateTime)}</p>
              )}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

export default Home;
