const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const linkedOrgSchema = new mongoose.Schema({
  organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
  organization_name: String,
  assigned_date: Date,
  role_in_org: { type: String, enum: ["admin", "observer", "supervisor"], default: "admin" },
});

const securityQuestionSchema = new mongoose.Schema({
  question: String,
  answer_hash: String,
});

const notificationSchema = new mongoose.Schema({
  type: String,
  message: String,
  read: { type: Boolean, default: false },
  timestamp: Date,
});

const auditLogSchema = new mongoose.Schema({
  action: String,
  target: String,
  description: String,
  timestamp: Date,
  ip_address: String,
  device_info: String,
});

const superAdminSchema = new mongoose.Schema({
  first_name: String,
  last_name: String,
  username: { type: String, unique: false }, // not unique to avoid duplicate nulls
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  contact_number: String,
  profile_picture: String,
  role: { type: String, default: "superAdmin" },
  access_level: { type: String, enum: ["system", "organization"], default: "system" },
  permissions: {
    manage_organizations: Boolean,
    manage_users: Boolean,
    manage_departments: Boolean,
    manage_roles: Boolean,
    manage_payroll: Boolean,
    manage_attendance: Boolean,
    manage_leave: Boolean,
    manage_assets: Boolean,
    manage_announcement: Boolean,
    view_reports: Boolean,
    manage_settings: Boolean,
    create_backup: Boolean,
    restore_backup: Boolean,
  },
  linked_organizations: [linkedOrgSchema],
  status: { type: String, enum: ["active", "suspended", "deactivated"], default: "active" },
  account_verified: Boolean,
  email_verified: Boolean,
  last_login: Date,
  last_ip: String,
  security: {
    two_factor_enabled: Boolean,
    two_factor_method: { type: String, enum: ["sms", "email", "authenticator"] },
    login_attempts: Number,
    lock_until: Date,
    password_last_changed: Date,
    security_questions: [securityQuestionSchema],
  },
  notifications: [notificationSchema],
  preferences: {
    language: String,
    theme: { type: String, enum: ["dark", "light"] },
    timezone: String,
    dashboard_layout: String,
    notification_preferences: {
      email_alerts: Boolean,
      sms_alerts: Boolean,
      push_notifications: Boolean,
    },
  },
  audit_logs: [auditLogSchema],
  system_activity: {
    total_organizations_created: Number,
    total_users_created: Number,
    total_logins: Number,
    last_backup_date: Date,
  },
  created_by: String,
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
  deleted_at: Date,
});

module.exports = mongoose.model("SuperAdmin", superAdminSchema);
