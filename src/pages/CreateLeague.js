import React, { useState} from 'react';
import axios from 'axios';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';
import './CreateLeague.css'

const CreateLeague = () => {
  const [leagueName, setLeagueName] = useState('');
  const [code, setCode] = useState('');
  const [groupSize, setGroupSize] = useState('');



  // Function to generate a 6-character alphanumeric league code
  const generateLeagueCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let generated = '';
    for (let i = 0; i < 6; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return generated;
  };

  const handleCreateLeague = async () => {
  const generatedCode = generateLeagueCode();
  const token = localStorage.getItem('token');

  if (!leagueName || !groupSize) {
    return alert('Please enter both league name and group size.');
  }

  try {
    const { data } = await axios.post(
      'http://localhost:5000/api/league/create',
      {
        name: leagueName,
        code: generatedCode,
        groupSize: parseInt(groupSize),  // Ensure it's a number
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );
    setCode(generatedCode);
    console.log(data);
  } catch (error) {
    alert(error.response?.data?.message || 'Failed to create league');
  }
};

  return (
      <div className="dashboard-container">
        <Navbar />
        <div className="main-layout">
          <Sidebar />
          <main class="content-area">
                <div id='joinleaguediv'>
                <section class="join-league-section">
                    <h2>Create a League</h2>
                    <p class="instruction-text">Enter the league name and the maximum amount of people that can join the league.</p>

                    <div class="join-form-card card">
                        <div class="form-group">
                            <label for="leagueCodeInput" class="form-label">League Name</label>
                            <input type="text" placeholder="League Name" class="form-input" value={leagueName} onChange={(e) => setLeagueName(e.target.value)}/>
                        </div>
                        <div class="form-group">
                            <label for="leagueCodeInput" class="form-label">Max Participants</label>
                            <input type="number" placeholder="Max Group Size" class="form-input" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} style={{ marginTop: '10px' }}/>
                        </div>
                        <button id="joinLeagueBtn" class="btn-accent" onClick={handleCreateLeague}>Create League</button>
                              {code && (
                              <p>Your league code: <strong>{code}</strong></p>
                                )}
                        <div id="messageArea" class="message-area">
                            {/* <!-- Success or error messages will appear here --> */}
                        </div>
                    </div>
                </section>
                </div>
                </main>
    <div>
    </div>
    </div>
    </div>
  );
};

export default CreateLeague;
