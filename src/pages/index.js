import React from 'react';
import '../index.css'; // Make sure this file exists and is correctly scoped
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <Navbar/>
      <div className="main-layout">
        <Sidebar/>

        <main className="content-area">
          <section className="welcome-banner card">
            <h2>Welcome back, [User's Name]!</h2>
            <div className="quick-stats">
              <div className="stat-card">
                <span>Active Leagues</span>
                <strong>5</strong>
              </div>
              <div className="stat-card">
                <span>Total Teams</span>
                <strong>2</strong>
              </div>
              <div className="stat-card">
                <span>Upcoming Matches</span>
                <strong>3</strong>
              </div>
            </div>
          </section>

          <section className="today-matches card">
            <h3>Today's Matches</h3>
            <div className="matches-list">
              <p className="no-matches">No games today. Check back later!</p>
            </div>
          </section>

          <section className="active-leagues">
            <h3>Your Active Leagues</h3>
            <div className="leagues-grid">
              <div className="league-card card">
                <h4>PickMint Pro League</h4>
                <p>Your Rank: <strong>#5</strong></p>
                <p>Next Match: Jul 25, 6:00 PM</p>
                <button className="btn-primary">Go to League</button>
              </div>
              <div className="league-card card">
                <h4>Friendly Friday Cup</h4>
                <p>Your Rank: <strong>#1</strong></p>
                <p>Next Match: Jul 26, 7:30 PM</p>
                <button className="btn-primary">Go to League</button>
              </div>
            </div>
          </section>

          <section className="quick-actions">
            <div className="action-card card">
              <h4>Join a New League</h4>
              <p>Discover exciting competitions and challenge yourself!</p>
              <button className="btn-accent">Browse Open Leagues</button>
            </div>
            <div className="action-card card">
              <h4>Create Your Own League</h4>
              <p>Invite friends and set your own rules.</p>
              <button className="btn-accent">Start New League</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
