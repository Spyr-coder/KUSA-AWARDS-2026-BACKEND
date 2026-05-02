const { prisma } = require("../lib/prisma");

// TOGGLE VOTING
exports.toggleVoting = async (req, res) => {
  try {
    let settings = await prisma.setting.findFirst();

    if (!settings) {
      settings = await prisma.setting.create({
        data: {},
      });
    }

    const updated = await prisma.setting.update({
      where: { id: settings.id },
      data: {
        votingOpen: !settings.votingOpen,
      },
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: "Failed to toggle voting" });
  }
};