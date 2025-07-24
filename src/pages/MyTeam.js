import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './MyTeam.css';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import '../index.css'

const MyTeams = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/users/me/teams', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeams(response.data.teams);
        setLoading(false);
      } catch (err) {
        setError('Failed to load teams');
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const handleCreateTeam = () => {
    navigate('/create-teams');
  };

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="main-layout">
          <Sidebar />
    <div className="my-teams-container">
      <div className="outer-box">
        <div className="group-box">

          {loading && <p>Loading...</p>}
          {error && <p>{error}</p>}
          {!loading && !error && teams.length === 0 && (
            <p>You have not created any teams yet.</p>
          )}

       <main className="content-area">
                                <section className="my-leagues-section">
    <div className="section-header">
        <h2>My Teams</h2>
        <div className="filters">
            <input type="text" placeholder="Search my teams..." className="search-input" />
            <button className="filter-btn active">All Teams</button>
            <select className="filter-btn sort-by-select">
                <option value="latest">Sort By: Latest</option>
                <option value="points">Sort By: Points</option>
                <option value="alphabetical">Sort By: A-Z</option>
            </select>
        </div>
    </div>
    <div className="leagues-grid">
        {teams.map((team) => (
            <div className="league-card" key={team._id} onClick={() => navigate(`/team/${team._id}`)}>
                <div className="card-header">
                    <h3 className="league-name">{team.name}</h3>
                </div>
                <div className="card-body">
                    {/* Assuming you have a way to display league info for each team */}
                    {team.leagueName && <p className="draft-status">League: {team.leagueName}</p>}
                    <p className="group-size">Total Points: {team.points}</p>
                </div>
                <div className="card-footer">
                    {/* Add a button to navigate to the team page */}
                    <button className="btn-primary go-to-league">Go to Team</button>
                </div>
            </div>
        ))}
    </div>
</section>
                            </main>

      {/* Buttons below the container */}
      <button className="nav-button" onClick={handleCreateTeam}>
        ➕ Create New Team
      </button>
    </div>
    </div>
    </div>
    </div>
    </div>
  );
};

export default MyTeams;
