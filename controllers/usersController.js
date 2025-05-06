const User = require("../models/User");
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");

// @desc Get all users
// @route GET /users
// @access Private
const getAllUsers = asyncHandler(async (req, res) => {
  // Get all users from MongoDB
  const users = await User.find().select("-password").lean();

  // If no users
  if (!users?.length) {
    return res.status(400).json({ message: "No users found" });
  }

  res.json(users);
});

// @desc Create new user
// @route POST /users
// @access Private
const createNewUser = asyncHandler(async (req, res) => {
  const { fullname, username, password, roles } = req.body;

  // Confirm data
  if (
    !fullname ||
    !username ||
    !password ||
    !Array.isArray(roles) ||
    !roles.length
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  // Check for duplicate username
  const duplicate = await User.findOne({ username }).lean().exec();

  if (duplicate) {
    return res.status(409).json({ message: "Username already exists" });
  }

  // Hash password
  const hashedPwd = await bcrypt.hash(password, 10); // salt rounds

  const profilePic = `https://api.dicebear.com/9.x/big-smile/svg?seed=${username}`;
  const userObject = {
    fullname,
    username,
    password: hashedPwd,
    roles,
    profilePic,
  };

  // Create and store new user
  const user = await User.create(userObject);

  if (user) {
    //created
    res.status(201).json({ message: `New user ${username} created` });
  } else {
    res.status(400).json({ message: "Invalid user data received" });
  }
});

// @desc Update a user
// @route PATCH /users
// @access Private
const updateUser = asyncHandler(async (req, res) => {
  const { id, username, roles, active, password } = req.body;

  // Confirm data
  if (
    !id ||
    !username ||
    !Array.isArray(roles) ||
    !roles.length ||
    typeof active !== "boolean"
  ) {
    return res
      .status(400)
      .json({ message: "All fields except password are required" });
  }

  // Does the user exist to update?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  // Check for duplicate
  const duplicate = await User.findOne({ username }).lean().exec();

  // Allow updates to the original user
  if (duplicate && duplicate?._id.toString() !== id) {
    return res.status(409).json({ message: "Duplicate username" });
  }

  user.username = username;
  user.roles = roles;
  user.active = active;

  if (password) {
    // Hash password
    user.password = await bcrypt.hash(password, 10); // salt rounds
  }

  const updatedUser = await user.save();

  res.json({ message: `${updatedUser.username} updated` });
});

// @desc Delete a user
// @route DELETE /users
// @access Private
const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.body;

  // Confirm data
  if (!id) {
    return res.status(400).json({ message: "User ID Required" });
  }

  // Does the user still have assigned posts?
  const post = await Post.findOne({ user: id }).lean().exec();
  if (post) {
    return res.status(400).json({ message: "User has assigned posts" });
  }

  // Does the user exist to delete?
  const user = await User.findById(id).exec();

  if (!user) {
    return res.status(400).json({ message: "User not found" });
  }

  //currently can only delete the user once all posts associated with that user are deleted
  // const deletePostsResult = await Post.deleteMany({ user: id }).exec();
  //uncomment above to automatically delete all the posts associated the user

  const result = await user.deleteOne();

  // Associated posts deleted: ${deletePostsResult.deletedCount}

  const reply = `Username ${user.username} with ID ${user._id} deleted. `;

  res.json(reply);
});

// @desc Update user password (verify old password first)
// @route PATCH /users/password
// @access Private
const updatePassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.userId; // from verifyJWT middleware

  if (!oldPassword || !newPassword) {
    return res
      .status(400)
      .json({ message: "Both old and new passwords are required." });
  }

  const user = await User.findById(userId).exec();
  if (!user) {
    return res.status(404).json({ message: "User not found." });
  }

  const match = await bcrypt.compare(oldPassword, user.password);
  if (!match) {
    return res.status(403).json({ message: "Old password is incorrect." });
  }

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  res.json({ message: "Password updated successfully." });
});

module.exports = {
  getAllUsers,
  createNewUser,
  updateUser,
  deleteUser,
  updatePassword,
};
