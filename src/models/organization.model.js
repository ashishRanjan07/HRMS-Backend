const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const organizationSchema = new mongoose.Schema(
  {
    organization_code: { type: String, unique: true, required: true },
    name: { type: String, required: true },
    password: { type: String, required: true }, // mandatory for login
    legal_name: String,
    industry_type: String,
    registration_details: {
      pan_number: String,
      gst_number: String,
      cin_number: String,
      tan_number: String,
    },
    contact_details: {
      official_email: String,
      official_phone: String,
      website: String,
    },
    head_office: {
      address_line1: String,
      address_line2: String,
      city: String,
      state: String,
      country: String,
      pincode: String,
      latitude: Number,
      longitude: Number,
    },
    branches: [
      {
        branch_name: String,
        branch_code: String,
        address: {
          address_line1: String,
          city: String,
          state: String,
          country: String,
          pincode: String,
        },
        contact: {
          email: String,
          phone: String,
        },
        branch_head_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        working_days: [String],
        shift_timings: {
          start_time: String,
          end_time: String,
        },
        departments: [
          {
            department_name: String,
            department_code: String,
            head_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
            description: String,
          },
        ],
      },
    ],
    policies: {
      leave_policy: {
        annual_leaves: Number,
        casual_leaves: Number,
        sick_leaves: Number,
        carry_forward: Boolean,
      },
      attendance_policy: {
        grace_period_minutes: Number,
        half_day_hours: Number,
        full_day_hours: Number,
      },
      notice_period_policy: {
        default_days: Number,
        probation_notice_days: Number,
      },
    },
    employee_lifecycle_rules: {
      probation_period_days: Number,
      termination_notice_days: Number,
      resignation_approval_required: Boolean,
      exit_clearance_required: Boolean,
    },
    organization_documents: [
      {
        document_name: String,
        document_type: String,
        document_url: String,
        uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        uploaded_at: Date,
      },
    ],
    supported_languages: [String],
    analytics_settings: {
      enable_dashboard: Boolean,
      cache_metrics_duration_hours: Number,
      default_reports: [String],
    },
    financial_info: {
      bank_name: String,
      account_number: String,
      ifsc_code: String,
      branch_name: String,
      payment_gateway: String,
      salary_currency: String,
    },
    branding: {
      logo_url: String,
      theme_color: String,
      favicon_url: String,
    },
    subscription_plan: {
      plan_type: String,
      start_date: Date,
      expiry_date: Date,
      max_users_allowed: Number,
      status: String,
    },
    compliance: {
      pf_registration_no: String,
      esi_registration_no: String,
      labour_license_no: String,
      compliance_officer_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    },
    settings: {
      time_zone: String,
      currency: String,
      language: String,
      financial_year_start: String,
      auto_generate_employee_code: Boolean,
      employee_code_prefix: String,
    },
    holiday_calendar: [
      {
        date: { type: Date, required: true },
        title: { type: String, required: true },
        type: { type: String },
        branch_applicable: [{ type: String }],
      },
    ],
    modules: {
      attendance: Boolean,
      payroll: Boolean,
      recruitment: Boolean,
      training: Boolean,
      asset_management: Boolean,
      performance_review: Boolean,
    },
    integrations: {
      google_workspace: Boolean,
      microsoft_teams: Boolean,
      slack: Boolean,
      biometric_system: String,
    },
    sla_policies: {
      response_time_hours: Number,
      resolution_time_hours: Number,
      escalation_contact: String,
    },
    data_retention_policy: {
      retain_employee_data_years: Number,
      retain_audit_logs_years: Number,
    },
    digital_signature: {
      authorized_signatory: String,
      designation: String,
      signature_image_url: String,
    },
    audit_logs: [
      {
        action: String,
        updated_field: String,
        old_value: mongoose.Schema.Types.Mixed,
        new_value: mongoose.Schema.Types.Mixed,
        updated_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        timestamp: Date,
      },
    ],
    created_by: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// 🔒 Hash password before saving
organizationSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 🔑 Compare password method
organizationSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("Organization", organizationSchema);
