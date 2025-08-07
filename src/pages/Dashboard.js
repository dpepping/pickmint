import React, { useState, useEffect } from 'react'; // Import useState and useEffect
import '../index.css'; // Make sure this file exists and is correctly scoped
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import { useNavigate } from 'react-router-dom';


const Dashboard = () => {
  // State to hold fetched dashboard data
  const [dashboardData, setDashboardData] = useState(null);
  // State for loading status
  const [loading, setLoading] = useState(true);
  // State for any errors during data fetching
  const [error, setError] = useState(null);
  // State for the user's name, initialized with a placeholder
  const [userName, setUserName] = useState('[User\'s Name]');
  const navigate = useNavigate();


  // useEffect hook to fetch data when the component mounts
  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true); // Set loading to true before fetching
      setError(null);   // Clear any previous errors

      try {
        // --- Authentication Token Retrieval ---
        // Assuming your JWT token is stored in localStorage after login.
        // Adjust this if you're using Context API or another method.
        const token = localStorage.getItem('token');

        if (!token) {
          setError('Authentication token not found. Please log in.');
          setLoading(false);
          // Optional: Redirect to login page here if no token is found
          // Example: history.push('/login'); (if using react-router-dom v5)
          // or navigate('/login'); (if using react-router-dom v6's useNavigate)
          return;
        }

        // --- Fetch Request to your Backend API ---
        // Use the /api/users/dashboard-data endpoint, which should be proxied
        // by your frontend dev server to http://localhost:5000/api/users/dashboard-data
        const res = await fetch('/api/users/dashboard-data', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // IMPORTANT: Send the JWT token
          }
        });

        // --- Handle HTTP Responses ---
        if (!res.ok) {
          // If the response is not OK (e.g., 401 Unauthorized, 403 Forbidden, 500 Internal Server Error)
          const errorData = await res.json(); // Attempt to parse error message from body

          if (res.status === 401 || res.status === 403) {
            // Specific handling for authentication failures
            localStorage.removeItem('token'); // Clear invalid token
            setError(`Authentication failed: ${errorData.message || 'Please log in again.'}`);
            // Optional: Redirect to login page
          } else {
            // General error handling for other HTTP status codes
            setError(errorData.message || `Failed to fetch dashboard data: ${res.statusText}`);
          }
          setLoading(false); // Stop loading regardless of error
          return; // Stop execution
        }

        // --- Process Successful Response ---
        const data = await res.json();
        setDashboardData(data); // Store the fetched data in state
        setUserName(data.user?.name || '[User\'s Name]'); // Set user name from fetched data

      } catch (err) {
        // --- Handle Network Errors or Unexpected Issues ---
        console.error("Error fetching dashboard data:", err);
        setError('Network error or unexpected issue. Please try again.');
      } finally {
        setLoading(false); // Always set loading to false after fetch attempt
      }
    };

    fetchDashboardData(); // Call the async function
  }, []); // Empty dependency array means this effect runs only once after the initial render

  // --- Conditional Rendering based on State ---

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar/>
        <div className="main-layout">
          <Sidebar/>
          <main className="content-area">
            <p>Loading dashboard data...</p> {/* Display loading message */}
          </main>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <Navbar/>
        <div className="main-layout">
          <Sidebar/>
          <main className="content-area">
            <p className="error-message">Error: {error}</p> {/* Display error message */}
            {/* You could add a "Retry" button here */}
          </main>
        </div>
      </div>
    );
  }

  // --- Render the Dashboard Content (if data is successfully loaded) ---
  return (
    <div className="dashboard-container">
      <Navbar/>
      <div className="main-layout">
        <Sidebar/>

        <main className="content-area">
          <section className="welcome-banner card">
            <h2>Welcome back, {userName}!</h2> {/* Dynamic user name */}
            <div className="quick-stats">
              <div className="stat-card">
                <span>Active Leagues</span>
                {/* Use optional chaining (?.) and provide fallback for data */}
                <strong>{dashboardData?.stats?.activeLeagues || 'N/A'}</strong>
              </div>
              <div className="stat-card">
                <span>Total Teams</span>
                <strong>{dashboardData?.stats?.totalTeams || 'N/A'}</strong>
              </div>
              <div className="stat-card">
                <span>Upcoming Matches</span>
                <strong>{dashboardData?.stats?.upcomingMatches || 'N/A'}</strong>
              </div>
            </div>
          </section>

          <section className="today-matches card">
            <h3>Today's Matches</h3>
            <div className="matches-list">
              {/* Conditionally render matches or "No games today" message */}
              {dashboardData?.todayMatches?.length > 0 ? (
                dashboardData.todayMatches.map(match => (
                  // Assuming your match objects have a unique 'id' and 'details' property
                  <p key={match.id || Math.random()}>{match.details}</p>
                ))
              ) : (
                <p className="no-matches">No games today. Check back later!</p>
              )}
            </div>
          </section>

          <section className="active-leagues">
            <h3>Your Active Leagues</h3>
            <div className="leagues-grid">
              {/* Conditionally render leagues or "No active leagues" message */}
              {dashboardData?.activeLeagues?.length > 0 ? (
                dashboardData.activeLeagues.map(league => (
                  // Assuming league objects have unique 'id', 'name', 'rank', 'nextMatch'
                  <div className="league-card card" key={league.id || Math.random()}>
                    <h4>{league.name}</h4>
                    <p>Your Rank: <strong>#{league.rank}</strong></p>
                    <p>Next Match: {league.nextMatch}</p>
                    <button className="btn-primary" onClick={() => navigate(`/league/${league.code}`)}
                      >Go to League</button>
                  </div>
                ))
              ) : (
                <p>No active leagues found.</p>
              )}
            </div>
          </section>

          <section className="quick-actions">
            <div className="action-card card">
              <h4>Join a New League</h4>
              <p>Join with friends using an already proided league code.</p>
              <a href='/join-league'><button className="btn-accent">Join League</button></a>
            </div>
            <div className="action-card card">
              <h4>Create Your Own League</h4>
              <p>Invite friends and set your own rules.</p>
              <a href='create-league'><button className="btn-accent">Start New League</button></a>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;