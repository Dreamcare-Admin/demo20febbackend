const express = require("express");
const verifyTokenMiddleware = require("../middleware/verifyToken");
const igpMessageControllers = require("../controllers/igp-message-controllers");

const router = express.Router();

router.post(
  "/add-igp-message",
  verifyTokenMiddleware,
  igpMessageControllers.addMessageData
);

router.patch(
  "/update-igp-message",
  verifyTokenMiddleware,
  igpMessageControllers.updateMessageData
);

router.get("/get-igp-message", igpMessageControllers.getMessageData);

module.exports = router; 