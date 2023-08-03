var express = require("express");
var router = express.Router();
const ProjectController = require("../controllers/ProjectController");
const { cpUpload } = require("../middlewares/middle");

router.post("/create", ProjectController.create);
router.post("/update", ProjectController.update);
router.post("/delete", ProjectController.delete);
router.post("/get", ProjectController.getAll);

module.exports = router;    