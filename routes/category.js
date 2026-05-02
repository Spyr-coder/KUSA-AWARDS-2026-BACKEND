const express = require("express");
const router = express.Router();

const {
  createCategory,
  getCategoriesAdmin,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { prisma } = require("../lib/prisma");

// =========================
// ADMIN ROUTES
// =========================

// CREATE CATEGORY
router.post("/", authMiddleware, adminMiddleware, createCategory);

// GET ALL CATEGORIES (ADMIN VIEW)
router.get("/", authMiddleware, adminMiddleware, getCategoriesAdmin);

// =========================
// PUBLIC ROUTE (FOR STUDENTS)
// =========================
router.get("/public", authMiddleware, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
    });

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// =========================
// DELETE CATEGORY (NEW)
// =========================
router.delete("/:id", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.category.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({
        error: "Category not found",
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({
      error: "Failed to delete category",
    });
  }
});

module.exports = router;