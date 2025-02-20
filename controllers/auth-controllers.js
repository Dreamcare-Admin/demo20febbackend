const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Contact = require("../models/contact");
const jwt = require("jsonwebtoken");

require("dotenv").config();

const secretKey = "dreamcare";

const adminUser = {
  email: "csruralpolice@gmail.com",
  password: "DreamSecure#4253",
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  if (email === adminUser.email && password === adminUser.password) {
    // Generate a JWT token
    const token = jwt.sign({ email }, secretKey, { expiresIn: "30d" });

    // Send the token as a response
    res.json({ success: true, token });
  } else {
    res.status(401).json({ success: false, message: "Authentication failed" });
  }
};

const verifyToken = (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res
      .status(401)
      .json({ verified: false, message: "Token not provided" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res
        .status(401)
        .json({ verified: false, message: "Invalid token" });
    }
    // console.log(decoded);

    res.json({ verified: true, role: decoded.role });
  });
};

exports.login = login;
exports.verifyToken = verifyToken;
