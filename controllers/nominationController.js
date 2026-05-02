const { prisma } = require("../lib/prisma");

/* =========================
   SUBMIT NOMINATION (USER)
========================= */
exports.submitNomination = async (req, res) => {
  try {
    // =========================
    // USER VALIDATION
    // =========================
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Unauthorized user",
      });
    }

    const userId = req.user.id;

    // =========================
    // INPUT CLEANING
    // =========================
    const { nomineeName, contact, categoryId, reason } = req.body;

    const name = (nomineeName || "").trim();
    const cleanContact = (contact || "").trim();
    const categoryIdStr = String(categoryId || "").trim();
    const cleanReason = (reason || "").trim();

    console.log("🔥 NOMINATION DEBUG:", {
      name,
      cleanContact,
      categoryIdStr,
      userId,
    });

    // =========================
    // VALIDATION
    // =========================
    if (!name || !cleanContact || !categoryIdStr) {
      return res.status(400).json({
        error: "Name, contact and category are required",
      });
    }

    // =========================
    // CHECK SETTINGS
    // =========================
    const settings = await prisma.setting.findFirst();

    if (!settings?.nominationsOpen) {
      return res.status(403).json({
        error: "Nominations are currently closed",
      });
    }

    // =========================
    // CHECK CATEGORY EXISTS
    // =========================
    const categoryExists = await prisma.category.findUnique({
      where: {
        id: categoryIdStr,
      },
    });

    if (!categoryExists) {
      return res.status(400).json({
        error: "Category does not exist",
      });
    }

    // =========================
    // PREVENT DUPLICATE NOMINATION
    // =========================
    const existing = await prisma.nomination.findMany({
      where: {
        userId,
      },
      include: {
        nominee: true,
      },
    });

    const duplicate = existing.find(
      (n) => n.nominee?.categoryId === categoryIdStr
    );

    if (duplicate) {
      return res.status(400).json({
        error: "You already nominated in this category",
      });
    }

    // =========================
    // TRANSACTION
    // =========================
    const result = await prisma.$transaction(async (tx) => {
      // CREATE NOMINEE
      const nominee = await tx.nominee.create({
        data: {
          name,
          contact: cleanContact,
          categoryId: categoryIdStr,
          description: cleanReason || null,
          approved: false,
        },
      });

      // CREATE NOMINATION
      const nomination = await tx.nomination.create({
        data: {
          userId,
          nomineeId: nominee.id,
          reason: cleanReason || null,
        },
      });

      return {
        nominee,
        nomination,
      };
    });

    return res.json({
      success: true,
      message: "Nomination submitted successfully",
      ...result,
    });

  } catch (err) {
    console.error("🔥 NOMINATION ERROR:", {
      message: err.message,
      code: err.code,
      stack: err.stack,
    });

    return res.status(500).json({
      error: "Failed to submit nomination",
    });
  }
};

/* =========================
   GET MY NOMINATIONS
========================= */
exports.getMyNominations = async (req, res) => {
  try {
    // =========================
    // USER VALIDATION
    // =========================
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        error: "Unauthorized user",
      });
    }

    const nominations = await prisma.nomination.findMany({
      where: {
        userId: req.user.id,
      },

      include: {
        nominee: {
          include: {
            category: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: nominations.length,
      nominations,
    });

  } catch (err) {
    console.error("🔥 GET MY NOMINATIONS ERROR:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      error: "Failed to fetch nominations",
    });
  }
};

/* =========================
   ADMIN: GET ALL NOMINATIONS
========================= */
exports.getAllNominations = async (req, res) => {
  try {
    const nominations = await prisma.nomination.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },

        nominee: {
          include: {
            category: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

    return res.json({
      success: true,
      count: nominations.length,
      nominations,
    });

  } catch (err) {
    console.error("🔥 GET ALL NOMINATIONS ERROR:", {
      message: err.message,
      stack: err.stack,
    });

    return res.status(500).json({
      error: "Failed to fetch all nominations",
    });
  }
};