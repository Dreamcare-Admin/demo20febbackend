const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const svgCaptcha = require("svg-captcha");
const axios = require("axios");
const crypto = require("crypto");
const Visitor = require("../models/visitor");
require("dotenv").config();

const getcaptcha = async (req, res, next) => {
  try {
    var captcha = svgCaptcha.create((size = 6));

    const captchaData = {
      svg: captcha.data,
      text: captcha.text,
    };

    res.status(200).json({ success: true, captcha: captchaData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

function generateOTP() {
  // Generate a random 4-digit number
  const otp = Math.floor(1000 + Math.random() * 9000);
  return otp.toString(); // Convert the number to a string
}

const getOTP = async (req, res, next) => {
  const { phonenumber } = req.query;

  const otp = generateOTP();

  const hashedData = crypto.createHash("sha256").update(otp).digest("hex");

  //   console.log(hashedData);

  try {
    const response = await axios.get(
      `http://web.smsgw.in/smsapi/httpapi.jsp?username=mbvvpc&password=123123&from=MAHPOL&to=${phonenumber}&text=OTP is ${otp} Police Website MAHPOL&pe_id=1601100000000004090&template_id=1607100000000054716&coding=0`
    );

    return res.status(200).json({ success: true, data: hashedData });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getVisitorCount = async (req, res, next) => {
  try {
    // Find the visitor record, if it exists
    let visitor = await Visitor.findOne();

    // If visitor record doesn't exist, create a new one
    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      // Increment the visitor count
      visitor.count++;
    }

    // Save the updated visitor record
    await visitor.save();

    // Send the updated count in the response
    res.json({ count: visitor.count });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
};

exports.getcaptcha = getcaptcha;

exports.getOTP = getOTP;

exports.getVisitorCount = getVisitorCount;
