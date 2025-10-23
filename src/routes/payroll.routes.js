const express = require("express");
const router = express.Router();
const {
  createPayroll,
  updatePayroll,
  getPayrollById,
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
router.put("/:payrollId", verifyToken, updatePayroll);

// Get Payroll by ID (SuperAdmin or Org Admin)
router.get("/:payrollId",  getPayrollById);

// Get all Payrolls for an Organization (SuperAdmin view)
router.get(
  "/organization/getall/:orgId",
  verifyToken,
  getPayrollsByOrganization
);

// Soft Delete Payroll (Org Admin only)
router.delete(
  "/:payrollId",
  verifyToken,
  deletePayroll
);

module.exports = router;
