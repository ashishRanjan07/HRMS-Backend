const express = require('express');
const router = express.Router();
const superAdminController = require('../controllers/superAdmin.controller');

router.post('/register', superAdminController.registerSuperAdmin);
router.post('/login', superAdminController.loginSuperAdmin);

module.exports = router;
