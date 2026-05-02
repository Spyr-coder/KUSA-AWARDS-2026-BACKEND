const { prisma } = require("../lib/prisma");

// CREATE CATEGORY
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await prisma.category.create({
      data: {
        name,
        description,
      },
    });

    res.json(category);
  } catch (err) {
    res.status(500).json({ error: "Failed to create category" });
  }
};

// GET ALL CATEGORIES (ADMIN VIEW)
exports.getCategoriesAdmin = async (req, res) => {
  const categories = await prisma.category.findMany({
    include: {
      nominees: true,
      _count: {
        select: { votes: true },
      },
    },
  });

  res.json(categories);
};