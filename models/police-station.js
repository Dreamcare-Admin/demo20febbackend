const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const policeStationSchema = new Schema(
  {
    name: { type: String, required: true },
    name_in_marathi: { type: String, required: true },
    photo: { type: String },
    maplink: { type: String },
    address: { type: String },
    address_in_marathi: { type: String },
    email: { type: String },
    contact_no: { type: String },
    contact_no2: { type: String },
    contact_no3: { type: String },
    division: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Division",
    },
    zone: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("PoliceStation", policeStationSchema);
