const mongoose = require("mongoose");
const Note = require("../models/Note");
const asyncHandler = require("../utils/asyncHandler");
const validateObjectId = require("../utils/validateObjectId");

const getUserId = (req) => req.query.userId || req.query.id;

const checkIds = (res, userId, noteId) => {
  if (!userId || !validateObjectId(userId)) {
    res.status(400).json({ message: "Valid user id is required" });
    return false;
  }

  if (noteId && !validateObjectId(noteId)) {
    res.status(400).json({ message: "Valid note id is required" });
    return false;
  }

  return true;
};

const createNote = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const note = await Note.create({
    title: req.body.title,
    content: req.body.content,
    userId
  });

  res.status(201).json({
    message: "Note created successfully",
    note
  });
});

const updateNote = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { noteId } = req.params;

  if (!checkIds(res, userId, noteId)) return;

  const updates = { ...req.body };
  delete updates.userId;
  delete updates._id;
  delete updates.createdAt;
  delete updates.updatedAt;

  const note = await Note.findOneAndUpdate(
    { _id: noteId, userId },
    updates,
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({ message: "Note not found for this user" });
  }

  res.status(200).json({
    message: "Note updated successfully",
    note
  });
});

const replaceNote = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { noteId } = req.params;

  if (!checkIds(res, userId, noteId)) return;

  const note = await Note.findOneAndReplace(
    { _id: noteId, userId },
    {
      title: req.body.title,
      content: req.body.content,
      userId
    },
    { new: true, runValidators: true }
  );

  if (!note) {
    return res.status(404).json({ message: "Note not found for this user" });
  }

  res.status(200).json({
    message: "Note replaced successfully",
    note
  });
});

const updateAllTitles = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const result = await Note.updateMany(
    { userId },
    { $set: { title: req.body.title } },
    { runValidators: true }
  );

  res.status(200).json({
    message: "Notes titles updated successfully",
    modifiedCount: result.modifiedCount
  });
});

const deleteNote = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { noteId } = req.params;

  if (!checkIds(res, userId, noteId)) return;

  const note = await Note.findOneAndDelete({ _id: noteId, userId });

  if (!note) {
    return res.status(404).json({ message: "Note not found for this user" });
  }

  res.status(200).json({
    message: "Note deleted successfully",
    note
  });
});

const paginateSortNotes = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit, 10) || 10, 1);
  const skip = (page - 1) * limit;

  const [notes, totalNotes] = await Promise.all([
    Note.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Note.countDocuments({ userId })
  ]);

  res.status(200).json({
    page,
    limit,
    totalNotes,
    totalPages: Math.ceil(totalNotes / limit),
    notes
  });
});

const getNoteById = asyncHandler(async (req, res) => {
  const userId = getUserId(req);
  const { id } = req.params;

  if (!checkIds(res, userId, id)) return;

  const note = await Note.findOne({ _id: id, userId });

  if (!note) {
    return res.status(404).json({ message: "Note not found for this user" });
  }

  res.status(200).json({ note });
});

const getNoteByContent = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const notes = await Note.find({
    userId,
    content: req.query.content
  });

  res.status(200).json({ notes });
});

const getNotesWithUser = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const notes = await Note.find({ userId })
    .select("title userId createdAt")
    .populate("userId", "email");

  res.status(200).json({ notes });
});

const aggregateNotes = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const pipeline = [
    {
      $match: {
        userId: new mongoose.Types.ObjectId(userId)
      }
    },
    {
      $lookup: {
        from: "users",
        localField: "userId",
        foreignField: "_id",
        as: "user"
      }
    },
    {
      $unwind: "$user"
    },
    {
      $project: {
        title: 1,
        content: 1,
        userId: 1,
        createdAt: 1,
        updatedAt: 1,
        name: "$user.name",
        email: "$user.email"
      }
    }
  ];

  if (req.query.title) {
    pipeline.splice(1, 0, {
      $match: {
        title: { $regex: req.query.title, $options: "i" }
      }
    });
  }

  const notes = await Note.aggregate(pipeline);

  res.status(200).json({ notes });
});

const deleteAllNotes = asyncHandler(async (req, res) => {
  const userId = getUserId(req);

  if (!checkIds(res, userId)) return;

  const result = await Note.deleteMany({ userId });

  res.status(200).json({
    message: "All notes deleted successfully",
    deletedCount: result.deletedCount
  });
});

module.exports = {
  createNote,
  updateNote,
  replaceNote,
  updateAllTitles,
  deleteNote,
  paginateSortNotes,
  getNoteById,
  getNoteByContent,
  getNotesWithUser,
  aggregateNotes,
  deleteAllNotes
};