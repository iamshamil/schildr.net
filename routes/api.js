var express = require("express");
var authRouter = require("./auth");
var tableRouter = require("./table");
var projectRouter = require("./project");
var publicRouter = require("./public");
var invoiceRouter = require("./invoice");

const { authenticate } = require("../middlewares/jwt");
var app = express();

app.use("/auth/", authRouter);
app.use("/table/", authenticate, tableRouter);
app.use("/invoice/", invoiceRouter);
app.use("/invite/", tableRouter);
app.use("/project/", authenticate, projectRouter);
app.use("/public/", publicRouter);

module.exports = app;