import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/ui/Button';
import axios from 'axios';
import './LeagueDetails.css';

function LeagueDetails() {
  const { leagueCode } = useParams();
  const navigate = useNavigate();
  const [league, setLeague] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [draftTimeInput, setDraftTimeInput] = useState('');
  const [editingDraft, setEditingDraft] = useState(false);
  const [currentUser, setCurrentUser] = useState('');
  const [countdown, setCountdown] = useState('');
  const [showEnterDraft, setShowEnterDraft] = useState(false);

  useEffect(() => {
    const fetchLeagueDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/league?code=${leagueCode}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = res.data;
        setLeague({
          name: data.name,
          size: data.groupSize,
          type: data.groupType || 'Private',
          password: data.groupPassword,
          participants: data.participants || [],
          owner: data.owner,
          draftTime: data.draftTime || null,
        });
      } catch (err) {
        console.error(err);
        setError('Error fetching league data');
      }
    };

    const getCurrentUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`http://localhost:5000/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUser(res.data.username);
      } catch (err) {
        console.error(err);
      }
    };

    fetchLeagueDetails();
    getCurrentUser();
  }, [leagueCode]);

  useEffect(() => {
    if (!league?.draftTime) {
      setShowEnterDraft(false);
      setCountdown('');
      return;
    }

    const updateCountdown = () => {
      const draftDate = new Date(league.draftTime).getTime();
      const now = Date.now();
      const diff = draftDate - now;

      if (diff <= 0) {
        setCountdown('Draft is starting now!');
        setShowEnterDraft(true);
      } else {
        setShowEnterDraft(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        setCountdown(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [league?.draftTime]);

  const handleDeleteLeague = async () => {
    if (!window.confirm(`Delete the league "${league?.name}"? This cannot be undone.`)) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/league/${leagueCode}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('League deleted successfully');
      navigate('/my-leagues');
    } catch (err) {
      console.error(err);
      setMessage('Failed to delete league');
    }
  };

  const handleScheduleDraft = async () => {
    if (!draftTimeInput) return alert('Enter draft time');

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/league/${leagueCode}/schedule-draft`,
        { draftTime: draftTimeInput },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLeague({ ...league, draftTime: draftTimeInput });
      setDraftTimeInput('');
      setEditingDraft(false);
      alert('Draft scheduled successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to schedule draft');
    }
  };

  const isOwner = currentUser === league?.owner;

  if (error) return <div className="league-container"><p className="error-text">{error}</p></div>;
  if (!league) return <div className="league-container"><p>Loading...</p></div>;

  return (
    <div className="league-container">
      <div className="league-box">

        {/* ENTER DRAFT BUTTON */}
        {showEnterDraft && (
          <button
            onClick={() => navigate('/draftpage/'+leagueCode)}
            style={{
              padding: '1rem',
              marginBottom: '1rem',
              backgroundColor: '#fffae6',
              border: '2px solid #ffd700',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: '1.3rem',
              textAlign: 'center',
              color: '#b8860b',
              cursor: 'pointer',
              userSelect: 'none',
              width: '100%',
              borderWidth: '3px',
            }}
            title="Click to enter the draft"
            type="button"
          >
            Enter Draft
          </button>
        )}

        {league.draftTime && (
          <div style={{ marginBottom: '1rem', fontSize: '1.2rem', fontWeight: 'bold', color: 'green' }}>
            Draft Countdown: {countdown}
          </div>
        )}

        <Button onClick={() => navigate('/my-leagues')} className="back-btn">
          ← Back to My Groups
        </Button>

        <h1 className="league-title">{league.name}</h1>

<p className="league-info">
  Group Size: {league.participants.length} / {league.size}
</p>

<p className="league-info">
  Password: {leagueCode}
</p>


        <h2 className="participants-title">Participants</h2>
        {league.participants.length > 0 ? (
          <ul className="participants-list">
            {league.participants.map((p, idx) => (
              <li key={idx} className="participant-item">
                <div className="participant-name">
                  {p.firstName} {p.lastName} ({p.email})
                </div>
                {p.teams.length > 0 ? (
                  <ul className="team-list">
                    {p.teams.map((team, i) => (
                      <li
                        key={i}
                        className="team-item clickable"
                        onClick={() => navigate(`/league/${leagueCode}/team/${team._id}`)}
                        style={{ cursor: 'pointer', color: 'blue', textDecoration: 'underline' }}
                      >
                        Team: {team.name} ({team.points} pts)
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="participant-team">No team</div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-participants">No participants yet.</p>
        )}

        {league.draftTime && (
          <p className="league-info">
            <strong>Draft Time:</strong> {new Date(league.draftTime).toLocaleString()}
          </p>
        )}

        {isOwner && (
          <>
            {league.draftTime && !editingDraft && (
              <Button onClick={() => {
                setEditingDraft(true);
                setDraftTimeInput(league.draftTime.slice(0, 16));
              }} style={{ marginTop: '1rem' }}>
                Edit Draft Time
              </Button>
            )}

            {(!league.draftTime || editingDraft) && (
              <>
                <input
                  type="datetime-local"
                  value={draftTimeInput}
                  onChange={(e) => setDraftTimeInput(e.target.value)}
                  style={{ marginTop: '1rem' }}
                />
                <Button onClick={handleScheduleDraft} style={{ marginLeft: '1rem' }}>
                  {league.draftTime ? 'Update Draft Time' : 'Schedule Draft'}
                </Button>
              </>
            )}
          </>
        )}

        {message && <p className="error-text" style={{ marginTop: '1rem' }}>{message}</p>}

        {isOwner && (
          <Button
            className="delete-btn"
            onClick={handleDeleteLeague}
            style={{ backgroundColor: 'red', color: 'white', marginTop: '2rem' }}
          >
            Delete League
          </Button>
        )}
      </div>
    </div>
  );
}

export default LeagueDetails;
