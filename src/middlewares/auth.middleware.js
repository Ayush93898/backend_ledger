const tokenBlackListModel = require("../models/blackList.model");
const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");

// middleware function
const authMiddleware = async (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  // now check khi token blackListed toh nahi hai
  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId);
    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
};

const systemUserMiddleware = async (req, res, next) => {
  // first check the token
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({
      message: "Unauthorized access, token is missing",
    });
  }

  // now check khi token blackListed toh nahi hai
  const isBlackListed = await tokenBlackListModel.findOne({ token });
  if (isBlackListed) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
  
  //   check user is systemUser or not
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await userModel.findById(decoded.userId).select("+systemUser");
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, not a system user",
      });
    }

    req.user = user;
    return next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized access, token is invalid",
    });
  }
};
module.exports = { authMiddleware, systemUserMiddleware };
