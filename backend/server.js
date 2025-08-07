require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const router = express.Router();

const User = require('./models/User');
const League = require('./models/League');
const Team = require('./models/Team');
const Player = require('./models/Player');

const soccerRoutes = require('./Soccer'); // Adjust path if needed


const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(soccerRoutes);
const leagueDraftOrders = {};



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
      firstName,
      lastName,
      gender,
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

    const token = jwt.sign(
      {
        id: user._id,
        email: user.username,
        firstName: user.firstName || '',
        lastName: user.lastName || ''
      },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// Create League
app.post('/api/league/create', authenticateToken, async (req, res) => {
  try {
    const { name, code, groupSize } = req.body;
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
      groupSize, // new field
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
    if (!code) return res.status(400).json({ message: 'League code is required' });

    const league = await League.findOne({ code });
    if (!league) return res.status(404).json({ message: 'League not found' });

    // For each team in league.teams, get full team with _id
    const teamsWithId = await Promise.all(
  league.teams.map(async (teamRef) => {
    const fullTeam = await Team.findOne({ name: teamRef.name, ownerEmail: teamRef.owner });
    
    if (!fullTeam) {
      console.warn(`⚠️ Team NOT found for name="${teamRef.name}", owner="${teamRef.owner}"`);
    } else {
      console.log(`✅ Found team "${fullTeam.name}" with ID: ${fullTeam._id}`);
    }

    return {
      _id: fullTeam ? fullTeam._id : null,
      name: teamRef.name,
      owner: teamRef.owner,
      points: fullTeam ? fullTeam.points : 0,
    };
  })
);


    // Get participants as before
    const participants = [];

for (const email of league.participants) {
  const user = await User.findOne({ username: email });

  if (user) {
    // Find this user's teams based on fresh DB team list
    const teamsInLeague = teamsWithId.filter(t => t.owner === user.username);

    participants.push({
      email: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      teams: teamsInLeague,
    });
  }
}


    res.json({
      name: league.name,
      groupSize: league.groupSize,
      groupType: league.groupType || 'Private',
      groupPassword: league.groupPassword || '',
      draftTime: league.draftTime || null,
      owner: league.owner,
      participants,
      teams: teamsWithId,
    });
  } catch (error) {
    console.error('Fetch league details error:', error);
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

    if (league.participants.length >= league.groupSize) {
      return res.status(400).json({ message: 'League is already full' });
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


// Get all leagues user is in
app.get('/api/leagues', authenticateToken, async (req, res) => {
  try {
    const userEmail = req.user.email;

    // Find leagues where user is a participant
    const leagues = await League.find({ participants: userEmail });

    res.json(leagues);
  } catch (error) {
    console.error('Fetch leagues error:', error);
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

    // Populate leagues with draftTime and groupSize
    const enrichedLeagues = await Promise.all(
      user.leagues.map(async (league) => {
        const fullLeague = await League.findOne({ code: league.code });

        return {
          ...league._doc,  // league has name and code from user.leagues array
          draftTime: fullLeague?.draftTime || null,
          groupSize: fullLeague?.participants?.length || 0,
        };
      })
    );

    res.json({
      ...user._doc,
      leagues: enrichedLeagues,
    });
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

//get all teams of user per league (there should only ever be one team returned)
app.get('/draft-page/:code',authenticateToken,async(req,res)=>{

  const ownerEmail = req.user.email;

  const league_code = req.params.code

  console.log(league_code)

  const user = await User.findOne({ username: ownerEmail });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
  }

  //const league_team = await User.findOne({leagues:})



})



app.get('/api/team/:id', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching team id:', req.params.id); 
    const team = await Team.findById(req.params.id);

    if (!team) {
      console.log('Team not found for id:', req.params.id);
      return res.status(404).json({ message: 'Team not found' });
    }

    res.json({
      name: team.name,
      ownerEmail: team.ownerEmail,
      leagueCode: team.leagueCode,
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
    if (!team || !league) {
      return res.status(404).json({ message: 'Team or League not found' });
    }

    // Assign leagueCode directly (replace existing if any)
    team.leagueCode = leagueCode;
    await team.save();

    // Add team to league if not already present
    if (!Array.isArray(league.teams)) league.teams = [];
    const alreadyInLeague = league.teams.some(
      t => t.name === team.name && t.owner === team.ownerEmail
    );
    if (!alreadyInLeague) {
      league.teams.push({ name: team.name, owner: team.ownerEmail });
      await league.save();
    }

    // Update user's teams array with leagueCode
    const user = await User.findOne({ username: team.ownerEmail });
    if (user) {
      const userTeam = user.teams.find(t => t.name === team.name);
      if (userTeam) {
        userTeam.leagueCode = leagueCode;
      } else {
        user.teams.push({
          name: team.name,
          points: team.points,
          leagueCode: leagueCode,
        });
      }
      await user.save();
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

    // Remove league from all users' leagues array (if you track them)
    await User.updateMany(
      { 'leagues.code': code },
      { $pull: { leagues: { code } } }
    );

    // Remove leagueCode from all teams assigned to this league
    await Team.updateMany(
      { leagueCode: code },
      { $unset: { leagueCode: "" } }
    );

    res.json({ message: 'League deleted and teams unlinked successfully' });
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

    // Clear leagueCode if matches
    if (team.leagueCode === leagueCode) {
      team.leagueCode = null;
      await team.save();
    }

    // Remove from league's teams array
    league.teams = league.teams.filter(t => !(t.name === team.name && t.owner === team.ownerEmail));
    await league.save();

    // Update user's teams array
    await User.updateOne(
      { username: team.ownerEmail, 'teams._id': team._id },
      { $set: { 'teams.$.leagueCode': null } }
    );

    res.json({ message: 'Team removed from league successfully' });
  } catch (err) {
    console.error('Remove team from league error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.post('/api/league/:code/schedule-draft', authenticateToken, async (req, res) => {
  const { draftTime } = req.body;
  const userEmail = req.user.email;

  try {
    const league = await League.findOne({ code: req.params.code });
    if (!league) return res.status(404).json({ message: 'League not found' });
    if (league.owner !== userEmail) return res.status(403).json({ message: 'Only the creator can schedule the draft' });

    league.draftTime = draftTime;
    await league.save();
    res.json({ message: 'Draft scheduled' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET all players
router.get('/api/players', async (req, res) => {
  try {
    const players = await Player.find();
    res.json(players);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server error');
  }
});

//const playerRoutes = require('./playerRoutes');
//app.use(playerRoutes);

// Assuming leagueDraftOrders is declared globally near the top of your server file:

app.post('/api/league/:code/start-draft', authenticateToken, async (req, res) => {
  try {
    // Fetch teams directly, no need to populate league teams for this step
    const teams = await Team.find({ leagueCode: req.params.code });
    if (!teams || teams.length === 0) {
      return res.status(400).json({ message: 'No teams found in league to draft' });
    }

    const teamIds = teams.map(t => t._id.toString());
    const shuffled = teamIds.sort(() => 0.5 - Math.random());

    // Atomically update league draft fields
    const updatedLeague = await League.findOneAndUpdate(
      { code: req.params.code },
      {
        draftOrder: shuffled,
        currentPick: 0,
        draftDirection: 'forward',
        draftStarted: true
      },
      { new: true }
    );

    if (!updatedLeague) {
      return res.status(404).json({ message: 'League not found' });
    }

    // Update in-memory draft order store
    leagueDraftOrders[updatedLeague.code] = shuffled;

    // Emit draft order to clients in the league room
    const io = req.app.get('socketio');
    io.to(updatedLeague.code).emit('draftOrderSet', { draftOrder: shuffled });

    res.json({ message: 'Draft order set', draftOrder: shuffled });
  } catch (err) {
    console.error('Error starting draft:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


app.get('/api/league/:leagueCode/teams', authenticateToken, async (req, res) => {
  try {
    const { leagueCode } = req.params;

    // Instead of fetching league and returning league.teams, query Teams collection directly:
    const teams = await Team.find({ leagueCode });

    if (!teams) {
      return res.status(404).json({ message: 'No teams found for this league' });
    }

    res.json({ teams }); // Now teams have _id that match draftOrder
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/league/:code/draft-order', authenticateToken, async (req, res) => {
  try {
    const league = await League.findOne({ code: req.params.code });
    if (!league) return res.status(404).json({ message: 'League not found' });

    res.json({
      draftOrder: league.draftOrder || [],
      currentPick: league.currentPick || 0,
    });
  } catch (err) {
    console.error('Error getting draft order:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// routes/teamRoutes.js or wherever
router.post('/teams/byIds', async (req, res) => {
  const { teamIds } = req.body;

  try {
    const teams = await Team.find({ _id: { $in: teamIds } });
    res.json({ teams });
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});




//Creating players
//Creating players
app.post('/api/team/:teamId/draft-player', authenticateToken, async (req, res) => {
  try {
    console.log('Draft Player body:', req.body);

    const ownerEmail = req.user.email;
    const { teamId } = req.params;
    const { name, PlayerID, leagueCode } = req.body;

    // Validate required fields
    if (!PlayerID || !name || !leagueCode) {
      return res.status(400).json({ message: 'PlayerID, name, and leagueCode required' });
    }

    console.log('Received name:', name, '| PlayerID:', PlayerID);

    // Fetch team and verify ownership and league association
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    if (team.ownerEmail !== ownerEmail) return res.status(403).json({ message: 'Not authorized' });
    if (team.leagueCode !== leagueCode) return res.status(400).json({ message: 'Team not in this league' });

    // Fetch league
    const league = await League.findOne({ code: leagueCode });
    if (!league) return res.status(404).json({ message: 'League not found' });

    // Find or create player
    let player = await Player.findOne({ PlayerID });
    if (!player) {
      player = new Player({ name, PlayerID });
      await player.save();
    }

    // Check if player already drafted in this league
    // Check if player already drafted in this league
const alreadyDraftedInLeague = league.playersDrafted.some(
  p => p.externalPlayerId === PlayerID.toString()
);
if (alreadyDraftedInLeague) {
  return res.status(400).json({ message: 'Player already drafted in this league' });
}

// Add player to user's team
team.players.push({
  playerId: player._id,
  name: player.name,
  draftedAt: new Date(),
});
await team.save();

// Track player as drafted in the league
// Track player as drafted in the league
league.playersDrafted.push({
  externalPlayerId: PlayerID.toString(),
  name: name
});

// Increment current pick
const newIndex = (league.currentPick || 0) + 1;
league.currentPick = newIndex;

await league.save();


// Emit socket event
const io = req.app.get('socketio');
if (io) {
io.to(leagueCode).emit('playerDrafted', {
  playerId: PlayerID.toString(),
  name: player.name,
  leagueCode,
  currentPick: newIndex,
  teamId: team._id.toString(),
  teamName: team.name,
});


      console.log(`🔔 Emitted playerDrafted event for player ${player.name} in league ${leagueCode}`);
    } else {
      console.warn('⚠️ Socket.io instance not found on app');
    }

    res.json({ message: 'Player drafted successfully', player, team, league });

  } catch (error) {
    console.error('Draft player error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


// In your backend server.js or routes file

app.get('/api/league/:leagueCode/drafted-players', authenticateToken, async (req, res) => {
  try {
    const { leagueCode } = req.params;

    const league = await League.findOne({ code: leagueCode });

    if (!league) {
      return res.status(404).json({ message: 'League not found' });
    }

    const draftedPlayerIDs = (league.playersDrafted || [])
      .map(dp => dp.externalPlayerId)
      .filter(Boolean);

    res.json({ draftedPlayerIds: draftedPlayerIDs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
});



// --- Dashboard Data Route ---
// Place this route in your server.js file, for example,
// right after the '/api/users/me/teams' route or with other user-related GET routes.

app.get('/api/users/dashboard-data', authenticateToken, async (req, res) => {
    try {
        // req.user.email is set by your authenticateToken middleware
        const userEmail = req.user.email; 

        // 1. Fetch User Data: Needed for the user's name
        const user = await User.findOne({ username: userEmail });
        if (!user) {
            console.warn(`Dashboard: User ${userEmail} not found despite valid token.`);
            return res.status(404).json({ message: 'User data not found for dashboard.' });
        }

        // 2. Fetch User's Active Leagues: For the "Your Active Leagues" section
        // Find all leagues where the user is a participant
        const userLeagues = await League.find({ participants: userEmail });

        // Transform league data to match what the frontend's Dashboard component expects
        // (id, name, rank, nextMatch).
        // 'rank' and 'nextMatch' are placeholders for now, as they require more complex
        // game logic and scheduling to be truly dynamic.
        const activeLeaguesFrontend = userLeagues.map(league => ({
            id: league._id,       // Use MongoDB's _id for React keys
            name: league.name,
            code: league.code,    // Include code for potential navigation
            rank: Math.floor(Math.random() * 10) + 1, // Placeholder: Random rank for now
            nextMatch: 'Date TBD' // Placeholder: You'll integrate real match dates later
        }));

        // 3. Calculate Quick Stats:
        // Count teams owned by the user
        const totalTeamsUserOwns = await Team.countDocuments({ ownerEmail: userEmail });
        // Upcoming matches count is 0 for now, as you'd need a separate match scheduling system
        const upcomingMatchesCount = 0; 

        // 4. Today's Matches: This would be an array of match objects
        // It's empty for now, as there's no match scheduling logic yet in your backend
        const todayMatches = []; 

        // --- Assemble the complete Dashboard response ---
        const dashboardResponse = {
            user: { name: user.firstName || user.username }, // Prefer firstName if you stored it, else username
            stats: {
                activeLeagues: activeLeaguesFrontend.length, // Total number of leagues this user is in
                totalTeams: totalTeamsUserOwns,
                upcomingMatches: upcomingMatchesCount
            },
            todayMatches: todayMatches,
            activeLeagues: activeLeaguesFrontend
        };

        // Send the JSON response to the frontend
        res.json(dashboardResponse);

    } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        res.status(500).json({ message: 'Internal server error while fetching dashboard data.' });
    }
});




const http = require('http').createServer(app);
const io = require('socket.io')(http, {
  cors: { origin: '*' }  // Allow all origins for now, tighten later for production
});

app.set('socketio', io);  // Attach io instance so routes can use it

// Optional: Listen for connections
io.on('connection', (socket) => {
  console.log('🟢 A user connected:', socket.id);

  // ✅ Join a league room
  socket.on('joinRoom', (leagueCode) => {
    console.log(`🔗 Joining room: ${leagueCode}`);
    socket.join(leagueCode);

    // Send current draft order if it exists
    const currentDraftOrder = leagueDraftOrders[leagueCode];
    if (currentDraftOrder) {
      console.log(`📤 Emitting draftOrderSet to room ${leagueCode}`, currentDraftOrder);
      io.to(leagueCode).emit('draftOrderSet', { draftOrder: currentDraftOrder });
    } else {
      console.warn(`⚠️ No draft order found for league ${leagueCode}`);
    }
  });

  // ✅ Handle a pick being made
  socket.on('makePick', async ({ leagueCode, playerId, playerName, teamId }) => {
  try {
    const league = await League.findOne({ code: leagueCode });
    if (!league || !league.draftOrder) return;

    const currentTeamId = league.draftOrder[league.currentPick];
    
    // ❌ Not your turn
    if (currentTeamId.toString() !== teamId) {
      console.warn(`⛔️ Team ${teamId} tried to pick out of turn. Current pick: ${currentTeamId}`);
      return;
    }

    const team = await Team.findById(teamId);
    if (!team) return;

    // ✅ Proceed with adding player, saving league, etc.
    team.players.push({
      playerId,
      name: playerName,
      draftedAt: new Date(),
    });
    await team.save();

    league.playersDrafted.push({
      playerId: null,
      externalPlayerId: playerId.toString(),
      name: playerName,
    });

    // Advance pick logic...
    let nextPick;
    if (league.draftDirection === 'forward') {
      if (league.currentPick + 1 >= league.draftOrder.length) {
        league.draftDirection = 'backward';
        nextPick = league.draftOrder.length - 1;
      } else {
        nextPick = league.currentPick + 1;
      }
    } else {
      if (league.currentPick - 1 < 0) {
        league.draftDirection = 'forward';
        nextPick = 0;
      } else {
        nextPick = league.currentPick - 1;
      }
    }

    league.currentPick = nextPick;
    await league.save();

    io.to(leagueCode).emit('playerDrafted', {
      playerId,
      name: playerName,
      leagueCode,
      teamId: team._id.toString(),
      teamName: team.name,
      currentPick: league.currentPick,
      draftDirection: league.draftDirection,
    });

  } catch (err) {
    console.error('Error making pick:', err);
  }
});


  socket.on('disconnect', () => {
    console.log('🔴 A user disconnected:', socket.id);
  });
});







// Existing route check stays the same
app.get('/', (req, res) => {
  res.send('✅ PickMint backend is running!');
});

app._router.stack
  .filter(r => r.route)
  .forEach(r => console.log(`✅ ${Object.keys(r.route.methods)[0].toUpperCase()} ${r.route.path}`));

// REPLACE THIS:
// app.listen(PORT, () => { console.log(`Server is running on http://localhost:${PORT}`); });

// WITH THIS:
http.listen(PORT, () => {
  console.log(`🚀 Server + Socket.io running on http://localhost:${PORT}`);
});
