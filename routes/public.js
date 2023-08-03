var express = require("express");
var router = express.Router();
const TableController = require("../controllers/TableController");

router.post("/crateTab", TableController.crateTab);
router.post("/changeTab", TableController.changeTab);
router.post("/updateTab", TableController.updateTab);
router.post("/deleteTab", TableController.deleteTab);
router.post("/updateHeaderOrder", TableController.updateHeaderOrder);
router.get("/test", TableController.test);
router.get("/:tabId", TableController.getPriceApi);

module.exports = router;    