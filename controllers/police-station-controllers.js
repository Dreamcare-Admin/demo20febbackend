const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const PoliceStation = require("../models/police-station");
const Officer = require("../models/Officer");
const Division = require("../models/division");

const {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} = require("@aws-sdk/client-s3");
const multer = require("multer"); // For handling file uploads
const path = require("path");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

const s3 = new S3Client({
  region: process.env.YOUR_AWS_REGION,
  credentials: {
    accessKeyId: process.env.YOUR_ACCESS_KEY_ID,
    secretAccessKey: process.env.YOUR_SECRET_ACCESS_KEY,
  },
});

const createStation = async (req, res, next) => {
  let imageLink1;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
            ),
            false
          );
        }
      },
    }).fields([{ name: "photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.photo ? req.files.photo[0] : null;

      // Function to upload a file to S3
      const uploadToS3 = async (file) => {
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      };

      if (imageFile1) {
        imageLink1 = await uploadToS3(imageFile1);
      }

      const {
        name,
        name_in_marathi,
        address,
        address_in_marathi,
        maplink,
        email,
        contact_no,
        contact_no2,
        contact_no3,
        division,
        zone,
      } = req.body;

      const tempGroup = {
        name,
        name_in_marathi,
      };

      if (imageFile1) {
        tempGroup.photo = imageLink1;
      }
      if (address) {
        tempGroup.address = address;
      }
      if (address_in_marathi) {
        tempGroup.address_in_marathi = address_in_marathi;
      }
      if (maplink) {
        tempGroup.maplink = maplink;
      }
      if (email) {
        tempGroup.email = email;
      }
      if (contact_no) {
        tempGroup.contact_no = contact_no;
      }
      if (contact_no2) {
        tempGroup.contact_no2 = contact_no2;
      }
      if (contact_no3) {
        tempGroup.contact_no3 = contact_no3;
      }
      if (division) {
        tempGroup.division = division;
      }
      if (zone) {
        tempGroup.zone = zone;
      }

      const createdGroup = new PoliceStation(tempGroup);

      await createdGroup.save();

      res.status(201).json({
        success: true,
        message: "New police station created successfully!",
        createdGroup,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const updateStation = async (req, res, next) => {
  const { Id } = req.query;
  let imageLink1;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, and JPEG files are allowed."
            ),
            false
          );
        }
      },
    }).fields([{ name: "photo", maxCount: 1 }]);

    upload(req, res, async function (err) {
      if (err) {
        const error = new HttpError("Error parsing file", 500);
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(error);
      }

      const imageFile1 = req.files.photo ? req.files.photo[0] : null;

      // Function to upload a file to S3
      const uploadToS3 = async (file) => {
        const filename = `${uuidv4()}${path.extname(file.originalname)}`;
        const uploadParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: filename,
          Body: file.buffer,
          ContentType: file.mimetype,
        };
        const uploadCommand = new PutObjectCommand(uploadParams);
        await s3.send(uploadCommand);
        return `https://${process.env.AWS_S3_BUCKET}.s3.amazonaws.com/${filename}`;
      };

      if (imageFile1) {
        imageLink1 = await uploadToS3(imageFile1);
      }

      const {
        name,
        name_in_marathi,
        address,
        address_in_marathi,
        maplink,
        email,
        contact_no,
        contact_no2,
        contact_no3,
        division,
        zone,
      } = req.body;

      const tempGroup = await PoliceStation.findById(Id);

      if (!tempGroup) {
        return res
          .status(400)
          .json({ success: false, message: "police station not found!" });
      }

      if (tempGroup.photo && imageFile1) {
        const s3DeleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: tempGroup.photo.substring(tempGroup.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
        };

        const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
        await s3.send(deleteCommand);
      }

      if (imageFile1) {
        tempGroup.photo = imageLink1;
      }

      if (name) {
        tempGroup.name = name;
      }
      if (name_in_marathi) {
        tempGroup.name_in_marathi = name_in_marathi;
      }
      if (address) {
        tempGroup.address = address;
      }
      if (address_in_marathi) {
        tempGroup.address_in_marathi = address_in_marathi;
      }
      if (maplink) {
        tempGroup.maplink = maplink;
      }
      if (email) {
        tempGroup.email = email;
      }
      if (contact_no) {
        tempGroup.contact_no = contact_no;
      }
      if (contact_no2) {
        tempGroup.contact_no2 = contact_no2;
      }
      if (contact_no3) {
        tempGroup.contact_no3 = contact_no3;
      }

      if (division) {
        tempGroup.division = division;
      }
      if (zone) {
        tempGroup.zone = zone;
      }
      await tempGroup.save();

      res.status(201).json({
        success: true,
        message: "Police station updated successfully!",
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getStations = async (req, res, next) => {
  let stations;

  try {
    stations = await PoliceStation.find({})
      .select("_id name name_in_marathi")
      .sort({ name: 1 });

    res.status(200).json({ stations });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getStationsAdmin = async (req, res, next) => {
  let stations;

  try {
    stations = await PoliceStation.find({}).populate("division");
    res.status(200).json({ stations });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getStationforUser = async (req, res, next) => {
  let stations;

  const { Id } = req.query;

  try {
    stations = await PoliceStation.find({ _id: Id }).populate("division");
    res.status(200).json({ stations });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getStationsAdminbyId = async (req, res, next) => {
  const { Id } = req.query;
  let stations;

  try {
    stations = await PoliceStation.find({ _id: Id });
    res.status(200).json({ stations });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const deleteStationById = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const tempGroup = await PoliceStation.findById(Id);

    if (tempGroup.photo) {
      const s3DeleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: tempGroup.photo.substring(tempGroup.photo.lastIndexOf("/") + 1), // Extract the filename from the URL
      };

      const deleteCommand = new DeleteObjectCommand(s3DeleteParams);
      await s3.send(deleteCommand);
    }

    await PoliceStation.findByIdAndDelete(Id);

    res.json({ success: true, message: "data deleted successfully" });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getStationbyId = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const group = await PoliceStation.findById(Id)
      .populate("division")
      .populate("zone");
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "police station not found!" });
    }

    const officers = await Officer.find({ psId: Id });

    res.json({ group, officers });
  } catch (error) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

exports.createStation = createStation;

exports.updateStation = updateStation;

exports.deleteStationById = deleteStationById;

exports.getStations = getStations;

exports.getStationforUser = getStationforUser;

exports.getStationsAdmin = getStationsAdmin;

exports.getStationsAdminbyId = getStationsAdminbyId;

exports.getStationbyId = getStationbyId;
