const express = require("express");
const AuthController = require("../controllers/AuthController");
const TableController = require("../controllers/TableController");
const { authenticate } = require("../middlewares/jwt");
const router = express.Router();
const { avatarUpload, certificationUpload } = require("../middlewares/middle");

router.post("/register", AuthController.register);
router.post("/api-register", AuthController.apiRegister);
router.post("/login", AuthController.login);
router.post("/session-check", AuthController.sessionCheck);
router.post("/delete", AuthController.delete);
router.post("/delete-user", AuthController.deleteOne);
router.post("/change-password", authenticate, AuthController.changePassword);
router.post("/update-user", AuthController.updateUser);
router.post("/get-users", AuthController.getUsers);
router.post("/update-password", AuthController.updatePassword);
router.post("/update-showList", AuthController.updateShowList);
router.post("/update-editable", AuthController.updateEditable);
router.post("/update", AuthController.update);
router.post("/update-role", AuthController.updateRole);
router.post("/upload-avatar", avatarUpload, AuthController.uploadAvatar);

router.post("/clear-role", AuthController.clearRole);

router.post("/get-experience", AuthController.getExperience);
router.post("/create-experience", AuthController.createExperience);
router.post("/update-experience", AuthController.updateExperience);
router.post("/delete-experience", AuthController.deleteExperience);

router.post("/get-education", AuthController.getEducation);
router.post("/create-education", AuthController.createEducation);
router.post("/update-education", AuthController.updateEducation);
router.post("/delete-education", AuthController.deleteEducation);

router.post("/get-certification", AuthController.getCertification);
router.post("/create-certification", certificationUpload, AuthController.createCertification);
router.post("/update-certification", certificationUpload, AuthController.updateCertification);
router.post("/delete-certification", AuthController.deleteCertification);

router.post("/create-OurCert", AuthController.createOurCert);
router.post("/get-OurCert", AuthController.getOurCert);
router.post("/update-OurCert", AuthController.updateOurCert);
router.post("/delete-OurCert", AuthController.deleteOurCert);
router.post("/get-OurCertbyId", AuthController.getOurCertbyId);
router.post("/get-OurCertbyOwner", AuthController.getOurCertbyOwner);

// Invoice
router.post("/getClient", AuthController.getClient);
// CMS
router.post("/deleteAllRow", TableController.deleteAllRow);
router.post("/setIds", TableController.setIds);
router.post("/clearLog", TableController.clearLog);
router.post("/clearHead", TableController.clearHead);
router.post("/clearBody", TableController.clearBody);
router.post("/customizeRow", TableController.customizeRow);

module.exports = router;