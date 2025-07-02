const express = require('express');
const router = express.Router();
const axios = require('axios');

const SPORTS_API_KEY = process.env.SPORTSDATA_API_KEY;

router.get('/api/soccer/standings/:leagueId/:season', async (req, res) => {
  const { leagueId, season } = req.params;

  try {
    const response = await axios.get(`https://api.sportsdata.io/v4/soccer/scores/json/Standings/${leagueId}/${season}`, {
      params: {
        key: SPORTS_API_KEY,
      },
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ message: 'Failed to fetch standings' });
  }
});

module.exports = router;
