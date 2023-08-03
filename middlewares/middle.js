const multer = require('multer');
const maxSize = 167772160;

const upload = multer({
    storage: multer.diskStorage({
        destination: './public/attached',
        filename: (req, file, cb) => {
            file.originalname = Buffer.from(file.originalname, 'latin1').toString(
                'utf8',
              );
            cb(null, new Date().valueOf() + '-' + file.originalname)
        },
        onFileUploadStart: function (file, req, res) {
            if (req.files.file.length > maxSize) {
                return false;
            }
        }
    }),
});

const avatar = multer({
    storage: multer.diskStorage({
        destination: './public/avatar',
        filename: (req, file, cb) => {
            cb(null, new Date().valueOf() + '-' + file.originalname)
        },
        onFileUploadStart: function (file, req, res) {
            if (req.files.file.length > maxSize) {
                return false;
            }
        }
    }),
});

const certification = multer({
    storage: multer.diskStorage({
        destination: './public/certification',
        filename: (req, file, cb) => {
            cb(null, new Date().valueOf() + '-' + file.originalname)
        },
        onFileUploadStart: function (file, req, res) {
            if (req.files.file.length > maxSize) {
                return false;
            }
        }
    }),
});

exports.cpUpload = upload.fields([{ name: 'file', maxCount: 10 }]);

exports.avatarUpload = avatar.fields([{ name: 'file', maxCount: 1 }]);

exports.certificationUpload = certification.fields([{ name: 'file', maxCount: 1 }]);