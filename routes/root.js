const express = require("express");
const router = express.Router();
const path = require("path");
// Imports Node.js's built-in path module for working with file and directory paths safely.

router.get("^/$|/index(.html)?", (req, res) => {
  // Defines a GET route that matches:
  // '/' (home page),
  // '/index',
  // or '/index.html'.
  // The regex ' ^/$|/index(.html)? ' means:
  // ^/$ → exactly /
  // | → OR
  // /index(.html)? → /index optionally followed by .html

  res.sendFile(path.join(__dirname, "..", "views", "index.html"));
  // res.sendFile() is a method provided by Express to send an actual file as a response to the client (usually HTML, images, etc.).
  // Sends the index.html file located in the views directory one level up from the current file's location.
});

module.exports = router;
// Exports this router module so it can be imported into the main app (usually in app.js or server.js).

// This file defines a route handler that serves the index.html file when the user visits the root URL or /index(.html) of the site.
