const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/email.service");
const tokenBlackListModel = require("../models/blackList.model");

// register controller -- POST /api/auth/register
const userRegisterController = async (req, res) => {
  const { email, password, name } = req.body;

  // check email already exist or not
  const isEmailExist = await userModel.findOne({ email });
  if (isEmailExist) {
    return res.status(422).json({
      message: "User already exists with this email",
      status: "failed",
    });
  }

  // save in db
  const user = await userModel.create({
    email,
    password,
    name,
  });

  // gen token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  // send token as a res ---> it saves in cookie and server can use token anytime
  res.cookie("token", token);

  //send res
  res.status(201).json({
    message: "user registered succssfully",
    user: {
      _id: user._id,
      email: user.email,
      name: user.name,
    },
    token,
  });

  // we send email after the user is create and after sending the response
  await emailService.sendRegistrationEmail(user.email, user.name);
};

// login controller -- POST /api/auth/login
const userLoginController = async (req, res) => {
  const { email, password } = req.body;

  // check user already exist or not
  const user = await userModel.findOne({ email }).select("+password");
  if (!user) {
    return res.status(401).json({
      mesage: "Email or Password is invalid",
    });
  }

  // check password is correct or not
  const isValidPassword = await user.comparePassword(password);
  if (!isValidPassword) {
    return res.status(401).json({
      mesage: "Email or Password is invalid",
    });
  }

  // send token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });

  // save in cookie
  res.cookie("token", token);

  // send status
  res.status(200).json({
    message: "User logged-in successfully",
    user: {
      id: user._id,
      email: user.email,
      name: user.name,
    },
  });
};

// logout controller -> but not just clearing the cookies, but token black-listing also (as agr us token ki copy hui kisi ke pass toh hacker aram se le sakta h tumhari.... to basically us token ko blacklist kar dege)

const userLogoutController = async (req, res) => {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(200).json({
      message: "User logged out successfully",
    });
  }

  // clear the token
  res.cookie("token", "");
  await tokenBlackListModel.create({ token: token });
  res.status(200).json({
    message:"User logged out successfully"
  })
};
module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
