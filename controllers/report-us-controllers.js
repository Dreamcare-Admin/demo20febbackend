const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const HttpError = require("../models/http-error");
const Complaint = require("../models/online-complaint");
const LostFound = require("../models/lostfound");
const Feedback = require("../models/Feedback");
const Tenant = require("../models/Tenant");
// const ShortFilm = require("../models/shortfilm");
const IndustryComplaint = require("../models/industry-complaint");

const {
  uploadImageToS3,
  uploadPdfToS3,
  deleteObjectFromS3,
} = require("../utils/upload-to-s3");

const multer = require("multer"); // For handling file uploads
const path = require("path");
const ShortUniqueId = require("short-unique-id");

const uid = new ShortUniqueId({ length: 10 });

require("dotenv").config();

const createComplaint = async (req, res, next) => {
  let fileLinks = [];
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, JPEG, and PDF files are allowed."
            ),
            false
          );
        }
      },
    }).fields([{ name: "files", maxCount: 5 }]);

    upload(req, res, async function (err) {
      if (err) {
        // Handle error
        return next(err);
      }

      const uploadedFiles = req.files.files || [];

      // Upload files to S3 and collect links
      for (const file of uploadedFiles) {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (fileExtension === ".pdf") {
          const fileLink = await uploadPdfToS3(file); // Function to upload PDF file to S3
          fileLinks.push(fileLink);
        } else {
          const fileLink = await uploadImageToS3(file); // Function to upload image file to S3
          fileLinks.push(fileLink);
        }
      }

      // Create Complaint model instance and save to database
      const {
        psId,
        fullName,
        contactNo,
        email,
        street,
        address,
        city,
        state,
        country,
        pinCode,
        complaint,
      } = req.body;

      const reg_id = uid.rnd();

      const newComplaint = new Complaint({
        psId,
        fullName,
        contactNo,
        email,
        street,
        address,
        city,
        state,
        country,
        pinCode,
        complaint,
        files: fileLinks,
        reg_id: reg_id,
      });

      await newComplaint.save();

      res.status(201).json({
        success: true,
        message: "New complaint created successfully!",
        id: newComplaint._id,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getComplaintList = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const psId = req.query.psId;

  const filter = {};

  if (psId) {
    filter.psId = psId;
  }

  try {
    const count = await Complaint.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const data = await Complaint.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteOnlineComplaint = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await Complaint.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.files && record.files.length > 0) {
      for (let i = 0; i < record.files.length; i++) {
        await deleteObjectFromS3(record.files[i]);
      }
    }
    // Delete the record from MongoDB
    await Complaint.findByIdAndDelete(Id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getOnlineComplaintbyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await Complaint.findById(Id).populate({
      path: "psId",
      select: "name", // Only fetch the name and name_in_marathi fields from police station model
    });

    res.status(200).json({ record });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const createLostFound = async (req, res, next) => {
  const {
    fullName,
    email,
    contactNo,
    address,
    pinCode,
    psId,
    report_type,
    article_type,
    article_address,
    datetime,
    street,
    city,
    state,
    country,
    article_pincode,
    description,
  } = req.body;

  const reg_id = uid.rnd();

  const createdlostfound = new LostFound({
    fullName,
    email,
    contactNo,
    address,
    pinCode,
    psId,
    report_type,
    article_type,
    article_address,
    datetime,
    street,
    city,
    state,
    country,
    article_pincode,
    description,
    reg_id: reg_id,
  });

  try {
    await createdlostfound.save();

    res.status(201).json({
      success: true,
      message: "new lost found created successfully!",
      id: createdlostfound._id,
    });
  } catch (err) {
    // console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getLostFoundList = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const psId = req.query.psId;
  const filter = {};

  if (psId) {
    filter.psId = psId;
  }

  try {
    const count = await LostFound.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const data = await LostFound.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteLostFound = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await LostFound.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    // Delete the record from MongoDB
    await LostFound.findByIdAndDelete(Id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getLostFoundbyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await LostFound.findById(Id).populate({
      path: "psId",
      select: "name", // Only fetch the name and name_in_marathi fields from police station model
    });

    res.status(200).json({ record });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const createFeedback = async (req, res, next) => {
  const {
    category,
    psId,
    fullName,
    contactNo,
    email,
    subject,
    address,
    description,
  } = req.body;

  const reg_id = uid.rnd();

  const createdFeedback = new Feedback({
    category,
    psId,
    fullName,
    contactNo,
    email,
    subject,
    address,
    description,
    reg_id: reg_id,
  });

  try {
    await createdFeedback.save();

    res.status(201).json({
      success: true,
      message: "new feedback created successfully!",
      id: createdFeedback._id,
    });
  } catch (err) {
    // console.log(err);
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getFeedbackList = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const psId = req.query.psId;

  const filter = {};

  if (psId) {
    filter.psId = psId;
  }

  try {
    const count = await Feedback.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const data = await Feedback.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteFeedback = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await Feedback.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    // Delete the record from MongoDB
    await Feedback.findByIdAndDelete(Id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getFeedbackbyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await Feedback.findById(Id).populate({
      path: "psId",
      select: "name", // Only fetch the name and name_in_marathi fields from police station model
    });

    res.status(200).json({ record });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const createTenantInfo = async (req, res, next) => {
  let link1, link2, link3;
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, JPEG, and PDF files are allowed."
            ),
            false
          );
        }
      },
    }).fields([
      { name: "f1", maxCount: 1 },
      { name: "f2", maxCount: 1 },
      { name: "f3", maxCount: 1 },
    ]);

    upload(req, res, async function (err) {
      if (err) {
        // Handle error
        res.status(500).json({ success: false, message: "Error parsing file" });
        return next(err);
      }

      const File1 = req.files.f1 ? req.files.f1[0] : null;
      const File2 = req.files.f2 ? req.files.f2[0] : null;
      const File3 = req.files.f3 ? req.files.f3[0] : null;

      const Link1 = await uploadImageToS3(File1);
      const Link2 = await uploadImageToS3(File2);
      const Link3 = await uploadImageToS3(File3);

      const {
        psId,
        // ownerPhoto,
        fullName,
        contactNo,
        email,
        address,
        city,
        state,
        pinCode,

        //rented property details

        rentPropertyAddress,
        rentPropertyCity,
        rentPropertyState,
        rentPropertyPincode,
        agreementStartDate,
        agreementEndDate,

        // TENANT INFO

        tenantName,
        // tenantPhoto,
        tenantPermanentAddress,
        tenantCity,
        tenantState,
        tenantPincode,
        tenantIdentityProof,
        tenantIdentityProofNo,
        // tenantIdentityProofDoc,
        numberOfMale,
        numberOfFemale,
        numberOfChild,

        // TENANT WORK PLACE INFO

        tenantMobNo,
        tenantEmail,
        tenantOccupation,

        tenantPlaceOfWork,
        tenantPlaceOfWorkCity,
        tenantPlaceOfWorkState,
        tenantPlaceOfWorkPincode,

        // PERSONS KNOWN TENANT INFO

        knownPerson1,
        knownPerson2,
        knownPerson1Contact,
        knownPerson2Contact,
        agentName,
        agentDetails,
      } = req.body;

      const reg_id = uid.rnd();

      const datatemp = {
        psId,
        ownerPhoto: Link1,
        fullName,
        contactNo,
        email,

        address,
        city,
        state,
        pinCode,

        //rented property details

        rentPropertyAddress,
        rentPropertyCity,
        rentPropertyState,
        rentPropertyPincode,
        agreementStartDate,
        agreementEndDate,

        // TENANT INFO

        tenantName,
        tenantPhoto: Link2,
        tenantPermanentAddress,
        tenantCity,
        tenantState,
        tenantPincode,
        tenantIdentityProof,
        tenantIdentityProofNo,
        tenantIdentityProofDoc: Link3,
        numberOfMale,
        numberOfFemale,
        numberOfChild,

        // TENANT WORK PLACE INFO

        tenantMobNo,
        tenantEmail,
        tenantOccupation,

        tenantPlaceOfWork,
        tenantPlaceOfWorkCity,
        tenantPlaceOfWorkState,
        tenantPlaceOfWorkPincode,

        // PERSONS KNOWN TENANT INFO

        knownPerson1,
        knownPerson2,
        knownPerson1Contact,
        knownPerson2Contact,
        agentName,
        agentDetails,

        reg_id: reg_id,
      };

      const newTenant = new Tenant(datatemp);

      await newTenant.save();

      res.status(201).json({
        success: true,
        message: "New Tenant info created successfully!",
        id: newTenant._id,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getTenantDatabyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await Tenant.findById(Id).populate({
      path: "psId",
      select: "name", // Only fetch the name and name_in_marathi fields from police station model
    });

    res.status(200).json({ record });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

const getTenantList = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const psId = req.query.psId;

  const filter = {};

  if (psId) {
    filter.psId = psId;
  }

  try {
    const count = await Tenant.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const data = await Tenant.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getTenantListByFilter = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;

  const filter = {}; // Initialize an empty filter object

  // Add filters based on query parameters
  if (req.query.fullName) {
    filter.fullName = { $regex: req.query.fullName, $options: "i" };
  }
  if (req.query.contactNo) {
    filter.contactNo = req.query.contactNo;
  }
  if (req.query.psId) {
    filter.psId = req.query.psId;
  }
  if (req.query.rentPropertyPincode) {
    filter.rentPropertyPincode = req.query.rentPropertyPincode;
  }
  if (req.query.tenantName) {
    filter.tenantName = { $regex: req.query.tenantName, $options: "i" };
  }
  if (req.query.tenantIdentityProofNo) {
    filter.tenantIdentityProofNo = req.query.tenantIdentityProofNo;
  }
  if (req.query.tenantMobNo) {
    filter.tenantMobNo = req.query.tenantMobNo;
  }
  if (req.query.reg_id) {
    filter.reg_id = req.query.reg_id;
  }

  try {
    // Retrieve count of documents matching the filter
    const count = await Tenant.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages

    // Retrieve filtered data with pagination and sorting
    const data = await Tenant.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteTenant = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await Tenant.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.ownerPhoto) {
      await deleteObjectFromS3(record.ownerPhoto);
    }
    if (record.tenantPhoto) {
      await deleteObjectFromS3(record.tenantPhoto);
    }
    if (record.tenantIdentityProofDoc) {
      await deleteObjectFromS3(record.tenantIdentityProofDoc);
    }
    // Delete the record from MongoDB
    await Tenant.findByIdAndDelete(Id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const createIndustryComplaint = async (req, res, next) => {
  let fileLinks = [];
  try {
    const storage = multer.memoryStorage();
    const upload = multer({
      storage,
      fileFilter: function (req, file, cb) {
        const allowedExtensions = [".png", ".jpg", ".jpeg", ".webp", ".pdf"];
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (allowedExtensions.includes(fileExtension)) {
          cb(null, true);
        } else {
          cb(
            new Error(
              "Invalid file format. Only PNG, JPG, JPEG, and PDF files are allowed."
            ),
            false
          );
        }
      },
    }).fields([{ name: "files", maxCount: 5 }]);

    upload(req, res, async function (err) {
      if (err) {
        // Handle error
        return next(err);
      }

      const uploadedFiles = req.files.files || [];

      // Upload files to S3 and collect links
      for (const file of uploadedFiles) {
        const fileExtension = path.extname(file.originalname).toLowerCase();
        if (fileExtension === ".pdf") {
          const fileLink = await uploadPdfToS3(file); // Function to upload PDF file to S3
          fileLinks.push(fileLink);
        } else {
          const fileLink = await uploadImageToS3(file); // Function to upload image file to S3
          fileLinks.push(fileLink);
        }
      }

      // Create Complaint model instance and save to database
      const {
        psId,
        fullName,
        contactNo,
        email,
        street,
        address,
        city,
        state,
        country,
        pinCode,
        complaint,
        subject,
      } = req.body;

      const reg_id = uid.rnd();

      const newComplaint = new IndustryComplaint({
        psId,
        fullName,
        contactNo,
        email,
        street,
        address,
        city,
        state,
        country,
        pinCode,
        complaint,
        subject,
        files: fileLinks,
        reg_id: reg_id,
      });

      await newComplaint.save();

      res.status(201).json({
        success: true,
        message: "New Industry complaint created successfully!",
        id: newComplaint._id,
      });
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getIndustryComplaintList = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const psId = req.query.psId;

  const filter = {};

  if (psId) {
    filter.psId = psId;
  }

  try {
    const count = await IndustryComplaint.countDocuments(filter);
    const totalPages = Math.ceil(count / limit); // Calculate total pages
    const data = await IndustryComplaint.find(filter)
      .populate({
        path: "psId",
        select: "name name_in_marathi", // Only fetch the name and name_in_marathi fields
      })
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      total: count,
      current_page: page,
      total_pages: totalPages,
      data: data,
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const deleteOnlineIndustryComplaint = async (req, res, next) => {
  try {
    const { Id } = req.query;

    const record = await IndustryComplaint.findById(Id);

    if (!record) {
      const error = new HttpError("Record not found", 404);
      return next(error);
    }

    if (record.files && record.files.length > 0) {
      for (let i = 0; i < record.files.length; i++) {
        await deleteObjectFromS3(record.files[i]);
      }
    }
    // Delete the record from MongoDB
    await IndustryComplaint.findByIdAndDelete(Id);

    res.json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "Something went wrong" });
  }
};

const getOnlineIndustryComplaintbyId = async (req, res, next) => {
  const { Id } = req.query;
  try {
    const record = await IndustryComplaint.findById(Id).populate({
      path: "psId",
      select: "name", // Only fetch the name and name_in_marathi fields from police station model
    });

    res.status(200).json({ record });
  } catch (err) {
    return res
      .status(500)
      .json({ success: false, message: "something went wrong" });
  }
};

exports.createComplaint = createComplaint;

exports.getComplaintList = getComplaintList;

exports.deleteOnlineComplaint = deleteOnlineComplaint;

exports.getOnlineComplaintbyId = getOnlineComplaintbyId;

exports.createLostFound = createLostFound;

exports.getLostFoundList = getLostFoundList;

exports.deleteLostFound = deleteLostFound;

exports.getLostFoundbyId = getLostFoundbyId;

exports.createFeedback = createFeedback;

exports.getFeedbackList = getFeedbackList;

exports.deleteFeedback = deleteFeedback;

exports.getFeedbackbyId = getFeedbackbyId;

exports.createTenantInfo = createTenantInfo;

exports.getTenantDatabyId = getTenantDatabyId;

exports.getTenantList = getTenantList;

exports.getTenantListByFilter = getTenantListByFilter;

exports.deleteTenant = deleteTenant;

exports.createIndustryComplaint = createIndustryComplaint;

exports.getIndustryComplaintList = getIndustryComplaintList;

exports.deleteOnlineIndustryComplaint = deleteOnlineIndustryComplaint;

exports.getOnlineIndustryComplaintbyId = getOnlineIndustryComplaintbyId;
