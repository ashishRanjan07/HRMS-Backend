const SuperAdmin = require("../models/superAdmin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ✅ Register Super Admin
exports.registerSuperAdmin = async (req, res) => {
  try {
    const {
      first_name,
      last_name,
      email,
      password,
      contact_number,
      username: inputUsername,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "error",
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const existingAdmin = await SuperAdmin.findOne({ email });
    if (existingAdmin) {
      return res.status(409).json({
        status: "error",
        statusCode: 409,
        message: "Email already exists",
      });
    }

    const username =
      inputUsername || `${first_name?.toLowerCase() || "user"}_${Date.now()}`;
    const hashedPassword = await bcrypt.hash(password, 10);

    const superAdmin = new SuperAdmin({
      first_name,
      last_name,
      username,
      email,
      password: hashedPassword,
      contact_number,
      role: "superAdmin",
      access_level: "system",
      permissions: {
        manage_organizations: true,
        manage_users: true,
        manage_departments: true,
        manage_roles: true,
        manage_payroll: true,
        manage_attendance: true,
        manage_leave: true,
        manage_assets: true,
        manage_announcement: true,
        view_reports: true,
        manage_settings: true,
        create_backup: true,
        restore_backup: true,
      },
      account_verified: false,
      email_verified: false,
      status: "active",
      created_by: "system",
      created_at: new Date(),
    });

    await superAdmin.save();

    // ✅ Success response with status and statusCode
    return res.status(201).json({
      status: "success",
      statusCode: 201,
      message: "Super admin registered successfully",
      data: {
        id: superAdmin._id,
        first_name: superAdmin.first_name,
        last_name: superAdmin.last_name,
        email: superAdmin.email,
        username: superAdmin.username,
        contact_number: superAdmin.contact_number,
        role: superAdmin.role,
        access_level: superAdmin.access_level,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error",
    });
  }
};

// ✅ Login Super Admin
exports.loginSuperAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        status: "failed",
        statusCode: 400,
        message: "Email and password are required",
      });
    }

    const superAdmin = await SuperAdmin.findOne({ email });
    if (!superAdmin) {
      return res.status(401).json({
        status: "failed",
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    const isMatch = await bcrypt.compare(password, superAdmin.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "failed",
        statusCode: 401,
        message: "Invalid email or password",
      });
    }

    // ✅ Create JWT Payload
    const payload = {
      id: superAdmin._id,
      email: superAdmin.email,
      role: superAdmin.role,
    };

    // ✅ Sign JWT Token
    const token = jwt.sign(payload, process.env.JWT_SECRET || "your_jwt_secret", {
      expiresIn: "1h", // Token expires in 1 hour
    });

    // ✅ Send success response
    return res.status(200).json({
      status: "success",
      statusCode: 200,
      message: "Login successful",
      token,
      superAdmin: {
        id: superAdmin._id,
        first_name: superAdmin.first_name,
        last_name: superAdmin.last_name,
        email: superAdmin.email,
        username: superAdmin.username,
        role: superAdmin.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      status: "error",
      statusCode: 500,
      message: "Server error",
    });
  }
};

