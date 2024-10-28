const Post = require('../models/Post')
const User = require('../models/User')

// @description Get all posts 
// @route GET /posts
// @access Private
const getAllPosts = async (req, res) => {
    // Get all posts from MongoDB
    const posts = await Post.find().lean() //lean() ensures that the returned documents are plain JavaScript objects, not Mongoose models

    // If no posts 
    if (!posts?.length) {
        return res.status(400).json({ message: 'No posts found' })
    }

    const postsWithUser = await Promise.all(posts.map(async (post) => {
        const user = await User.findById(post.user).lean().exec()
        return { ...post, username: user.username }
    }))

    res.json(postsWithUser)
}


const createNewPost = async (req, res) => {
    const { user, title, text } = req.body

    // Confirm data
    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Check for duplicate title
    const duplicate = await Post.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    if (duplicate) {
        return res.status(409).json({ message: 'Duplicate post title' })
    }

    // Create and store the new user 
    const post = await Post.create({ user, title, text })

    if (post) { // Created 
        return res.status(201).json({ message: 'New post created' })
    } else {
        return res.status(400).json({ message: 'Invalid post data received' })
    }

}

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = async (req, res) => {
    const { id, user, title, text } = req.body

    // Confirm data
    if (!id || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' })
    }

    // Confirm post exists to update
    const post = await Post.findById(id).exec()

    if (!post) {
        return res.status(400).json({ message: 'Post not found' })
    }

    // Check for duplicate title
    const duplicate = await Post.findOne({ title }).collation({ locale: 'en', strength: 2 }).lean().exec()

    // Allow renaming of the original post 
    if (duplicate && duplicate?._id.toString() !== id) {
        return res.status(409).json({ message: 'Duplicate post title' })
    }

    post.title = title
    post.text = text

    const updatedPost = await post.save()

    res.json(`'${updatedPost.title}' updated`)
}

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = async (req, res) => {
    const { id } = req.body

    // Confirm data
    if (!id) {
        return res.status(400).json({ message: 'Post ID required' })
    }

    // Confirm post exists to delete 
    const post = await Post.findById(id).exec()

    if (!post) {
        return res.status(400).json({ message: 'Post not found' })
    }

    const result = await post.deleteOne()

    const reply = `Post '${result.title}' with ID ${result._id} deleted`

    res.json(reply)
}

module.exports = {
    getAllPosts,
    createNewPost,
    updatePost,
    deletePost
}