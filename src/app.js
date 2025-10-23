require('dotenv').config();
const express = require('express');
const connectDB = require('./config/db');

const superAdminRoutes = require('./routes/superAdmin.routes');
const organizationRoutes = require("./routes/organization.routes");
const payrollRoutes = require("./routes/payroll.routes");
const orgAdminRoutes = require("./routes/orgAdmin.routes");

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api/superadmin', superAdminRoutes);
app.use("/api/organization", organizationRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/orgadmin", orgAdminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
