// src/App.js
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Auth from './pages/Auth';  // Import the new Auth page
import Home from './pages/Home';
import MyLeagues from './pages/MyLeagues';
import Draft from './pages/Draft';
import Leaderboard from './pages/Leaderboard';
import CreateLeague from './pages/CreateLeague';
import JoinLeague from './pages/JoinLeague';
import LeagueDetails from './pages/LeagueDetails';
import MyBrackets from './pages/MyBrackets';
import CreateBracket from './pages/CreateBracket';




function App() {
  return (
    <Router>
      <Routes>
        {/* Authentication Route */}
        <Route path="/" element={<Auth />} />  {/* This is the new entry point for auth */}
        {/* Home page */}
        <Route path="/home" element={<Home />} />
        <Route path="/my-leagues" element={<MyLeagues />} />
        <Route path="/draft" element={<Draft />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/create-league" element={<CreateLeague />} />
        <Route path="/join-league" element={<JoinLeague />} />
        <Route path="/league/:leagueCode" element={<LeagueDetails />} />
        <Route path="/my-brackets" element={<MyBrackets />} />
        <Route path="/create-bracket" element={<CreateBracket />} />

      </Routes>
    </Router>
  );
}

export default App;
