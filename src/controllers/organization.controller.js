const Organization = require("../models/organization.model");
const SuperAdmin = require("../models/superAdmin.model");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

// ✅ Create Organization
exports.createOrganization = async (req, res) => {
  try {
    const organizationData = req.body;

    // Validate required fields
    if (
      !organizationData ||
      !organizationData.name ||
      !organizationData.password ||
      !organizationData.contact_details?.official_email
    ) {
      return res.status(400).json({
        status: "failed",
        message: "Organization name, password, and official email are required",
      });
    }

    // Get SuperAdmin from JWT token
    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin)
      return res
        .status(404)
        .json({ status: "failed", message: "Super admin not found" });

    // Auto-generate organization code
    if (!organizationData.organization_code) {
      const lastOrg = await Organization.findOne().sort({ createdAt: -1 });
      organizationData.organization_code = lastOrg
        ? `ORG-${parseInt(lastOrg.organization_code.split("-")[1]) + 1}`
        : "ORG-1001";
    }

    // Set created_by
    organizationData.created_by = superAdmin._id;

    // Create organization
    const organization = await Organization.create(organizationData);

    // Link organization to SuperAdmin
    superAdmin.linked_organizations.push({
      organization_id: organization._id,
      organization_name: organization.name,
      assigned_date: new Date(),
      role_in_org: "admin",
    });
    await superAdmin.save();

    return res.status(201).json({
      status: "success",
      message: "Organization created successfully",
      organization,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ status: "error", message: error.message });
  }
};

// ✅ Organization Login
exports.loginOrganization = async (req, res) => {
  try {
    const { organization_id, password } = req.body; // only _id and password

    if (!organization_id || !password) {
      return res.status(400).json({
        status: "failed",
        message: "Organization ID and password are required",
      });
    }

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(organization_id)) {
      return res
        .status(400)
        .json({ status: "failed", message: "Invalid Organization ID" });
    }

    // Find organization by _id
    const organization = await Organization.findById(organization_id);
    if (!organization) {
      return res
        .status(404)
        .json({ status: "failed", message: "Organization not found" });
    }

    // Compare password
    const isMatch = await organization.comparePassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ status: "failed", message: "Invalid credentials" });
    }

    // Generate JWT token
   const token = jwt.sign(
      { id: organization._id, role: "organization" },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      status: "success",
      token,
      organization: {
        id: organization._id,
        name: organization.name,
        organization_code: organization.organization_code,
        contact_email: organization.contact_details?.official_email,
        role: "organization",
      },
    });
  } catch (error) {
    console.error("Organization login error:", error);
    return res
      .status(500)
      .json({ status: "error", message: "Server error", error: error.message });
  }
};

// Update Organization
exports.updateOrganization = async (req, res) => {
  console.log("Update Organization request received");
  try {
    const orgId = req.params.id;
    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "No data provided to update",
      });
    }

    // Optional: Check if SuperAdmin exists
    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Super admin not found",
      });
    }

    const organization = await Organization.findByIdAndUpdate(
      orgId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!organization) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Organization not found",
      });
    }

    console.log(`Organization updated: ${organization.name}`);
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization updated successfully",
      organization,
    });
  } catch (error) {
    console.error("Organization update error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while updating organization",
      error: error.message,
    });
  }
};

// Soft Delete Organization
exports.softDeleteOrganization = async (req, res) => {
  try {
    // support both :id and :orgId route param names
    const orgId = req.params.id || req.params.orgId;
    if (!orgId) {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "Organization id is required in params",
      });
    }

    // 1) Verify super admin from token
    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      console.error(`SuperAdmin not found for id: ${req.user.id}`);
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Super admin not found",
      });
    }

    // 2) Check if superAdmin is linked to this organization
    const isLinked = superAdmin.linked_organizations.some(
      (linked) => linked.organization_id?.toString() === orgId
    );
    if (!isLinked) {
      console.warn(
        `Unauthorized: SuperAdmin ${superAdmin._id} not linked to org ${orgId}`
      );
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        message: "You are not authorized to modify this organization",
      });
    }

    // 3) Find organization
    const organization = await Organization.findById(orgId);
    if (!organization) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Organization not found",
      });
    }

    // 4) If already inactive, return appropriate response
    if (organization.status === "inactive") {
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "Organization is already inactive",
        organization,
      });
    }

    // 5) Mark as inactive (soft delete) and optionally set deletedAt
    organization.status = "inactive";
    organization.deletedAt = new Date(); // optional: keep deletedAt if you have this field
    await organization.save();

    console.log(
      `Organization ${organization._id} marked inactive by SuperAdmin ${superAdmin._id}`
    );

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organization marked as inactive successfully",
      organization,
      performedBy: {
        id: superAdmin._id,
        email: superAdmin.email,
        username: superAdmin.username,
      },
    });
  } catch (error) {
    console.error("Soft Delete Error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while updating organization status",
      error: error.message,
    });
  }
};

// Get Organization by ID
exports.getOrganizationById = async (req, res) => {
  try {
    const { orgId } = req.params;

    // ✅ Get SuperAdmin from JWT
    const superAdmin = await SuperAdmin.findById(req.user.id);
    if (!superAdmin) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Super admin not found",
      });
    }

    // ✅ Verify that the orgId is linked to this SuperAdmin
    const isLinked = superAdmin.linked_organizations.some(
      (org) => org.organization_id.toString() === orgId
    );
    if (!isLinked) {
      return res.status(403).json({
        status: "failed",
        statusCode: 403,
        message: "You are not authorized to access this organization",
      });
    }

    // ✅ Fetch organization (soft-delete aware)
    const organization = await Organization.findOne({ _id: orgId });
    if (!organization) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "Organization not found or inactive",
      });
    }

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      organization,
    });
  } catch (error) {
    console.error("Get Organization Error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while fetching organization",
      error: error.message,
    });
  }
};

// Get All Organizations Linked to the Logged-In SuperAdmin
exports.getAllOrganizationsBySuperAdmin = async (req, res) => {
  try {
    const superAdminId = req.user.id;

    // Find SuperAdmin and check existence
    const superAdmin = await SuperAdmin.findById(superAdminId);
    if (!superAdmin) {
      return res.status(404).json({
        status: "failed",
        statusCode: 404,
        message: "SuperAdmin not found",
      });
    }

    // If no linked organizations found
    if (
      !superAdmin.linked_organizations ||
      superAdmin.linked_organizations.length === 0
    ) {
      return res.status(200).json({
        status: "success",
        statusCode: 200,
        message: "No organizations linked to this SuperAdmin",
        organizations: [],
      });
    }

    // Extract organization IDs from linked_organizations
    const orgIds = superAdmin.linked_organizations.map(
      (org) => org.organization_id
    );

    // Fetch organizations based on linked IDs
    const organizations = await Organization.find({ _id: { $in: orgIds } });

    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Organizations fetched successfully",
      total: organizations.length,
      organizations,
    });
  } catch (error) {
    console.error("Get Organizations Error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error while fetching organizations",
      error: error.message,
    });
  }
};
