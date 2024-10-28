const express = require('express');
const router = express.Router();
const { createNewUser } = require('../controllers/usersController');

// Public registration endpoint
router.post('/', createNewUser);

module.exports = router;
