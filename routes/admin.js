const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const { prisma } = require("../lib/prisma");

/* =========================
   CREATE CATEGORY
========================= */
router.post("/category", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Category name required" });
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    res.json({
      success: true,
      category,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
});

/* =========================
   TOGGLE CATEGORY (OPEN / CLOSE)
========================= */
router.patch(
  "/category/:id/toggle",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const category = await prisma.category.findUnique({
        where: { id },
      });

      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      const updated = await prisma.category.update({
        where: { id },
        data: {
          isActive: !category.isActive,
        },
      });

      res.json({
        success: true,
        category: updated,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to toggle category" });
    }
  }
);

/* =========================
   APPROVE NOMINEE
========================= */
router.put(
  "/nominee/:id/approve",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      const nominee = await prisma.nominee.update({
        where: { id },
        data: { approved: true },
      });

      res.json({
        success: true,
        nominee,
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to approve nominee" });
    }
  }
);

/* =========================
   DELETE NOMINEE
========================= */
router.delete(
  "/nominee/:id",
  authMiddleware,
  adminMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      await prisma.nominee.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Nominee removed successfully",
      });
    } catch (err) {
      res.status(500).json({ error: "Failed to delete nominee" });
    }
  }
);

/* =========================
   SETTINGS CONTROL (SAFE UPDATE)
========================= */
router.put("/settings", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { nominationsOpen, votingOpen } = req.body;

    let settings = await prisma.setting.findFirst();

    if (!settings) {
      settings = await prisma.setting.create({
        data: {
          nominationsOpen: !!nominationsOpen,
          votingOpen: !!votingOpen,
        },
      });
    } else {
      settings = await prisma.setting.update({
        where: { id: settings.id },
        data: {
          nominationsOpen: !!nominationsOpen,
          votingOpen: !!votingOpen,
        },
      });
    }

    res.json({
      success: true,
      settings,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to update settings" });
  }
});

/* =========================
   VIEW ALL VOTES (ADMIN ONLY)
========================= */
router.get("/votes", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const votes = await prisma.vote.findMany({
      include: {
        category: true,
        nominee: true,
        user: true,
      },
      orderBy: { createdAt: "desc" },
    });

    res.json(votes);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch votes" });
  }
});

/* =========================
   AUDIT LOGS
========================= */
router.get("/logs", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch logs" });
  }
});

/* =========================
   SET WINNER (MANUAL OVERRIDE)
========================= */
router.post("/winner", authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { categoryId, nomineeId } = req.body;

    if (!categoryId || !nomineeId) {
      return res.status(400).json({
        error: "categoryId and nomineeId required",
      });
    }

    const winner = await prisma.category.update({
      where: { id: categoryId },
      data: {
        winnerId: nomineeId,
      },
    });

    res.json({
      success: true,
      message: "Winner selected successfully",
      winner,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to set winner" });
  }
});

module.exports = router;