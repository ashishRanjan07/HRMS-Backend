const mongoose = require("mongoose");

const payrollSchema = new mongoose.Schema(
  {
    organization_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
    },
    branch_id: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    department_id: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    employee_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    designation_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Designation",
    },

    payroll_cycle: {
      month: { type: String },
      year: { type: Number },
      period_start: { type: Date },
      period_end: { type: Date },
      processed_on: { type: Date },
      payroll_status: {
        type: String,
        enum: ["Draft", "Processed", "Approved", "Released", "Cancelled"],
        default: "Draft",
      },
      batch_id: { type: String },
    },

    // Add deletion tracking fields
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    employee_snapshot: { type: Object },
    salary_structure: { type: Object },
    deductions: { type: Object },
    earnings: { type: Object },
    totals: { type: Object },
    tax_computation: { type: Object },
    attendance_summary: { type: Object },
    disbursement_details: { type: Object },
    leave_encashment: { type: Object },
    bonus_details: [{ type: Object }],
    audit_trail: [{ type: Object }],
    automation_flags: { type: Object },
    payslip_info: { type: Object },
    performance_reference: { type: Object },
    metadata: { type: Object },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Payroll", payrollSchema);