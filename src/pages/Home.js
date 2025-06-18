import { useNavigate, Link } from 'react-router-dom';
import Button from '../components/ui/Button';
import '../index.css';

function Home() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const handleMyLeagues = () => {
    navigate('/my-leagues'); // This will navigate to My Leagues screen
  };

  const handleMyBrackets = () => {
    navigate('/my-brackets'); // This will navigate to My Brackets screen
  };

  return (
    <div className="home-container">
      {/* Logout Button at the top right */}
      <Button onClick={handleLogout} className="nav-button logout-button" variant="outline">Logout</Button>

      <div className="header">
        <h1>Welcome to PickMint</h1>
      </div>

      <div className="buttons-container">
        {/* Button for My Leagues */}
        <Button onClick={handleMyLeagues} className="big-button">My Leagues</Button>
        
        {/* Button for My Brackets */}
        <Button onClick={handleMyBrackets} className="big-button">My Brackets</Button>

        {/* Button for Join League */}
        <Button onClick={() => navigate('/join-league')} className="big-button">Join League</Button>

        {/* Button for Create New League */}
        <Button variant="outline" onClick={() => navigate('/create-league')} className="big-button">Create New League</Button>
      </div>

      <div className="navigation-buttons">
        <Link to="/draft">
          <Button className="nav-button">Go to Draft</Button>
        </Link>
        <Link to="/leaderboard">
          <Button className="nav-button">Go to Leaderboard</Button>
        </Link>
      </div>
    </div>
  );
}

export default Home;
