const Post = require('../models/Post');
const User = require('../models/User');

// @description Get all posts 
// @route GET /posts
// @access Private
const getAllPosts = async (req, res) => {
    const posts = await Post.find().lean();

    if (!posts?.length) {
        return res.status(400).json({ message: 'No posts found' });
    }

    const postsWithUser = await Promise.all(posts.map(async (post) => {
        const user = await User.findById(post.user).lean().exec();
        return { ...post, username: user.username };
    }));

    res.json(postsWithUser);
};

// @desc Create new post
// @route POST /posts
// @access Private
const createNewPost = async (req, res) => {
    const { user, title, text } = req.body;

    if (!user || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const post = await Post.create({ user, title, text });

    if (post) {
        return res.status(201).json({ message: 'New post created' });
    } else {
        return res.status(400).json({ message: 'Invalid post data received' });
    }
};

// @desc Update a post
// @route PATCH /posts
// @access Private
const updatePost = async (req, res) => {
    const { id, title, text } = req.body;

    if (!id || !title || !text) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const post = await Post.findById(id).exec();

    if (!post) {
        return res.status(400).json({ message: 'Post not found' });
    }

    // Authorization: Only allow owner or admin to update
    const isAdmin = req.user.roles.includes('Admin');
    const isOwner = post.user.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    // Update fields (Allow duplicate titles by removing the title check)
    post.title = title;
    post.text = text;

    const updatedPost = await post.save();

    res.json({ message: `'${updatedPost.title}' updated` });
};

// @desc Delete a post
// @route DELETE /posts
// @access Private
const deletePost = async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ message: 'Post ID required' });
    }

    const post = await Post.findById(id).exec();

    if (!post) {
        return res.status(400).json({ message: 'Post not found' });
    }

    // Authorization: Only allow owner or admin to delete
    const isAdmin = req.user.roles.includes('Admin');
    const isOwner = post.user.toString() === req.user.userId;

    if (!isAdmin && !isOwner) {
        return res.status(403).json({ message: 'Forbidden' });
    }

    const result = await post.deleteOne();

    const reply = `Post '${result.title}' with ID ${result._id} deleted`;

    res.json(reply);
};

module.exports = {
    getAllPosts,
    createNewPost,
    updatePost,
    deletePost
};
