// src/pages/DraftPage.js
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import './DraftPage.css';

const socket = io('http://localhost:5000');

function DraftPage() {
  const { leagueCode: paramLeagueCode } = useParams();

  const [teamsWithPlayers, setTeamsWithPlayers] = useState({});
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const navigate = useNavigate();
  const [topPlayers, setTopPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creatingPlayerId, setCreatingPlayerId] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [userTeams, setUserTeams] = useState([]);
  const [draftedPlayersByLeague, setDraftedPlayersByLeague] = useState({});
  const [recentlyPickedPlayer, setRecentlyPickedPlayer] = useState('');
  const [draftOrder, setDraftOrder] = useState([]);
  const [currentPickIndex, setCurrentPickIndex] = useState(0);
  const [allLeagueTeams, setAllLeagueTeams] = useState([]);
  const [draftHistory, setDraftHistory] = useState([]); 
  const [pickHistory, setPickHistory] = useState([]); // ⬅️ NEW
  const ROSTER_SLOTS = [
  'G', 'G', 'F', 'F', 'C',       // Starting 5
  'FLEX1', 'FLEX2', 'FLEX3',         // 3 flex
  'BENCH1', 'BENCH2', 'BENCH3', 'BENCH4', 'BENCH5', 'BENCH6'  // Bench 6
];
const [teamRosters, setTeamRosters] = useState({}); // { teamId: { slot: playerObject or null } }


// Number of rounds per draft
const totalRounds = 14;

// Build full draft array using snake order
const fullDraftOrder = [];
for (let round = 0; round < totalRounds; round++) {
  const roundOrder = round % 2 === 0 ? draftOrder : [...draftOrder].reverse();
  fullDraftOrder.push(...roundOrder);
}



  // Use leagueCode from URL param as initial activeLeagueCode
  const [activeLeagueCode, setActiveLeagueCode] = useState(paramLeagueCode || null);

  const myTeam = userTeams.find(team => team.leagueCode === activeLeagueCode);

useEffect(() => {
  if (myTeam?._id) {
    setSelectedTeamId(myTeam._id);
  }
}, [myTeam]);
  // Listen for real-time player draft updates
    useEffect(() => {
  function onPlayerDrafted({ playerId, name, leagueCode, teamId }) {
    if (!leagueCode) return;
    if (leagueCode !== activeLeagueCode) return;

    setDraftedPlayersByLeague(prev => ({
      ...prev,
      [leagueCode]: [...(prev[leagueCode] || []), playerId.toString()]
    }));

    setRecentlyPickedPlayer(`${name} was drafted!`);
    setTimeout(() => setRecentlyPickedPlayer(''), 3000);

    if (!teamId) {
      console.warn('No teamId provided in playerDrafted event');
      return;
    }

    setTeamRosters(prev => {
      const teamRoster = prev[teamId] || {};
      const emptySlot = ROSTER_SLOTS.find(slot => !teamRoster[slot]);
      if (!emptySlot) return prev;

      

      return {
        ...prev,
        [teamId]: {
          ...teamRoster,
          [emptySlot]: { playerId, name }
        }
      };
    });

  }

  

  socket.on('draftOrderSet', ({ draftOrder }) => {
    console.log('[Socket] Draft order received:', draftOrder);
    setDraftOrder(draftOrder);
    setCurrentPickIndex(0);
  });

  socket.on('pickUpdate', ({ nextPickIndex }) => {
    setCurrentPickIndex(nextPickIndex);
  });

  socket.on('playerDrafted', ({ teamName, playerName, currentPick, draftDirection }) => {
  setRecentlyPickedPlayer(`${teamName} selected ${playerName}`);
  setCurrentPickIndex(currentPick);
  // Optionally: setDraftDirection(draftDirection); // if you want to store or show it
});


  socket.on('playerDrafted', onPlayerDrafted);

  return () => {
    socket.off('playerDrafted', onPlayerDrafted);
  };
}, [activeLeagueCode], [ROSTER_SLOTS]);




  // Fetch user teams on mount
  useEffect(() => {
    async function fetchUserTeams() {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setError('You must be logged in.');
          console.warn('[fetchUserTeams] No token found in localStorage');
          return;
        }

        const res = await axios.get('http://localhost:5000/api/users/me/teams', {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log('[fetchUserTeams] User teams fetched:', res.data.teams);
        setUserTeams(res.data.teams || []);
      } catch (err) {
        console.error('[fetchUserTeams] Failed to fetch user teams:', err);
        setError('Failed to fetch user teams.');
      }
    }
    fetchUserTeams();

    
  }, []);
  

  // Set activeLeagueCode based on userTeams only if not set by URL param
  useEffect(() => {
    if (!activeLeagueCode) {
      if (userTeams.length > 0) {
        setActiveLeagueCode(userTeams[0].leagueCode || null);
      } else {
        setActiveLeagueCode(null);
      }
    }
  }, [userTeams, activeLeagueCode]);

  // Fetch drafted players when activeLeagueCode changes
  useEffect(() => {
    async function fetchDraftedPlayers(league) {
      if (!league) {
        console.log('[fetchDraftedPlayers] No leagueCode provided');
        return;
      }

      const token = localStorage.getItem('token');
      if (!token) {
        setError('You must be logged in.');
        console.warn('[fetchDraftedPlayers] No token found');
        return;
      }

      try {
        const res = await axios.get(`http://localhost:5000/api/league/${league}/drafted-players`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        console.log(`[fetchDraftedPlayers] Drafted players for league ${league}:`, res.data.draftedPlayerIds);
        if (res.data.draftedPlayerIds) {
          setDraftedPlayersByLeague(prev => ({
            ...prev,
            [league]: res.data.draftedPlayerIds.map(id => id.toString())
          }));
        }
      } catch (err) {
        console.error(`[fetchDraftedPlayers] Failed to fetch drafted players for league ${league}:`, err);
      }
    }

    console.log('[activeLeagueCode effect] activeLeagueCode changed:', activeLeagueCode);
    fetchDraftedPlayers(activeLeagueCode);
  }, [activeLeagueCode]);

  // Fetch players data on mount
  useEffect(() => {
    async function fetchData() {
      try {
        const API_KEY = 'c633d833084c488e8606ed07120d30b3';
        const res = await fetch(`https://api.sportsdata.io/v3/cbb/stats/json/PlayerSeasonStats/2025?key=${API_KEY}`);
        if (!res.ok) throw new Error(`Fetch error: ${res.status}`);

        const data = await res.json();
        console.log('[fetchData] Player data fetched, number of players:', data.length);

        const grouped = data.reduce((acc, player) => {
          const team = player.Team || 'Unknown';
          acc[team] = acc[team] || [];
          acc[team].push({
            name: player.Name,
            position: player.Position,
            fantasyPoints: player.FantasyPoints,
            games: player.Games,
            points: player.Points,
            rebounds: player.Rebounds,
            assists: player.Assists,
            steals: player.Steals,
            blocks: player.BlockedShots,
            PlayerID: player.PlayerID,
          });
          return acc;
        }, {});

        const sortedTop10 = data
          .filter(p => p.FantasyPoints != null)
          .sort((a, b) => b.FantasyPoints - a.FantasyPoints)
          .slice(0, 100)
          .map(p => ({
            name: p.Name,
            PlayerID: p.PlayerID,
            team: p.Team,
            position: p.Position,
            fantasyPoints: p.FantasyPoints,
            games: p.Games,
            points: p.Points,
            rebounds: p.Rebounds,
            assists: p.Assists,
            steals: p.Steals,
            blocks: p.BlockedShots,
          }));

        console.log('[fetchData] Top 10 players:', sortedTop10.map(p => p.name));
        setTeamsWithPlayers(grouped);
        setTopPlayers(sortedTop10);
        setLoading(false);
      } catch (err) {
        console.error('[fetchData] Error fetching player stats:', err);
        setError('Error fetching player stats.');
        setLoading(false);
      }
    }
    fetchData();
  }, []);

useEffect(() => {
  if (socket && activeLeagueCode) {
    socket.emit('joinRoom', activeLeagueCode);  // 🔁 match backend name
    console.log(`🔗 Joined socket room for league ${activeLeagueCode}`);
  }
}, [socket, activeLeagueCode]);



  useEffect(() => {
  function handlePlayerDrafted({ playerId, name, leagueCode, teamId, teamName, currentPick, draftDirection }) {
    if (!leagueCode || leagueCode !== activeLeagueCode) return;
    

    // ✅ Update the drafted players
    setDraftedPlayersByLeague(prev => ({
      ...prev,
      [leagueCode]: [...(prev[leagueCode] || []), playerId.toString()]
    }));

setPickHistory(prev => [
  ...prev,
  { teamId, playerName: name }
]);



    // ✅ Show announcement
    setRecentlyPickedPlayer(`${teamName || 'A team'} selected ${name}`);
    setTimeout(() => setRecentlyPickedPlayer(''), 3000);

    // ✅ Set pick index
    if (currentPick !== undefined) setCurrentPickIndex(currentPick);

    // ✅ Update team roster
    if (!teamId) {
      console.warn('No teamId provided in playerDrafted event');
      return;
    }

    setTeamRosters(prev => {
      const teamRoster = prev[teamId] || {};
      const emptySlot = ROSTER_SLOTS.find(slot => !teamRoster[slot]);
      if (!emptySlot) return prev;
      setDraftHistory(prev => [
  { teamName: teamName || getTeamNameById(teamId), playerName: name },
  ...prev
]);

      return {
        ...prev,
        [teamId]: {
          ...teamRoster,
          [emptySlot]: { playerId, name }
        }
      };
      
    });
  }

  socket.on('playerDrafted', handlePlayerDrafted);

  return () => {
    socket.off('playerDrafted', handlePlayerDrafted);
  };
}, [activeLeagueCode]);




  useEffect(() => {
  async function initDraft() {
    if (!activeLeagueCode) return;

    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }

    try {
      // ✅ Step 1: Try to get existing draft order
      const res = await axios.get(
        `http://localhost:5000/api/league/${activeLeagueCode}/draft-order`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.draftOrder && res.data.draftOrder.length > 0) {
        console.log('[initDraft] Loaded existing draft order:', res.data.draftOrder);
        setDraftOrder(res.data.draftOrder);
        setCurrentPickIndex(res.data.currentPick || 0);
      } else {
        // ✅ Step 2: If no draft order, start it
        const startRes = await axios.post(
          `http://localhost:5000/api/league/${activeLeagueCode}/start-draft`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
        console.log('[initDraft] Draft started:', startRes.data.draftOrder);
        setDraftOrder(startRes.data.draftOrder);
        setCurrentPickIndex(0);
      }
    } catch (err) {
      console.error('[initDraft] Error initializing draft:', err);
      setError('Failed to initialize draft.');
    }
  }

  initDraft();
}, [activeLeagueCode]);


useEffect(() => {
  async function fetchLeagueTeams() {
    if (!activeLeagueCode) return;
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      return;
    }
    try {
      const res = await axios.get(`http://localhost:5000/api/league/${activeLeagueCode}/teams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log('[fetchLeagueTeams] Teams in league:', res.data.teams);
      setAllLeagueTeams(res.data.teams || []);
    } catch (err) {
      console.error('[fetchLeagueTeams] Failed to fetch league teams:', err);
      setError('Failed to fetch league teams.');
    }
  }
  fetchLeagueTeams();

  

  
}, [activeLeagueCode]);

useEffect(() => {
  if (!allLeagueTeams.length) return;

  setTeamRosters(prev => {
    const newRosters = { ...prev };
    allLeagueTeams.forEach(team => {
      if (!newRosters[team._id]) {
        newRosters[team._id] = {};
        ROSTER_SLOTS.forEach(slot => {
          newRosters[team._id][slot] = null;
        });
      }
    });
    return newRosters;
  });
}, [allLeagueTeams], [ROSTER_SLOTS]);






  async function createPlayer(name, PlayerID) {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('You must be logged in.');
      console.warn('[createPlayer] No token found');
      return;
    }
    if (userTeams.length === 0) {
      setError('You have no teams to draft players to.');
      console.warn('[createPlayer] No user teams available');
      return;
    }

    const league = activeLeagueCode;
    if (!league) {
      setError('Team has no league code.');
      console.warn('[createPlayer] No active league code set');
      return;
    }

    // Find the team for the active leagueCode
    const teamForLeague = userTeams.find(team => team.leagueCode === league);
    if (!teamForLeague) {
      setError('No team found for the active league.');
      console.warn('[createPlayer] No team found for league:', league);
      return;
    }

    setError('');
    setSuccessMsg('');
    setCreatingPlayerId(PlayerID);

    try {
      console.log(`[createPlayer] Drafting player ${name} (ID: ${PlayerID}) for team ${teamForLeague._id} in league ${league}`);

      await axios.post(`http://localhost:5000/api/team/${teamForLeague._id}/draft-player`,
        { name, PlayerID, leagueCode: league },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update drafted players state
      setDraftedPlayersByLeague(prev => ({
        ...prev,
        [league]: [...(prev[league] || []), PlayerID.toString()]
      }));

      setSuccessMsg(`Player "${name}" drafted successfully!`);

      // Emit socket event for real-time updates


  if (!myTeam) {
  alert("Your team couldn't be found in this league.");
  return;
}

const currentTeamId = fullDraftOrder[currentPickIndex];
if (myTeam._id !== currentTeamId) {
  alert("⛔ It's not your turn to draft.");
  return;
}
socket.emit('makePick', {
  leagueCode: activeLeagueCode,
  playerId: PlayerID.toString(),
  playerName: name,
  teamId: myTeam._id,
});

      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error('[createPlayer] Failed to draft player:', err.response?.data || err.message || err);
      setError(err.response?.data?.message || 'Failed to draft player.');
    } finally {
      setCreatingPlayerId(null);
    }
  }

const getTeamNameById = (teamId) => {
  const team = allLeagueTeams.find(t => t._id?.toString() === teamId?.toString());

  if (!team) {
    console.warn('⚠️ Could not find team for ID:', teamId);
  }

  return team ? team.name || 'Unnamed Team' : 'Unknown Team';
};

console.log("🔍 Team IDs in allLeagueTeams:");
// Ensure we only display teams that are in the draftOrder
const draftTeams = allLeagueTeams.filter(team =>
  draftOrder.includes(team._id?.toString())
);


console.log("📋 ALL LEAGUE TEAMS:", allLeagueTeams);
console.log("🎯 DRAFT ORDER:", draftOrder);
console.log("✅ FILTERED DRAFT TEAMS:", draftTeams);





  if (loading) return <p className="loading">Loading player stats...</p>;
  if (error) return <p className="error">{error}</p>;

  

  const draftedIdsForLeague = draftedPlayersByLeague[activeLeagueCode] || [];
  console.log('📦 DRAFT ORDER:', draftOrder);

  
console.log('Drafted player IDs:', draftedIdsForLeague);
console.log('Top players IDs:', topPlayers.map(p => p.PlayerID.toString()));



  return (
  <div className="container">
    {/* Draft Header */}
    <div className="draft-header flex justify-between items-center px-6 py-4 bg-white shadow-md">
      <h1 className="text-2xl font-bold text-blue-600">Draft Page</h1>
      <button className="exit-button" onClick={() => navigate('/my-leagues')}>
        Exit Draft
      </button>
    </div>

    {/* Draft Order Status */}
    {fullDraftOrder.length > 0 && allLeagueTeams.length > 0 && (
      <div className="draft-order-scroll-container">
  {fullDraftOrder.map((teamId, index) => {
    const pick = pickHistory[index];
    const teamName = getTeamNameById(teamId);

    let label;
    let boxClass = 'draft-status-box';

    if (pick) {
      // ✅ Past pick
      label = `${getTeamNameById(pick.teamId)} drafted ${pick.playerName}`;
      boxClass += ' picked';
    } else if (index === currentPickIndex) {
      // ✅ Current pick
      label = 'On the Clock';
      boxClass += ' on-clock highlight';
    } else if (index === currentPickIndex + 1) {
      // ✅ Next up
      label = 'Next Up';
      boxClass += ' next-up';
    } else {
      // ✅ Future pick
      label = `Pick ${index + 1}`;
    }

    return (
      <div key={`${teamId}-${index}`} className={boxClass}>
        <p>{label}</p>
        {!pick && label !== 'On the Clock' && <p>{teamName}</p>}
      </div>
    );
  })}
</div>

    )}

    {/* Picked & Error Messages */}
    {recentlyPickedPlayer && <div className="picked-alert">{recentlyPickedPlayer}</div>}
    {successMsg && <p className="success-message">{successMsg}</p>}
    {error && <p className="error-message">{error}</p>}

    {/* Top Player List */}
    <ol className="top-player-list">
      {topPlayers
        .filter((p) => !draftedIdsForLeague.includes(p.PlayerID.toString()))
        .map((p, i) => {
          const currentTeamId = fullDraftOrder[currentPickIndex];
          const isMyTurn = myTeam?._id === currentTeamId;
          const alreadyPicked = draftedIdsForLeague.includes(p.PlayerID.toString());

          return (
            <li key={i} className="top-player-item">
              {p.name} ({p.position}) — {p.team}
              <button
                disabled={creatingPlayerId === p.PlayerID || !isMyTurn || alreadyPicked}
                onClick={() => {
                  if (!isMyTurn) {
                    alert("⛔ It's not your turn to draft.");
                    return;
                  }
                  createPlayer(p.name, p.PlayerID);
                }}
                className={`draft-button ${
                  alreadyPicked ? 'picked' : !isMyTurn ? 'waiting' : 'active'
                }`}
              >
                {alreadyPicked
                  ? 'Picked'
                  : creatingPlayerId === p.PlayerID
                  ? 'Drafting...'
                  : isMyTurn
                  ? 'Draft Player'
                  : 'Waiting...'}
              </button>

              <div className="player-stats">
                <span>Fantasy Points: {p.fantasyPoints}</span>
                <span>Games: {p.games}</span>
                <span>Points: {p.points}</span>
                <span>Rebounds: {p.rebounds}</span>
                <span>Assists: {p.assists}</span>
                <span>Steals: {p.steals}</span>
                <span>Blocks: {p.blocks}</span>
                <span>PlayerID: {p.PlayerID}</span>
              </div>
            </li>
          );
        })}
    </ol>

    {/* Draft Board + Roster View */}
    <div className="draft-page-container">
      {/* Left Sidebar: Roster */}
      <div className="roster-sidebar">
        <h2 className="roster-title">Team Roster</h2>
        <select
          className="team-selector"
          value={selectedTeamId}
          onChange={(e) => setSelectedTeamId(e.target.value)}
        >
          {draftTeams.map((team) => (
            <option key={team._id} value={team._id}>
              {team.name}
            </option>
          ))}
        </select>

        {/* Show only selected team's roster */}
        <ul className="roster-list">
          {selectedTeamId &&
            Object.values(teamRosters[selectedTeamId] || {})
              .filter((player) => player && player.name)
              .map((player, index) => (
                <li key={index} className="roster-player">
                  {player.name} — {player.position}
                </li>
              ))}
        </ul>
      </div>

      {/* Center: Draft Board */}
      <div className="draft-board-area">
        <div className="draft-board-horizontal">
          {draftTeams.map((team) => (
            <div key={team._id} className="draft-board-column">
              <h4 className="team-header">{team.name}</h4>
              {ROSTER_SLOTS.map((slot) => {
                const player = teamRosters[team._id]?.[slot];
                return (
                  <div key={slot} className="draft-box">
                    <div className="slot-label">{slot}</div>
                    {player ? (
                      <div className="player-name">{player.name}</div>
                    ) : (
                      <div className="empty-slot">Empty</div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);



}

export default DraftPage;
