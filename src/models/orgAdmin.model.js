// const mongoose = require("mongoose");
// const bcrypt = require("bcryptjs");

// const orgAdminSchema = new mongoose.Schema({
//   first_name: { type: String, required: true },
//   last_name: { type: String },
//   email: { type: String, required: true, unique: true },
//   password: { type: String, required: true },
//   organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization", required: true },
//   role: { type: String, default: "org_admin" },
//   linked_organizations: [
//     {
//       organization_id: { type: mongoose.Schema.Types.ObjectId, ref: "Organization" },
//       role_in_org: { type: String, default: "admin" },
//       assigned_date: { type: Date, default: Date.now },
//     },
//   ],
// }, { timestamps: true });

// // Hash password before save
// orgAdminSchema.pre("save", async function (next) {
//   if (!this.isModified("password")) return next();
//   const salt = await bcrypt.genSalt(10);
//   this.password = await bcrypt.hash(this.password, salt);
//   next();
// });

// // Method to compare password
// orgAdminSchema.methods.matchPassword = async function (enteredPassword) {
//   return await bcrypt.compare(enteredPassword, this.password);
// };

// module.exports = mongoose.model("OrgAdmin", orgAdminSchema);


const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const orgAdminSchema = new mongoose.Schema({
  name: { type: String, required: true },
  organization_code: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  role: { type: String, default: "admin" },
  email: { type: String }, // optional
  created_at: { type: Date, default: Date.now },
  updated_at: Date,
});

// Password hashing before saving
orgAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match entered password with hashed password
orgAdminSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("OrgAdmin", orgAdminSchema);
