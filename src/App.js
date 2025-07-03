// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';  // Import the new Auth page
import Home from './pages/Home';
import MyLeagues from './pages/MyLeagues';
import MyTeam from './pages/MyTeam';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueDetails from './pages/LeagueDetails';
import CreateTeams from './pages/CreateTeams';
import TeamDetails from './pages/TeamDetails'; // adjust path if needed
import TeamDetailsInLeague from './pages/TeamDetailsInLeague';
import Standings from './pages/Standings';
import LiveGame from './pages/LiveGame';
import DraftPage from './pages/DraftPage';





function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Route */}
        <Route path="/" element={<Auth />} />  {/* This is the new entry point for auth */}
        {/* Home page */}
        <Route path="/home" element={<Home />} />
        <Route path="/my-leagues" element={<MyLeagues />} />
        <Route path="/my-team" element={<MyTeam />} />
        <Route path="/create-league" element={<CreateLeague />} />
        <Route path="/join-league" element={<JoinLeague />} />
        <Route path="/league/:leagueCode" element={<LeagueDetails />} />
        <Route path="/create-teams" element={<CreateTeams />} />
        <Route path="/team/:id" element={<TeamDetails />} />
        <Route path="/league/:leagueCode/team/:teamId" element={<TeamDetailsInLeague />} />
        <Route path="/standings" element={<Standings />} />
        <Route path="/live-game/:gameId" element={<LiveGame />} />
        <Route path="/draftpage/:leagueCode" element={<DraftPage />} />

      </Routes>
    </Router>
  );
}

export default App;
