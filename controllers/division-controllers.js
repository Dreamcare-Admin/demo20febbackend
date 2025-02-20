const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const Division = require("../models/division");

require("dotenv").config();

const addDivision = async (req, res, next) => {
  const { name, name_in_marathi } = req.body;

  const createdDivision = new Division({
    name,
    name_in_marathi,
  });

  try {
    await createdDivision.save();
    res
      .status(201)
      .json({ success: true, message: "new division added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getDivision = async (req, res, next) => {
  let divisions;

  try {
    divisions = await Division.find({}).sort({ createdAt: -1 });

    res.status(200).json({ divisions });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateDivision = async (req, res, next) => {
  const { Id } = req.query;

  const { name, name_in_marathi, sr_no } = req.body;

  try {
    const divisiondata = await Division.findById(Id);

    if (!divisiondata) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    divisiondata.name = name;
    divisiondata.name_in_marathi = name_in_marathi;
    divisiondata.sr_no = sr_no;

    await divisiondata.save();

    res
      .status(200)
      .json({ success: true, message: "data updated successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteDivisionById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await Division.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addDivision = addDivision;

exports.getDivision = getDivision;

exports.updateDivision = updateDivision;

exports.deleteDivisionById = deleteDivisionById;
