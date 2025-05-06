const express = require("express");
const router = express.Router();
const {
  generateAvatar,
  saveAvatar,
} = require("../controllers/avatarController");
const verifyJWT = require("../middleware/verifyJWT");

router.use(verifyJWT);

router.post("/generate", generateAvatar);
router.post("/save", verifyJWT, saveAvatar);

module.exports = router;
