const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");

const ImpContact = require("../models/impcontact");

require("dotenv").config();

const addcontact = async (req, res, next) => {
  const { address, address_in_marathi, telephone, email, sr_no, mobile } =
    req.body;

  const createdcontact = new ImpContact({
    address,
    address_in_marathi,
    telephone,
    email,
    sr_no,
    mobile,
  });

  try {
    await createdcontact.save();

    res
      .status(201)
      .json({ success: true, message: "new Imp Contact added successfully!" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getcontact = async (req, res, next) => {
  let contacts;

  try {
    contacts = await ImpContact.find({}).sort({ sr_no: 1 });

    res.status(200).json({ contacts });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const updateContact = async (req, res, next) => {
  const { Id } = req.query;

  const { address, address_in_marathi, telephone, email, sr_no, mobile } =
    req.body;

  try {
    const contact = await ImpContact.findById(Id);

    if (!contact) {
      return res
        .status(500)
        .json({ success: false, message: "data does not exists" });
    }

    contact.address = address;
    contact.address_in_marathi = address_in_marathi;
    contact.telephone = telephone;
    contact.email = email;
    contact.sr_no = sr_no;
    contact.mobile = mobile;

    await contact.save();

    res.status(200).json({
      success: true,
      message: "Imp contact data updated successfully!",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteContactById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    await ImpContact.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.addcontact = addcontact;

exports.getcontact = getcontact;

exports.updateContact = updateContact;

exports.deleteContactById = deleteContactById;
