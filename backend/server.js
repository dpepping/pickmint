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
    if (!league) return res.status(404).json({ message: 'League not found' });

    const leagueTeams = await Team.find({ leagueCodes: code });

    const participantsDetailed = await Promise.all(
      league.participants.map(async (email) => {
        const user = await User.findOne({ username: email });
        const userTeams = leagueTeams.filter(t => t.ownerEmail === email);

        return {
          email,
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          teams: userTeams.map(t => ({
            name: t.name,
            points: t.points
          }))
        };
      })
    );

    res.json({
      name: league.name,
      code: league.code,
      owner: league.owner,
      groupSize: league.participants.length,
      groupType: 'private',
      groupPassword: null,
      participants: participantsDetailed,
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

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;
    const user = await User.findOne({ username: userEmail });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch user data' });
  }
});


// Get logged-in user's teams
app.get('/api/users/me/teams', authenticateToken, async (req, res) => {
  try {
    const teams = await Team.find({ ownerEmail: req.user.email });
    res.json({ teams });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});





// Create Team
app.post('/api/create-team', authenticateToken, async (req, res) => {
  try {
    const { teamName, leagueCode } = req.body;
    const ownerEmail = req.user.email;

    if (!teamName) {
      return res.status(400).json({ message: 'Team name is required' });
    }

    const user = await User.findOne({ username: ownerEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Create team document
    const newTeam = new Team({
      name: teamName,
      ownerEmail,
      leagueCode: leagueCode || null,
      points: 0,
    });
    await newTeam.save();

    // Update user's teams
    user.teams.push({ name: teamName, points: 0, _id: newTeam._id, leagueCode: leagueCode || null });
    await user.save();

    // If leagueCode provided, add team to league
    if (leagueCode) {
      const league = await League.findOne({ code: leagueCode });
      if (league) {
        league.teams.push({ name: teamName, owner: ownerEmail });
        await league.save();
      }
    }

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

app.get('/api/team/:id', authenticateToken, async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    res.json({
      name: team.name,
      ownerEmail: team.ownerEmail,
      leagueCodes: team.leagueCodes, // Return array of leagues
      points: team.points,
    });
  } catch (err) {
    console.error('Team details error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/add-team-to-league', authenticateToken, async (req, res) => {
  try {
    const { teamId, leagueCode } = req.body;

    const team = await Team.findById(teamId);
    const league = await League.findOne({ code: leagueCode });

    if (!team || !league) return res.status(404).json({ message: 'Team or League not found' });

    // Prevent duplicate leagueCode in team
    if (!team.leagueCodes.includes(leagueCode)) {
      team.leagueCodes.push(leagueCode);
      await team.save();
    }

    // Prevent duplicate team in league
    const alreadyInLeague = league.teams.some(t => t.name === team.name && t.owner === team.ownerEmail);
    if (!alreadyInLeague) {
      league.teams.push({ name: team.name, owner: team.ownerEmail });
      await league.save();
    }

    res.json({ message: 'Team added to league successfully' });
  } catch (err) {
    console.error('Add team to league error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// DELETE PATHS

// Delete a team entirely
app.delete('/api/team/:id', authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.id;
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Remove this team from all leagues it belongs to
    if (team.leagueCodes && team.leagueCodes.length > 0) {
      await League.updateMany(
        { code: { $in: team.leagueCodes } },
        { $pull: { teams: { name: team.name, owner: team.ownerEmail } } }
      );
    }

    // Remove from user's teams array
    await User.updateOne(
      { username: team.ownerEmail },
      { $pull: { teams: { _id: team._id } } }
    );

    // Delete the team document
    await Team.deleteOne({ _id: teamId });

    res.json({ message: 'Team deleted successfully' });
  } catch (err) {
    console.error('Delete team error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete a league entirely
app.delete('/api/league/:code', authenticateToken, async (req, res) => {
  try {
    const code = req.params.code;
    const league = await League.findOne({ code });
    if (!league) return res.status(404).json({ message: 'League not found' });

    // Delete the league document
    await League.deleteOne({ code });

    // Remove this league from all users' leagues arrays
    await User.updateMany(
      { 'leagues.code': code },
      { $pull: { leagues: { code } } }
    );

    // Remove this league from all teams' leagueCodes arrays
    await Team.updateMany(
      { leagueCodes: code },
      { $pull: { leagueCodes: code } }
    );

    // Also remove these teams from the league's teams array is automatic because league doc is deleted

    res.json({ message: 'League deleted successfully' });
  } catch (err) {
    console.error('Delete league error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Remove a team from a league
app.post('/api/remove-team-from-league', authenticateToken, async (req, res) => {
  try {
    const { teamId, leagueCode } = req.body;
    if (!teamId || !leagueCode) {
      return res.status(400).json({ message: 'Team ID and league code are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const league = await League.findOne({ code: leagueCode });
    if (!league) return res.status(404).json({ message: 'League not found' });

    // Remove the leagueCode from the team's leagueCodes array
    team.leagueCodes = team.leagueCodes.filter(code => code !== leagueCode);
    await team.save();

    // Remove the team from the league's teams array
    league.teams = league.teams.filter(t => !(t.name === team.name && t.owner === team.ownerEmail));
    await league.save();

    // Optional: update the user's teams array leagueCode field if stored there (not shown in your current schema)

    res.json({ message: 'Team removed from league successfully' });
  } catch (err) {
    console.error('Remove team from league error:', err);
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
