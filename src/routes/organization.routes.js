const express = require("express");
const router = express.Router();

const {
  createOrganization,
  updateOrganization,
  getOrganizationById,
  softDeleteOrganization,
  getAllOrganizationsBySuperAdmin,
  loginOrganization,
} = require("../controllers/organization.controller");

const { verifyToken, verifySuperAdmin } = require("../middlewares/authMiddleware");

// ✅ Create organization (Protected)
router.post("/create", verifyToken, verifySuperAdmin, createOrganization);

// ✅ Organization login
router.post("/login", loginOrganization);

// ✅ Update organization (Protected)
router.put("/:id", verifyToken, verifySuperAdmin, updateOrganization);

// ✅ Soft delete organization (Protected)
router.delete("/:id", verifyToken, verifySuperAdmin, softDeleteOrganization);

// ✅ Get organization by ID (Protected)
router.get("/:orgId", verifyToken, verifySuperAdmin, getOrganizationById);

//get all organizations for a SuperAdmin
router.get("/superadmin/all", verifyToken, getAllOrganizationsBySuperAdmin);

module.exports = router;
