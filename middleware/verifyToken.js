const jwt = require("jsonwebtoken");
const secretKey = "dreamcare";

const verifyTokenMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  const [bearer, token] = authHeader.split(" ");

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Token not provided" });
  }

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

    // req.user = decoded; // Attach the user data to the request object
    next();
  });
};

module.exports = verifyTokenMiddleware;
