const OrgAdmin = require("../models/orgAdmin.model");
const jwt = require("jsonwebtoken");

exports.loginOrgAdmin = async (req, res) => {
  try {
    const { organization_id, password } = req.body;

    if (!organization_id || !password) {
      return res.status(400).json({ status: "failed", message: "Organization ID and password are required" });
    }

    // Find OrgAdmin by _id
    const orgAdmin = await OrgAdmin.findById(organization_id);
    if (!orgAdmin) {
      return res.status(401).json({ status: "failed", message: "Invalid credentials" });
    }

    // Compare password
    const isMatch = await orgAdmin.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ status: "failed", message: "Invalid credentials" });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: orgAdmin._id, role: orgAdmin.role, organization_id: orgAdmin._id },
      process.env.JWT_SECRET,
      { expiresIn: "12h" }
    );

    return res.status(200).json({
      status: "success",
      token,
      user: {
        id: orgAdmin._id,
        name: orgAdmin.name,
        organization_code: orgAdmin.organization_code,
        role: orgAdmin.role,
      },
    });
  } catch (error) {
    console.error("OrgAdmin login error:", error);
    return res.status(500).json({ status: "error", message: "Server error", error: error.message });
  }
};
