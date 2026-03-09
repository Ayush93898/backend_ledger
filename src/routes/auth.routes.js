const express = require('express')
const router = express.Router()
const authController = require('../controllers/auth.controller')

// routes

// Register ->  POST /api/auth/register
router.post("/register",authController.userRegisterController)

// Login ->  POST /api/auth/login
router.post("/login",authController.userLoginController)

// Logout ->  POST /api/auth/logout
router.post("/logout",authController.userLogoutController)


module.exports = router;