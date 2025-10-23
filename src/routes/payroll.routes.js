const express = require("express");
const router = express.Router();
const {
  createPayroll,
  updatePayroll,
  getPayrollById,
  getPayrollsForOrg,
  deletePayroll,
  getPayrollsByOrganization,
} = require("../controllers/payroll.controller");

const {
  verifyToken,
  verifyOrganizationAdmin,
} = require("../middlewares/authMiddleware");

// Create Payroll (Org Admin only)
router.post("/create", verifyToken, verifyOrganizationAdmin, createPayroll);

// Update Payroll (Org Admin only)
router.put("/:payrollId", verifyToken, verifyOrganizationAdmin, updatePayroll);

// Get Payroll by ID (SuperAdmin or Org Admin)
router.get("/:payrollId", verifyToken, verifyOrganizationAdmin, getPayrollById);

// Get all Payrolls for an Organization (Org Admin view)
router.get(
  "/organization/:orgId",
  verifyToken,
  verifyOrganizationAdmin,
  getPayrollsForOrg
);

// Get all Payrolls for an Organization (SuperAdmin view)
router.get(
  "/organization/getall/:orgId",
  verifyToken,
  verifyOrganizationAdmin,
  getPayrollsByOrganization
);

// Soft Delete Payroll (Org Admin only)
router.delete(
  "/:payrollId",
  verifyToken,
  verifyOrganizationAdmin,
  deletePayroll
);

module.exports = router;
