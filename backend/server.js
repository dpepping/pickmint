const express = require('express');
const cors = require('cors');  // ✅ Import CORS
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Enable CORS
app.use(cors());
app.use(express.json());

const users = [];
const leagues = [];



function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) return res.sendStatus(401);

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user; // This will be the payload you encoded (e.g., { email })
    next();
  });
}


// Signup Route
app.post('/api/signup', async (req, res) => {
  const { firstName, lastName, gender, email, password } = req.body;

  if (!firstName || !lastName || !gender || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const userExists = users.find((user) => user.email === email);
  if (userExists) {
    return res.status(400).json({ message: 'User already exists' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { firstName, lastName, gender, email, password: hashedPassword, leagues: [] };
  users.push(newUser);

  return res.status(201).json({ message: 'User signed up successfully' });
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const user = users.find((user) => user.email === email);
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return res.json({ token });
});

// Get All Users Route
app.get('/api/users', (req, res) => {
  return res.json(users); // Now includes email, firstName, lastName, gender, and leagues
});

// Create League
app.post('/api/league/create', (req, res) => {
  const { name, ownerEmail, code } = req.body;

  // Check if ownerEmail is provided and is a valid email
  if (!ownerEmail || ownerEmail.trim() === '') {
    return res.status(400).json({ message: 'Owner email is required' });
  }

  // Create the new league
  const newLeague = {
    code,
    name,
    owner: ownerEmail, // Set the owner as the user's email
    participants: [ownerEmail], // The owner is also a participant
  };

  // Push the league to the leagues array
  leagues.push(newLeague);

  // Find the user and update their record with the new league
  const user = users.find((user) => user.email === ownerEmail);
  if (user) {
    if (!user.leagues) {
      user.leagues = []; // Initialize leagues if not already present
    }
    user.leagues.push({ name: newLeague.name, code: newLeague.code }); // Add the league to the user's leagues
  } else {
    return res.status(404).json({ message: 'User not found with provided email' });
  }

  return res.status(201).json({ message: 'League created', code: newLeague.code });
});



// Join League
app.post('/api/league/join', (req, res) => {
  const { code, userEmail } = req.body;

  const league = leagues.find((l) => l.code === code);
  if (!league) {
    return res.status(404).json({ message: 'League not found' });
  }

  // If the user is already a participant, return a 400 error
  if (league.participants.includes(userEmail)) {
    return res.status(400).json({ message: 'User already in league' });
  }

  // Add the user as a participant
  league.participants.push(userEmail);

  // Find the user and add the league to their list of leagues
  const user = users.find(u => u.email === userEmail);
  if (user) {
    if (!user.leagues) {
      user.leagues = []; // Initialize leagues if not already present
    }
    user.leagues.push({ name: league.name, code: league.code });
  }

  return res.status(200).json({ message: 'Joined league successfully' });
});

// Debug route to view all leagues
app.get('/api/leagues', (req, res) => {
  res.json(leagues); // Show all created leagues
});

// Debug route to view user details (including leagues)
app.get('/api/user/:email', (req, res) => {
  const { email } = req.params;
  const user = users.find(u => u.email === email);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json(user); // Return the user with leagues
});



app.get('/api/user/leagues', (req, res) => {
  console.log('📡 /api/user/leagues endpoint hit');

  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: 'Missing token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ Decoded user email:', decoded.email);

    const user = users.find(u => u.email === decoded.email);
    if (!user) {
      console.log('❌ No user found for email:', decoded.email);
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json({ leagues: user.leagues || [] });
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
});

const brackets = []; // Global list of all brackets
app.post('/api/create-bracket', (req, res) => {
  const { email, bracketName, leagueCode } = req.body;

  if (!email || !bracketName) {
    return res.status(400).json({ error: 'Email and bracket name required.' });
  }

  const newBracket = { name: bracketName, email };

  brackets.push(newBracket);

  // Append to user's brackets
  const user = users.find((u) => u.email === email);
  if (user) {
    user.brackets = user.brackets || [];
    user.brackets.push(bracketName);
  }

  // Link to league if provided
  if (leagueCode) {
    const league = leagues.find((l) => l.code === leagueCode);
    if (league) {
      league.brackets = league.brackets || [];
      league.brackets.push(bracketName);
    }
  }

  res.status(201).json({ message: 'Bracket created', bracket: newBracket });
});

app.get('/api/brackets', (req, res) => {
  res.json(brackets);
});




// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
