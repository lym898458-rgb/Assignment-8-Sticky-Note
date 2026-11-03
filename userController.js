const bcrypt = require("bcryptjs");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, age } = req.body;

  const existingUser = await User.findOne({ email: String(email || "").toLowerCase() });
  if (existingUser) {
    return res.status(409).json({ message: "Email already exists" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email,
    password: hashedPassword,
    phone,
    age
  });

  res.status(201).json({
    message: "User created successfully",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age
    }
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email: String(email || "").toLowerCase() });
  if (!user) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatch = await bcrypt.compare(password || "", user.password);
  if (!passwordMatch) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  res.status(200).json({
    message: "Login successful",
    user: {
      _id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      age: user.age
    }
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const userId = req.params.id || req.query.id;
  const updates = { ...req.body };

  delete updates.password;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  if (!userId || !validateObjectId(userId)) {
    return res.status(400).json({ message: "Valid user id is required" });
  }

  if (updates.email) {
    updates.email = String(updates.email).toLowerCase();
    const existingUser = await User.findOne({
      email: updates.email,
      _id: { $ne: userId }
    });

    if (existingUser) {
      return res.status(409).json({ message: "Email already exists" });
    }
  }

  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true
  }).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    message: "User updated successfully",
    user
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const userId = req.query.id;

  if (!userId || !validateObjectId(userId)) {
    return res.status(400).json({ message: "Valid user id is required" });
  }

  const user = await User.findByIdAndDelete(userId).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({
    message: "User deleted successfully",
    user
  });
});

const getUser = asyncHandler(async (req, res) => {
  const userId = req.query.id;

  if (!userId || !validateObjectId(userId)) {
    return res.status(400).json({ message: "Valid user id is required" });
  }

  const user = await User.findById(userId).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json({ user });
});

module.exports = {
  signup,
  login,
  updateUser,
  deleteUser,
  getUser
};