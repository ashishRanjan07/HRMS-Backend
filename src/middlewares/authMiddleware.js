require('dotenv').config();
const jwt = require("jsonwebtoken");
const SuperAdmin = require("../models/superAdmin.model");
const Organization = require("../models/organization.model");


exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "Access denied. No token provided.",
    });
  }

  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your_jwt_secret");
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "error",
      statusCode: 401,
      message: "Invalid or expired token.",
    });
  }
};

// ✅ Only allow superAdmin (case-sensitive match)
exports.verifySuperAdmin = (req, res, next) => {
  if (req.user.role !== "superAdmin") {
    return res.status(403).json({
      status: "error",
      statusCode: 403,
      message: "Access denied. Only super admin can perform this action.",
    });
  }
  next();
};
// ✅ Only allow organization admin
exports.verifyOrganizationAdmin = async (req, res, next) => {
  try {
    // Get organization_id from the request body instead of params
    const organization_id = req.body.organization_id;

    if (!req.user || req.user.role !== "organization") {
      return res.status(401).json({
        status: "error",
        statusCode: 401,
        message: "Unauthorized access"
      });
    }

    // Find organization
    const organization = await Organization.findById(req.user.id);
    if (!organization) {
      return res.status(404).json({
        status: "error",
        statusCode: 404,
        message: "Organization not found"
      });
    }

    // Ensure organization_id matches logged-in org
    if (organization._id.toString() !== organization_id) {
      return res.status(403).json({
        status: "error",
        statusCode: 403,
        message: "Not authorized for this organization"
      });
    }

    // Attach organization object to request
    req.organization = organization;
    next();
  } catch (error) {
    console.error("Error in verifyOrganizationAdmin:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error in verifying organization admin"
    });
  }
};
