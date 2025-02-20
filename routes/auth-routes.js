const express = require("express");
const { check } = require("express-validator");

const authControllers = require("../controllers/auth-controllers");

const router = express.Router();

router.post("/admin-login", authControllers.login);

router.post("/verify-token", authControllers.verifyToken);

module.exports = router;
