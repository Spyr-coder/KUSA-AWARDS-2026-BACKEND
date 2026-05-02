const express = require("express");
const router = express.Router();

const {
  createNominee,
  getNominees,
  deleteNominee,
  approveNominee,
  uploadNomineeImage
} = require("../controllers/nomineeController");

const authMiddleware = require("../middleware/authMiddleware");
const adminMiddleware = require("../middleware/adminMiddleware");
const upload = require("../middleware/upload");

/* =========================
   PUBLIC
========================= */
router.get("/", getNominees);

/* =========================
   ADMIN ONLY
========================= */
router.post(
  "/",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  createNominee
);

router.delete(
  "/:id",
  authMiddleware,
  adminMiddleware,
  deleteNominee
);

router.put(
  "/:id/approve",
  authMiddleware,
  adminMiddleware,
  approveNominee
);

/* =========================
   IMAGE UPLOAD (FIXED)
========================= */
router.put(
  "/:id/image",
  authMiddleware,
  adminMiddleware,
  upload.single("image"),
  uploadNomineeImage
);

module.exports = router;