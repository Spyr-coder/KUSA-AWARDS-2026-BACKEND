const { prisma } = require("../lib/prisma");

/* =========================
   DASHBOARD SUMMARY
========================= */
exports.getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalVotes = await prisma.vote.count();
    const totalNominees = await prisma.nominee.count();
    const totalCategories = await prisma.category.count();

    const votingSettings = await prisma.setting.findFirst();

    res.json({
      users: totalUsers,
      votes: totalVotes,
      nominees: totalNominees,
      categories: totalCategories,
      votingOpen: votingSettings?.votingOpen || false,
      nominationsOpen: votingSettings?.nominationsOpen || false,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   VOTES PER CATEGORY
========================= */
exports.getVotesPerCategory = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    const data = await Promise.all(
      categories.map(async (cat) => {
        const votes = await prisma.vote.count({
          where: { categoryId: cat.id },
        });

        return {
          category: cat.name,
          votes,
        };
      })
    );

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/* =========================
   TOP NOMINEES PER CATEGORY
========================= */
exports.getTopNominees = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    const result = await Promise.all(
      categories.map(async (cat) => {
        const top = await prisma.vote.groupBy({
          by: ["nomineeId"],
          where: { categoryId: cat.id },
          _count: {
            nomineeId: true,
          },
          orderBy: {
            _count: {
              nomineeId: "desc",
            },
          },
          take: 3,
        });

        const nominees = await Promise.all(
          top.map(async (t) => {
            const nominee = await prisma.nominee.findUnique({
              where: { id: t.nomineeId },
            });

            return {
              nominee,
              votes: t._count.nomineeId,
            };
          })
        );

        return {
          category: cat.name,
          topNominees: nominees,
        };
      })
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};