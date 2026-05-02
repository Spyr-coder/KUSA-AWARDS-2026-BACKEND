const { prisma } = require("../lib/prisma");

/* =========================
   GET CATEGORY RESULTS (ADMIN)
========================= */
exports.getResults = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID required" });
    }

    const results = await prisma.vote.groupBy({
      by: ["nomineeId"],
      where: { categoryId },
      _count: {
        nomineeId: true,
      },
      orderBy: {
        _count: {
          nomineeId: "desc",
        },
      },
    });

    const nomineeIds = results.map(r => r.nomineeId);

    const nominees = await prisma.nominee.findMany({
      where: { id: { in: nomineeIds } },
    });

    const formatted = results.map(r => ({
      nominee: nominees.find(n => n.id === r.nomineeId) || null,
      votes: r._count.nomineeId,
    }));

    return res.json(formatted);

  } catch (err) {
    console.error("GET RESULTS ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch results",
    });
  }
};


/* =========================
   GET SINGLE CATEGORY WINNER
========================= */
exports.getWinner = async (req, res) => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      return res.status(400).json({ error: "Category ID required" });
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    let winner = null;
    let votes = 0;

    // ✅ PRIORITY 1: ADMIN WINNER
    if (category.winnerId) {
      winner = await prisma.nominee.findUnique({
        where: { id: category.winnerId },
      });
    }

    // ✅ FALLBACK: TOP VOTE
    if (!winner) {
      const topVote = await prisma.vote.groupBy({
        by: ["nomineeId"],
        where: { categoryId },
        _count: {
          nomineeId: true,
        },
        orderBy: {
          _count: {
            nomineeId: "desc",
          },
        },
        take: 1,
      });

      if (topVote.length) {
        winner = await prisma.nominee.findUnique({
          where: { id: topVote[0].nomineeId },
        });

        votes = topVote[0]._count.nomineeId;
      }
    }

    if (!winner) {
      return res.json({
        message: "No winner yet",
      });
    }

    return res.json({
      winner,
      votes,
    });

  } catch (err) {
    console.error("GET WINNER ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch winner",
    });
  }
};


/* =========================
   GET ALL PUBLISHED WINNERS (PUBLIC)
========================= */
exports.getPublishedWinners = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();

    const data = await Promise.all(
      categories.map(async (cat) => {
        let winner = null;

        // ✅ ADMIN OVERRIDE FIRST
        if (cat.winnerId) {
          winner = await prisma.nominee.findUnique({
            where: { id: cat.winnerId },
          });
        }

        // ✅ FALLBACK TO VOTES
        if (!winner) {
          const topVote = await prisma.vote.groupBy({
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
            take: 1,
          });

          if (topVote.length) {
            winner = await prisma.nominee.findUnique({
              where: { id: topVote[0].nomineeId },
            });
          }
        }

        return {
          categoryId: cat.id,
          category: cat.name,
          winner: winner || null,
        };
      })
    );

    return res.json(data);

  } catch (err) {
    console.error("GET PUBLISHED WINNERS ERROR:", err);

    return res.status(500).json({
      error: "Failed to fetch published winners",
    });
  }
};