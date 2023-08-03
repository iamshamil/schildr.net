var express = require("express");
var router = express.Router();
const TableController = require("../controllers/TableController");
const { cpUpload } = require("../middlewares/middle");

router.post("/get", TableController.getTable);
router.post("/save", TableController.saveTable);
router.post("/addRow", TableController.addRow);
router.post("/updateRow", TableController.updateRow);
router.post("/updateHeader", TableController.updateHeader);
router.post("/deleteHeader", TableController.deleteHeader);
router.post("/deleteRow", TableController.deleteRow);
router.post("/upload", cpUpload, TableController.upload);
router.post("/updateChat", TableController.updateChat);
router.post("/removeColumn", TableController.removeColumn);
router.post("/addColumn", TableController.addColumn);
router.post("/updateAllowed", TableController.updateAllowed);
router.post("/getLog", TableController.getLog);
router.post("/updateLog", TableController.updateLog);
router.post("/updateNotification", TableController.updateNotification);
router.post("/deleteSelected", TableController.deleteSelected);
router.post("/updateOrder", TableController.updateOrder);
router.post("/duplicateRow", TableController.duplicateRow);
router.post("/approve", TableController.approve);
router.post("/createInviteLink", TableController.createInviteKey);

router.post("/crateTab", TableController.crateTab);
router.post("/changeTab", TableController.changeTab);
router.post("/updateTab", TableController.updateTab);
router.post("/deleteTab", TableController.deleteTab);
router.post("/updateHeaderOrder", TableController.updateHeaderOrder);
router.post("/transferTable", TableController.transferTable);
router.get("/:tabId", TableController.getPriceApi);

router.post("/getInvite", TableController.getInvite);

module.exports = router;    