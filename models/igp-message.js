const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const igpMessageSchema = new Schema({
  name: { type: String, required: true },
  name_in_marathi: { type: String, required: true },
  post: { type: String, required: true },
  post_in_marathi: { type: String, required: true },
  photo: { type: String, required: true },
  message: { type: String, required: true },
  message_in_marathi: { type: String },
  tag: { type: String, required: true }, //igp
});

module.exports = mongoose.model("IGPMessage", igpMessageSchema); 