const express = require("express");
const router = express.Router();
const { loginOrgAdmin } = require("../controllers/orgAdmin.controller");

// Login
router.post("/login", loginOrgAdmin);

module.exports = router;
