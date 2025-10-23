const Payroll = require("../models/payroll.model");
const SuperAdmin = require("../models/superAdmin.model");
const Organization = require("../models/organization.model");

// Get Payroll by ID (Super Admin or Org Admin)
exports.getPayrollById = async (req, res) => {
  try {
    console.log("🔍 Get Payroll Request (no auth):", {
      payrollId: req.params.payrollId,
      params: req.params,
      query: req.query,
      body: req.body,
    });

    const { payrollId } = req.params;
    if (!payrollId) {
      console.log("❌ Missing payrollId param");
      return res
        .status(400)
        .json({ status: "failed", message: "Payroll ID is required" });
    }

    const payroll = await Payroll.findById(payrollId);
    console.log("🔎 Payroll lookup:", { payrollId, found: !!payroll });

    if (!payroll) {
      return res
        .status(404)
        .json({ status: "failed", message: "Payroll not found" });
    }

    return res.status(200).json({ status: "success", payroll });
  } catch (error) {
    console.error("🔥 Error in getPayrollById:", error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Create Payroll
exports.createPayroll = async (req, res) => {
  try {
    console.log("📝 Create Payroll Request Body:", req.body);
    console.log("🏢 Organization from middleware:", req.organization);
    const org = req.organization; // verified organization
    const data = req.body;

    // Ensure the payroll is for this organization
    if (data.organization_id !== org._id.toString()) {
      return res.status(403).json({
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

// 2️⃣ Get All Payrolls for an Organization (Super Admin Read-only)
exports.getPayrollsByOrganization = async (req, res) => {
  try {
    console.log("🔍 Get Payrolls By Organization Request:", {
      params: req.params,
      query: req.query,
      body: req.body,
      user: req.user,
    });

    const { orgId } = req.params;
    const bodyOrgId = req.body.organization_id || req.query.organization_id;

    if (!orgId) {
      console.log("❌ Missing orgId in params");
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "Organization ID (param) is required",
      });
    }

    if (!bodyOrgId) {
      console.log("❌ Missing organization_id in request (body/query)");
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "organization_id (body or query) is required for verification",
      });
    }

    console.log("🔗 Comparing orgId param with organization_id from request:", {
      orgId,
      bodyOrgId,
    });

    if (orgId.toString() !== bodyOrgId.toString()) {
      console.log("❌ Organization ID mismatch");
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        message:
          "Organization ID mismatch - not authorized to view this organization's payrolls",
      });
    }

    const payrolls = await Payroll.find({ organization_id: orgId });
    console.log("📊 Payrolls Found:", payrolls.length);

    return res
      .status(200)
      .json({ status: "success", statusCode: 200, payrolls });
  } catch (error) {
    console.error("🔥 Error in getPayrollsByOrganization:", error);
    return res
      .status(500)
      .json({ status: "error", statusCode: 500, message: error.message });
  }
};

// ✅ Update Payroll
exports.updatePayroll = async (req, res) => {
  try {
    console.log("📝 Update Payroll Request:", {
      params: req.params,
      body: req.body,
      user: req.user,
    });

    const { payrollId } = req.params;
    const updateData = req.body;

    if (!payrollId) {
      console.log("❌ Missing payrollId param");
      return res
        .status(400)
        .json({ status: "failed", statusCode: 400, message: "Payroll ID is required" });
    }

    const payroll = await Payroll.findById(payrollId);
    console.log("🔎 Payroll lookup:", { payrollId, found: !!payroll });

    if (!payroll) {
      return res
        .status(404)
        .json({ status: "failed", statusCode: 404, message: "Payroll not found" });
    }

    const payrollOrgId = payroll.organization_id ? payroll.organization_id.toString() : null;

    if (req.user) {
      const userRole = req.user.role;
      const userId = req.user.id ? req.user.id.toString() : null;

      if (userRole === "superAdmin") {
        console.log("🔐 Access granted: superAdmin");
      } else if (userRole === "organization") {
        if (userId === payrollOrgId) {
          console.log("🔐 Access granted: organization id matches payroll org");
        } else {
          const linked = Array.isArray(req.user.linked_organizations)
            ? req.user.linked_organizations.some(
                (o) => o.organization_id?.toString() === payrollOrgId
              )
            : false;

          console.log("🔗 Linked orgs check:", { payrollOrgId, linked });

          if (!linked) {
            console.log("❌ Authorization failed - user not linked to organization");
            return res.status(403).json({
              status: "failed",
              statusCode: 403,
              message: "Not authorized to update payroll",
            });
          }
        }
      } else {
        console.log("❌ Access denied - unsupported role:", userRole);
        return res.status(403).json({
          status: "failed",
          statusCode: 403,
          message: "Not authorized to update payroll",
        });
      }
    } else {
      console.log("⚠️ No authenticated user - falling back to organization_id in body check");
      if (!updateData.organization_id || updateData.organization_id.toString() !== payrollOrgId) {
        return res.status(403).json({
          status: "failed",
          statusCode: 403,
          message: "Not authorized to update payroll",
        });
      }
    }

    const forbidden = ["_id", "id"];
    Object.keys(updateData || {}).forEach((key) => {
      if (!forbidden.includes(key)) payroll[key] = updateData[key];
    });

    await payroll.save();
    console.log("✅ Payroll updated:", payroll._id);

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Payroll updated successfully",
      payroll,
    });
  } catch (error) {
    console.error("🔥 Update Payroll Error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while updating payroll",
      error: error.message,
    });
  }
};

// ✅ Delete Payroll (Soft Delete)
exports.deletePayroll = async (req, res) => {
  try {
    console.log("🗑️ Delete Payroll Request:", {
      payrollId: req.params.payrollId,
      userId: req.user?.id,
      userRole: req.user?.role,
      body: req.body,
    });

    const { payrollId } = req.params;
    if (!payrollId) {
      console.log("❌ Missing payrollId param");
      return res
        .status(400)
        .json({ status: "failed", statusCode: 400, message: "Payroll ID is required" });
    }

    const payroll = await Payroll.findById(payrollId);
    console.log("🔍 Payroll Found:", !!payroll);

    if (!payroll) {
      return res
        .status(404)
        .json({ status: "failed", statusCode: 404, message: "Payroll not found" });
    }

    // Instead of directly setting to "Deleted", use findByIdAndUpdate with a valid status
    const updatedPayroll = await Payroll.findByIdAndUpdate(
      payrollId,
      {
        'payroll_cycle.payroll_status': 'Cancelled', // or another valid enum value like 'Inactive'
        isDeleted: true, // Add this field if you have it in your schema
        deletedAt: new Date(),
        deletedBy: req.user?.id
      },
      { new: true, runValidators: true }
    );

    if (!updatedPayroll) {
      return res
        .status(404)
        .json({ status: "failed", statusCode: 404, message: "Failed to update payroll status" });
    }

    console.log("✅ Payroll successfully marked as deleted:", updatedPayroll._id);
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Payroll deleted successfully",
      payroll: updatedPayroll,
    });

  } catch (error) {
    console.error("🔥 Error in deletePayroll:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while deleting payroll",
      error: error.message,
    });
  }
};

