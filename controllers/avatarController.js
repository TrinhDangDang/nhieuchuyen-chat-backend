const axios = require("axios");
const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const streamifier = require("streamifier");
require("dotenv").config();

// Generate avatar from prompt
const generateAvatar = async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) return res.status(400).json({ message: "Prompt is required." });

  try {
    console.log("Generating avatar...");
    const response = await axios.post(
      "https://api.together.xyz/v1/images/generations",
      {
        prompt,
        model: "black-forest-labs/FLUX.1-schnell-Free",
        steps: 1,
        n: 1,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
        },
      }
    );

    const imageUrl = response.data?.data?.[0]?.url;

    if (!imageUrl) {
      return res.status(500).json({ message: "Failed to generate avatar." });
    }

    return res.json({ image: imageUrl });
  } catch (error) {
    console.error("Avatar generation error:", error.message);
    res.status(500).json({ message: "Avatar generation failed." });
  }
};

// Save avatar and update user profile
const saveAvatar = async (req, res) => {
  const { imageUrl, newUserName, newFullName } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: "imageUrl is required" });
  }

  try {
    // Fetch image as a buffer
    const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
    const buffer = Buffer.from(response.data, "binary");

    // Upload to Cloudinary
    const streamUpload = (buffer) =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "avatars" },
          (error, result) => {
            if (result) resolve(result);
            else reject(error);
          }
        );
        streamifier.createReadStream(buffer).pipe(stream);
      });

    const result = await streamUpload(buffer);

    // Find and update user
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.profilePic = result.secure_url;

    if (newUserName && newUserName.trim().length > 0) {
      user.username = newUserName.trim();
    }

    if (newFullName && newFullName.trim().length > 0) {
      user.fullname = newFullName.trim();
    } else if (!user.fullname) {
      // if there's still no fullname, assign a fallback to satisfy validation
      user.fullname = user.username || "Unnamed User";
    }
    console.log("User about to be saved:", user);
    await user.save();

    return res.status(201).json({
      message: "Avatar and profile updated",
      profilePic: result.secure_url,
      username: user.username,
      fullname: user.fullname,
    });
  } catch (err) {
    console.error("Error saving avatar:", err.message);
    return res.status(500).json({ message: "Failed to save avatar" });
  }
};

module.exports = { generateAvatar, saveAvatar };
