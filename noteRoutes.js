const express = require("express");
const {
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
} = require("../controllers/noteController");

const router = express.Router();

router.post("/", createNote);
router.patch("/all", updateAllTitles);
router.get("/paginate-sort", paginateSortNotes);
router.get("/note-by-content", getNoteByContent);
router.get("/note-with-user", getNotesWithUser);
router.get("/aggregate", aggregateNotes);
router.put("/replace/:noteId", replaceNote);
router.patch("/:noteId", updateNote);
router.delete("/:noteId", deleteNote);
router.get("/:id", getNoteById);
router.delete("/", deleteAllNotes);

module.exports = router;