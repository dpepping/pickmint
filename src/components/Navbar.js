import { useNavigate } from 'react-router-dom';

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  const goToAccount = () => {
    navigate('/account');
  };

  return (
    <header className="top-navbar">
      <div className="logo">
        <h1>PickMint</h1>
      </div>
      <div className="navbar-actions">
        <div className="search-bar">
          <input type="text" placeholder="Search leagues, teams, matches..." />
          <button><i className="icon-search"></i></button>
        </div>
        <div className="user-profile" onClick={goToAccount} style={{ cursor: 'pointer' }}>
          <img
  src="https://www.gravatar.com/avatar/?d=mp&s=60"
  alt="Default avatar"
  className="account-avatar"
/>
        </div>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
      </div>
    </header>
  );
}

export default Navbar;
