const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const AccidentCompensation = require("../models/accident-compensation");

const {
  uploadImageToS3,
  uploadPdfToS3,
  deleteObjectFromS3,
} = require("../utils/upload-to-s3");

const multer = require("multer"); // For handling file uploads
const path = require("path");

require("dotenv").config();

const createAccidentCompensation = async (req, res, next) => {
  let Link1, Link2;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".pdf"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error("Invalid file format. Only  pdf files are allowed."),
            false
          );
        }
      },
    }).fields([
      { name: "f1", maxCount: 1 },
      { name: "f2", maxCount: 1 },
    ]);

    upload(req, res, async function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error parsing file" });
      }

      const File1 = req.files.f1 ? req.files.f1[0] : null;
      const File2 = req.files.f2 ? req.files.f2[0] : null;

      if (File1) {
        Link1 = await uploadPdfToS3(File1);
      }
      if (File2) {
        Link2 = await uploadPdfToS3(File2);
      }

      const { cr_no, year, date, psId } = req.body;

      const tempGroup = {
        cr_no,
        year,
        date,
        psId,
      };

      if (File1) {
        tempGroup.comm_aa = Link1;
      }
      if (File2) {
        tempGroup.fir_file = Link2;
      }

      const createdGroup = new AccidentCompensation(tempGroup);

      await createdGroup.save();

      res.status(201).json({
        success: true,
        message: "New Accident Compensation record created successfully!",
        createdGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateAccidentCompensation = async (req, res, next) => {
  const { Id } = req.query;
  if (!Id) {
    return res.status(400).json({ success: false, message: "No Id provided" });
  }
  let Link1, Link2;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".pdf"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error("Invalid file format. Only  pdf files are allowed."),
            false
          );
        }
      },
    }).fields([
      { name: "f1", maxCount: 1 },
      { name: "f2", maxCount: 1 },
    ]);

    upload(req, res, async function (err) {
      if (err) {
        return res
          .status(500)
          .json({ success: false, message: "Error parsing file" });
      }

      const File1 = req.files.f1 ? req.files.f1[0] : null;
      const File2 = req.files.f2 ? req.files.f2[0] : null;

      if (File1) {
        Link1 = await uploadPdfToS3(File1);
      }
      if (File2) {
        Link2 = await uploadPdfToS3(File2);
      }

      const { cr_no, year, date, psId } = req.body;

      const tempGroup = await AccidentCompensation.findById(Id);

      // Check if the document was found
      if (!tempGroup) {
        return res.status(404).json({
          success: false,
          message: "record not found with provided Id",
        });
      }

      if (tempGroup.comm_aa && File1) {
        await deleteObjectFromS3(tempGroup.comm_aa);
      }

      if (tempGroup.fir_file && File2) {
        await deleteObjectFromS3(tempGroup.fir_file);
      }

      if (File1) {
        tempGroup.comm_aa = Link1;
      }
      if (File2) {
        tempGroup.fir_file = Link2;
      }

      if (cr_no) {
        tempGroup.cr_no = cr_no;
      }
      if (date) {
        tempGroup.date = date;
      }
      if (year) {
        tempGroup.year = year;
      }

      if (psId) {
        tempGroup.psId = psId;
      }

      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "record updated successfully!",
        tempGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const geAccidentCompensation = async (req, res, next) => {
  let trust;

  try {
    trust = await AccidentCompensation.find({})
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ Data: trust });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const geACbyUser = async (req, res, next) => {
  let trust;
  const { Id } = req.query;

  try {
    trust = await AccidentCompensation.find({ psId: Id })
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ Data: trust });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getACbyFilter = async (req, res, next) => {
  let trust;

  const { psId, year, cr_no } = req.query;

  const query = {};

  if (psId) {
    query.psId = psId;
  }

  if (year) {
    query.year = year;
  }

  if (cr_no) {
    query.cr_no = cr_no;
  }

  try {
    trust = await AccidentCompensation.find(query)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .sort({ createdAt: -1 });

    res.status(200).json({ Data: trust });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteAccidentCompensationById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const tempGroup = await AccidentCompensation.findById(Id);

    if (tempGroup.comm_aa) {
      await deleteObjectFromS3(tempGroup.comm_aa);
    }

    if (tempGroup.fir_file) {
      await deleteObjectFromS3(tempGroup.fir_file);
    }

    await AccidentCompensation.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.createAccidentCompensation = createAccidentCompensation;

exports.updateAccidentCompensation = updateAccidentCompensation;

exports.geAccidentCompensation = geAccidentCompensation;

exports.geACbyUser = geACbyUser;

exports.deleteAccidentCompensationById = deleteAccidentCompensationById;

exports.getACbyFilter = getACbyFilter;
