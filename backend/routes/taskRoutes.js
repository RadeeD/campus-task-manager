const express = require("express");
const router = express.Router();

const verifyToken =
require("../middleware/authMiddleware");

const {
    createTask,
    getTasks,
    updateTask,
    deleteTask,
    getStats,
    getNearestDeadline
} = require("../controllers/taskController");

router.post("/", verifyToken, createTask);

router.get("/", verifyToken, getTasks);

router.put("/:id", verifyToken, updateTask);

router.delete("/:id", verifyToken, deleteTask);

router.get("/stats", verifyToken, getStats);

router.get(
    "/nearest",
    verifyToken,
    getNearestDeadline
);

module.exports = router;