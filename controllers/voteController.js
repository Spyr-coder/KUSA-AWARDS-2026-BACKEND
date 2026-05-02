const { prisma } = require("../lib/prisma");
const crypto = require("crypto");

/* =========================
   SUBMIT VOTE (HARDENED)
========================= */
exports.submitVote = async (req, res) => {
  try {
    const userId = req.user?.id;

    // BLOCK ADMINS FROM VOTING
    if (req.user.role === "ADMIN") {
      return res.status(403).json({
        error: "Admins cannot vote",
      });
    }

    // GET REQUEST DATA
    const { categoryId, nomineeId } = req.body;

    // DEBUG
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    console.log("DB USER:", dbUser);

    // CHECK AUTH
    if (!userId) {
      return res.status(401).json({
        error: "Unauthorized",
      });
    }

    // VALIDATE INPUT
    if (!categoryId || !nomineeId) {
      return res.status(400).json({
        error: "Missing vote data",
      });
    }

    /* =========================
       CHECK SETTINGS
    ========================== */
    const settings = await prisma.setting.findFirst();

    if (!settings || !settings.votingOpen) {
      return res.status(403).json({
        error: "Voting is closed",
      });
    }

    /* =========================
       VERIFY CATEGORY IS ACTIVE
    ========================== */
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category || !category.isActive) {
      return res.status(403).json({
        error: "Invalid or inactive category",
      });
    }

    /* =========================
       VERIFY NOMINEE EXISTS + APPROVED
    ========================== */
    const nominee = await prisma.nominee.findUnique({
      where: { id: nomineeId },
    });

    if (!nominee || !nominee.approved) {
      return res.status(403).json({
        error: "Invalid or unapproved nominee",
      });
    }

    /* =========================
       ENSURE NOMINEE BELONGS TO CATEGORY
    ========================== */
    if (nominee.categoryId !== categoryId) {
      return res.status(403).json({
        error: "Nominee does not belong to this category",
      });
    }

    /* =========================
       DEVICE FINGERPRINT
    ========================== */
    const rawDevice =
      (req.headers["user-agent"] || "") +
      (req.headers["accept-language"] || "");

    const deviceHash = crypto
      .createHash("sha256")
      .update(rawDevice)
      .digest("hex");

    const ipAddress =
      req.headers["x-forwarded-for"]?.split(",")[0] ||
      req.socket.remoteAddress ||
      "unknown";

    /* =========================
       TRANSACTION (ANTI-DOUBLE VOTE)
    ========================== */
    const vote = await prisma.$transaction(async (tx) => {
      const existing = await tx.vote.findFirst({
        where: {
          userId,
          categoryId,
        },
      });

      if (existing) {
        throw new Error("ALREADY_VOTED");
      }

      const newVote = await tx.vote.create({
        data: {
          userId,
          categoryId,
          nomineeId,
          ipAddress,
          deviceHash,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "VOTE_SUBMITTED",
          userId,
          details: `Vote cast in category ${categoryId}`,
          ipAddress,
          device: deviceHash,
        },
      });

      return newVote;
    });

    return res.json({
      success: true,
      vote,
    });

  } catch (err) {
    if (err.message === "ALREADY_VOTED") {
      return res.status(400).json({
        error: "You already voted in this category",
      });
    }

    console.error("VOTE ERROR:", err);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
};