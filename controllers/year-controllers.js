const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Year = require("../models/year");

require("dotenv").config();

const addYear = async (req, res, next) => {
  const { year } = req.body;

  const createdYear = new Year({
    year,
  });

  try {
    await createdYear.save();
    res
      .status(201)
      .json({ success: true, message: "new year added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getYear = async (req, res, next) => {
  let years;

  try {
    years = await Year.find({}).sort({ year: -1 });

    res.status(200).json({ years });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateYear = async (req, res, next) => {
  const { Id } = req.query;

  const { year } = req.body;

  try {
    const yeardata = await Year.findById(Id);

    if (!yeardata) {
      return res
        .status(400)
        .json({ success: false, message: "data does not exists" });
    }

    yeardata.year = year;

    await yeardata.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteYearById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Year.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addYear = addYear;

exports.getYear = getYear;

exports.updateYear = updateYear;

exports.deleteYearById = deleteYearById;
