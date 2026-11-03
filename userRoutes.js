const express = require("express");
const {
  signup,
  login,
  updateUser,
  deleteUser,
  getUser
} = require("../controllers/userController");

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.patch("/:id", updateUser);
router.delete("/", deleteUser);
router.get("/", getUser);

module.exports = router;