require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Connected to MongoDB'))
.catch(err => console.error('❌ MongoDB connection error:', err));

// Middleware to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('Auth Header:', authHeader);
  console.log('Token:', token);

  if (!token) {
    console.log('❌ No token');
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
  if (err) {
    console.log('❌ Token verification failed:', err.message);
    return res.sendStatus(403);
  }
  req.user = { email: decoded.email }; // Ensure the user object has an email
  console.log('✅ Token verified. User:', req.user);
  next();
});

}


// ===== ROUTES =====

// Signup
app.post('/api/signup', async (req, res) => {
  try {
    const { firstName, lastName, gender, email, password } = req.body;
    if (!firstName || !lastName || !gender || !email || !password) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({ username: email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: email,
      passwordHash,
      leagues: [],
      teams: [],
    });

    await newUser.save();

    res.status(201).json({ message: 'User signed up successfully' });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ username: email });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ email: user.username }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create League
app.post('/api/league/create', authenticateToken, async (req, res) => {
  try {
    const { name, code } = req.body;
    const ownerEmail = req.user.email;

    if (!name || !code) {
      return res.status(400).json({ message: 'Name and code are required' });
    }

    const existingLeague = await League.findOne({ code });
    if (existingLeague) {
      return res.status(400).json({ message: 'League code already exists' });
    }

    const league = new League({
      code,
      name,
      owner: ownerEmail,
      participants: [ownerEmail],
      teams: [],
    });

    await league.save();

    // Add league reference to user's leagues array
    const user = await User.findOne({ username: ownerEmail });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.leagues.push({ name, code });
    await user.save();

    res.status(201).json({ message: 'League created', code });
  } catch (error) {
    console.error('Create league error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get detailed info about a league
app.get('/api/league', authenticateToken, async (req, res) => {
  try {
    const { code } = req.query;
    if (!code) {
      return res.status(400).json({ message: 'League code required' });
    }

    const league = await League.findOne({ code });
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // For simplicity, groupType and groupPassword are static here, customize as needed
    const groupType = 'private';
    const groupPassword = null;

    // Populate teams array from Team collection instead of embedded (optional)
    const leagueTeams = await Team.find({ leagueCode: code });

    res.json({
      name: league.name,
      code: league.code,
      owner: league.owner,
      groupSize: league.participants.length,
      groupType,
      groupPassword,
      participants: league.participants,
      teams: leagueTeams.map(t => ({ name: t.name, owner: t.ownerEmail, points: t.points })),
    });
  } catch (error) {
    console.error('Get league error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Join League
app.post('/api/league/join', authenticateToken, async (req, res) => {
  try {
    const { code } = req.body;
    const userEmail = req.user.email;

    if (!code) {
      return res.status(400).json({ message: 'League code required' });
    }

    const league = await League.findOne({ code });
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    if (league.participants.includes(userEmail)) {
      return res.status(400).json({ message: 'User already in league' });
    }

    league.participants.push(userEmail);
    await league.save();

    const user = await User.findOne({ username: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    user.leagues.push({ name: league.name, code: league.code });
    await user.save();

    res.json({ message: 'Joined league successfully' });
  } catch (error) {
    console.error('Join league error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all leagues (debug)
app.get('/api/leagues', async (req, res) => {
  try {
    const leagues = await League.find({});
    res.json(leagues);
  } catch (error) {
    console.error('Get leagues error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get user details by email (debug)
app.get('/api/user/:email', authenticateToken, async (req, res) => {
  try {
    const { email } = req.params;
    const user = await User.findOne({ username: email });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get logged-in user's leagues
// Get all league details where user is a participant
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

    const userLeagues = (user.leagues || []).map(({ code }) => {
      const league = leagues.find(l => l.code === code);

      if (!league) return null;

      // Get brackets associated with this league
      const leagueBrackets = (brackets || []).filter(b =>
        (league.brackets || []).includes(b.name)
      );

      return {
        name: league.name,
        code: league.code,
        participants: league.participants,
        groupSize: league.participants.length,
        teams: leagueBrackets.map(b => ({
          name: b.name,
          email: b.email,
          points: b.points || 0 // Optional: calculate or assign points elsewhere
        }))
      };
    }).filter(Boolean); // Remove nulls in case any league isn't found

    return res.json({ leagues: userLeagues });
  } catch (err) {
    console.error('❌ Token verification error:', err.message);
    return res.status(401).json({ message: 'Invalid token' });
  }
});





// GET league details by ID
app.get('/api/leagues/:id', authenticateToken, async (req, res) => {
  try {
    const leagueId = req.params.id.trim(); // Trim whitespace/newlines
    const league = await League.findById(leagueId);
    if (!league) return res.status(404).json({ message: 'League not found' });
    res.json({ league });
  } catch (error) {
    console.error('Error fetching league by ID:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});






// Get logged-in user's teams
app.get('/api/user/teams', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ username: userEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ teams: user.teams || [] });
  } catch (error) {
    console.error('Get user teams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Create Team
app.post('/api/create-team', authenticateToken, async (req, res) => {
  try {
    const { teamName, leagueCode } = req.body;
    const ownerEmail = req.user.email;

    if (!teamName || !leagueCode) {
      return res.status(400).json({ message: 'Team name and league code are required' });
    }

    const user = await User.findOne({ username: ownerEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const league = await League.findOne({ code: leagueCode });
    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Create team document
    const newTeam = new Team({
      name: teamName,
      ownerEmail,
      leagueCode,
      points: 0,
    });
    await newTeam.save();

    // Update user's teams
    user.teams.push({ name: teamName, points: 0 });
    await user.save();

    // Update league's teams array
    league.teams.push({ name: teamName, owner: ownerEmail });
    await league.save();

    res.status(201).json({ message: 'Team created successfully', team: newTeam });
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all teams (debug)
app.get('/api/teams', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({});
    res.json(teams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/', (req, res) => {
  res.send('✅ PickMint backend is running!');
});

app._router.stack
  .filter(r => r.route)
  .forEach(r => console.log(`✅ ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`));


// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
