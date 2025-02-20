const express = require("express");
const verifyTokenMiddleware = require("../middleware/verifyToken");
const dgpMessageControllers = require("../controllers/dgp-message-controllers");

const router = express.Router();

router.post(
  "/add-dgp-message",
  verifyTokenMiddleware,
  dgpMessageControllers.addMessageData
);

router.patch(
  "/update-dgp-message",
  verifyTokenMiddleware,
  dgpMessageControllers.updateMessageData
);

router.get("/get-dgp-message", dgpMessageControllers.getMessageData);

module.exports = router; 