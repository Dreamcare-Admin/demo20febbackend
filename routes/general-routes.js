const express = require("express");
const { check } = require("express-validator");
const verifyTokenMiddleware = require("../middleware/verifyToken");

const generalControllers = require("../controllers/general-controllers");

const router = express.Router();

router.get("/captcha", generalControllers.getcaptcha);

router.get("/generate-otp", generalControllers.getOTP);

router.get("/get-visitors", generalControllers.getVisitorCount);

module.exports = router;
