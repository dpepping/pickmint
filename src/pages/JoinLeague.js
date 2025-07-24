import React, { useState} from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './JoinLeague.css'


const JoinLeague = () => {
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');

  const handleJoinLeague = async () => {
  try {
    const token = localStorage.getItem('token'); // ✅ Get token
    if (!token) {
      setMessage('No token found');
      return;
    }

    const response = await axios.post(
      //'https://pickmint-fb40314ffafe.herokuapp.com/api/league/join',
      'http://localhost:5000/api/league/join',
      { code }, // No need to send userEmail — backend gets it from token
      { headers: { Authorization: `Bearer ${token}` } } // ✅ Add token to headers
    );

    setMessage(response.data.message);
  } catch (error) {
    console.error('Join League Error:', error);
    setMessage(error.response?.data?.message || 'Failed to join league');
  }
};

  return (

  <div className="dashboard-container">
      <Navbar />
      <div className="main-layout">
        <Sidebar />
          <div>
            <main class="content-area">
                <div id='joinleaguediv'>
                <section class="join-league-section">
                    <h2>Join a League</h2>
                    <p class="instruction-text">Enter the league code provided by your league commissioner to join an existing league.</p>

                    <div class="join-form-card card">
                        <div class="form-group">
                            <label for="leagueCodeInput" class="form-label">League Code</label>
                            <input type="text" id="leagueCodeInput" class="form-input" placeholder="e.g., ABC123XYZ"value={code} onChange={(e) => setCode(e.target.value)} autocomplete="off"/>
                        </div>
                        <button id="joinLeagueBtn" class="btn-accent" onClick={handleJoinLeague}>Join League</button>
                        {message && <p>{message}</p>}
                        <div id="messageArea" class="message-area">
                            {/* <!-- Success or error messages will appear here --> */}
                        </div>
                    </div>
                </section>
                </div>
                </main>
          </div>
        </div>
      </div>
  );
};

export default JoinLeague;
