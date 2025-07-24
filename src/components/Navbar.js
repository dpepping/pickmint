import { useNavigate } from 'react-router-dom';

function Navbar(){

    const navigate = useNavigate();

    const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

return(
    <header className="top-navbar">
        <div className="logo">
          <h1>PickMint</h1>
        </div>
        <div className="navbar-actions">
          <div className="search-bar">
            <input type="text" placeholder="Search leagues, teams, matches..." />
            <button><i className="icon-search"></i></button>
          </div>
          <div className="user-profile">
            <img src="user-avatar.jpg" alt="User Avatar" className="avatar" />
            <button onClick={handleLogout} className="logout-btn">Logout</button>
          </div>
        </div>
      </header>
)
}

export default Navbar;