const express = require('express');
const router = express.Router();
const usersController = require('../controllers/usersController');
const verifyJWT = require('../middleware/verifyJWT');
const verifyAdmin = require('../middleware/verifyAdmin');

// Apply verifyJWT middleware to all routes
router.use(verifyJWT);

// Routes accessible to all authenticated users
router.get('/', usersController.getAllUsers);

// Routes accessible only to admin users
router.use(verifyAdmin);

router.route('/')
    .post(usersController.createNewUser)
    .patch(usersController.updateUser)
    .delete(usersController.deleteUser);

module.exports = router;
