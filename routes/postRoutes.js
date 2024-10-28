const express = require('express')
const router = express.Router()
const postsController = require('../controllers/postsController')
const verifyJWT = require('../middleware/verifyJWT')

router.route('/')
    .get(postsController.getAllPosts)  // GET route does NOT use verifyJWT

// Apply verifyJWT middleware only to the routes that modify data (POST, PATCH, DELETE)
router.use(verifyJWT);

router.route('/')
    .post(postsController.createNewPost)
    .patch(postsController.updatePost)
    .delete(postsController.deletePost);

module.exports = router;