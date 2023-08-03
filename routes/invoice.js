const express = require("express");
const InvoiceController = require("../controllers/InvoiceController");
const router = express.Router();
const { authenticate } = require("../middlewares/jwt");

router.post("/get", authenticate, InvoiceController.getInvoice);
router.post("/get-id", InvoiceController.getById);
router.post("/create", authenticate, InvoiceController.saveInvoice);
router.post("/update", authenticate, InvoiceController.updateInvoice);
router.post("/delete", authenticate, InvoiceController.deleteInvoice);

module.exports = router;