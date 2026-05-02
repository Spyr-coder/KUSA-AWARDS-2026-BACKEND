const { prisma } = require("../lib/prisma");

/* =========================
   UPLOAD IMAGE (FIXED)
========================= */
exports.uploadNomineeImage = async (req, res) => {
  try {
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        error: "No image uploaded",
      });
    }

    // ✅ CLOUDINARY URL (IMPORTANT)
    const imageUrl = req.file.path;

    const updated = await prisma.nominee.update({
      where: { id },
      data: {
        image: imageUrl,
      },
    });

    return res.json({
      success: true,
      nominee: updated,
    });

  } catch (err) {
    console.error("UPLOAD ERROR:", err);

    return res.status(500).json({
      error: "Failed to upload image",
    });
  }
};

/* =========================
   CREATE NOMINEE (FIXED)
========================= */
exports.createNominee = async (req, res) => {
  try {
    const { name, description, categoryId } = req.body;

    const imageUrl = req.file ? req.file.path : null;

    const nominee = await prisma.nominee.create({
      data: {
        name,
        description,
        image: imageUrl,
        categoryId,
        approved: false,
      },
    });

    res.json(nominee);

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   GET ALL NOMINEES
========================= */
exports.getNominees = async (req, res) => {
  try {
    const nominees = await prisma.nominee.findMany({
      include: {
        category: true,
      },
    });

    res.json(nominees);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   DELETE NOMINEE
========================= */
exports.deleteNominee = async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.nominee.delete({
      where: { id },
    });

    res.json({ success: true, message: "Nominee deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   APPROVE NOMINEE
========================= */
exports.approveNominee = async (req, res) => {
  try {
    const { id } = req.params;

    const nominee = await prisma.nominee.update({
      where: { id },
      data: { approved: true },
    });

    res.json({ success: true, nominee });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};