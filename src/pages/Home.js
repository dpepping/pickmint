import { useNavigate,} from 'react-router-dom';
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

  const handleMyTeam = () => {
    navigate('/my-team'); // This will navigate to My Brackets screen
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
        <Button onClick={handleMyTeam} className="big-button">My Teams</Button>

        {/* Button for Join League */}
        <Button onClick={() => navigate('/join-league')} className="big-button">Join League</Button>

        {/* Button for Create New League */}
        <Button variant="outline" onClick={() => navigate('/create-league')} className="big-button">Create New League</Button>
      </div>
    </div>
  );
}

export default Home;
