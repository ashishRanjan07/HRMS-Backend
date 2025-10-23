const Payroll = require("../models/payroll.model");
const SuperAdmin = require("../models/superAdmin.model");
const Organization = require("../models/organization.model");

// 1️⃣ Get Payroll by ID (Super Admin or Org Admin)
exports.getPayrollById = async (req, res) => {
  try {
    const { payrollId } = req.params;

    // Optional: Check if SuperAdmin
    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res
        .status(404)
        .json({ status: "failed", message: "Super admin not found" });
    }

    const payroll = await Payroll.findById(payrollId);
    if (!payroll) {
      return res
        .status(404)
        .json({ status: "failed", message: "Payroll not found" });
    }

    // ✅ Optional: You can filter which payrolls SuperAdmin can see based on linked_organizations
    return res.status(200).json({ status: "success", payroll });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// 2️⃣ Get All Payrolls for an Organization (Super Admin Read-only)
exports.getPayrollsByOrganization = async (req, res) => {
  try {
    const { orgId } = req.params;

    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res
        .status(404)
        .json({ status: "failed", message: "Super admin not found" });
    }

    // Check if SuperAdmin has access to this organization
    const isLinked = superAdmin.linked_organizations.some(
      (org) => org.organization_id.toString() === orgId
    );
    if (!isLinked) {
      return res
        .status(403)
        .json({
          status: "failed",
          message: "Not authorized to view this organization payrolls",
        });
    }

    const payrolls = await Payroll.find({ organization_id: orgId });
    return res.status(200).json({ status: "success", payrolls });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Create Payroll
exports.createPayroll = async (req, res) => {
  try {
    const org = req.organization; // verified organization
    const data = req.body;

    // Ensure the payroll is for this organization
    if (data.organization_id !== org._id.toString()) {
      return res
        .status(403)
        .json({
          status: "failed",
          message: "Payroll must belong to your organization",
        });
    }

    const payroll = await Payroll.create(data);
    return res.status(201).json({ status: "success", payroll });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Update Payroll
exports.updatePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const updateData = req.body;

    const payroll = await Payroll.findById(payrollId);
    if (!payroll)
      return res
        .status(404)
        .json({ status: "failed", message: "Payroll not found" });

    // Check org access
    const orgAdmin = req.user;
    const isLinked = orgAdmin.linked_organizations.some(
      (org) =>
        org.organization_id.toString() === payroll.organization_id.toString()
    );
    if (!isLinked)
      return res
        .status(403)
        .json({
          status: "failed",
          message: "Not authorized to update payroll",
        });

    Object.assign(payroll, updateData);
    await payroll.save();
    return res.status(200).json({ status: "success", payroll });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Delete Payroll (Soft Delete)
exports.deletePayroll = async (req, res) => {
  try {
    const { payrollId } = req.params;
    const payroll = await Payroll.findById(payrollId);
    if (!payroll)
      return res
        .status(404)
        .json({ status: "failed", message: "Payroll not found" });

    // Check org access
    const orgAdmin = req.user;
    const isLinked = orgAdmin.linked_organizations.some(
      (org) =>
        org.organization_id.toString() === payroll.organization_id.toString()
    );
    if (!isLinked)
      return res
        .status(403)
        .json({
          status: "failed",
          message: "Not authorized to delete payroll",
        });

    // Soft delete by marking payroll_status
    payroll.payroll_cycle.payroll_status = "Deleted";
    await payroll.save();

    return res
      .status(200)
      .json({
        status: "success",
        message: "Payroll deleted successfully",
        payroll,
      });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Get All Payrolls for Org Admin
exports.getPayrollsForOrg = async (req, res) => {
  try {
    const orgAdmin = req.user;
    const { orgId } = req.params;

    const isLinked = orgAdmin.linked_organizations.some(
      (org) => org.organization_id.toString() === orgId
    );
    if (!isLinked)
      return res
        .status(403)
        .json({ status: "failed", message: "Not authorized to view payrolls" });

    const payrolls = await Payroll.find({ organization_id: orgId });
    return res.status(200).json({ status: "success", payrolls });
  } catch (error) {
    return res.status(500).json({ status: "error", message: error.message });
  }
};
