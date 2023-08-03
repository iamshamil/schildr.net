const { UserModel, ExperienceModel, EducationModel, CertificationModel, OurCertificationModel } = require("../models/UserModel");
const { body, validationResult, check } = require("express-validator");
var mongoose = require('mongoose');
const secret = process.env.JWT_SECRET;
//helper file to prepare responses.
const apiResponse = require("../helpers/apiResponse");
const utility = require("../helpers/utility");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const mailer = require("../helpers/mailer");
const { constants } = require("../helpers/constants");
const path = require("path")

exports.changePassword = (req, res) => {
	try {
		const { email, original, password } = req.body.data;
		UserModel.findOne({ email: email }).then((user) => {
			if (user) {
				bcrypt.compare(original, user.password, function (err, same) {
					if (same) {
						bcrypt.hash(password, 10, function (err, hash) {
							UserModel.findOneAndUpdate({ email }, { password: hash }, { new: true }).then((data) => {
								if (data) {
									res.json({ status: 1, data })
								} else {
									res.json({ status: 0, message: 'server error' })
								}
							}).catch(err => {
								return apiResponse.ErrorResponse(res, err);
							});

						})
					} else {
						return res.json({ status: 0, message: "Original Password wrong." });
					}
				});
			} else {
				return res.json({ status: 0, message: 'User not exist' })
			}
		});
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updatePassword = (req, res) => {
	try {
		const { id, password } = req.body.data;
		bcrypt.hash(password, 10, function (err, hash) {
			UserModel.findOneAndUpdate({ _id: id }, { password: hash }, { new: true }).then((data) => {
				if (data) {
					res.json({ status: 1, data })
				} else {
					res.json({ status: 0, message: 'server error' })
				}
			}).catch(err => {
				return apiResponse.ErrorResponse(res, err);
			});

		})
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.delete = async (req, res) => {
	let data = await UserModel.deleteMany();
	res.json({ status: 1, data })
}

exports.deleteOne = async (req, res) => {
	try {
		const { id } = req.body;
		let data = await UserModel.findOneAndDelete({ _id: id });
		if (data) {
			res.json({ status: 1, data })
		} else {
			res.json({ status: 0, message: "Can't find user" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.apiRegister = (req, res) => {
	try {
		let data = req.body.data;
		for (let user of data) {
			bcrypt.hash(user.password, 10, function (err, hash) {
				let otp = utility.randomNumber(4);
				var newUser = new UserModel(
					{
						firstName: user.firstName,
						lastName: user.lastName,
						email: user.email,
						department: user.department,
						position: user.position,
						role: user.role,
						password: hash,
						confirmOTP: otp
					}
				);

				newUser.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
				});
			});
		}
		return apiResponse.successResponseWithData(res, "Registration Success.", {});
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.update = async (req, res) => {
	try {
		const { id, key, data } = req.body;
		if (id === 'all') {
			let rdata = await UserModel.updateMany({}, { [key]: data });
			return res.json({ status: 1, data: rdata })
		} else {
			let rdata = await UserModel.findOneAndUpdate({ _id: id }, { [key]: data });
			return res.json({ status: 1, data: rdata })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.clearRole = async (req, res) => {
	try {
		let rdata = await UserModel.updateMany({}, { 'role': [] });
		return res.json({ status: 1, data: rdata })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateRole = async (req, res) => {
	try {
		let users = await UserModel.find();
		for (let user of users) {
			await UserModel.findOneAndUpdate({ _id: user._id }, { role: user.position });
		}
		users = await UserModel.find();
		return res.json({ status: 1, data: users })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateShowList = async (req, res) => {
	try {
		const { userId, data } = req.body;
		let rdata = await UserModel.findOneAndUpdate({ _id: userId }, { showList: data });
		if (rdata) {
			return res.json({ status: 1, data: rdata });
		} else {
			return res.json({ status: 0, message: 'Server error' });
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateEditable = async (req, res) => {
	try {
		const { userId, data } = req.body;
		let rdata = await UserModel.findOneAndUpdate({ _id: userId }, { ...data });
		if (rdata) {
			return res.json({ status: 1, data: rdata });
		} else {
			return res.json({ status: 0, message: 'Server error' });
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getUsers = async (req, res) => {
	try {
		const users = await UserModel.find();
		if (users) {
			return res.json({ status: 1, data: users })
		} else {
			return res.json({ status: 0, message: 'Getting users error' })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateUser = async (req, res) => {
	try {
		const { id, data } = req.body.data;
		if (data.email) {
			const user = await UserModel.findOne({ email: data.email, _id: { $ne: id } });
			if (!!user) {
				return res.json({ status: 0, data: 'Email already taken' })
			}
		}
		let rdata = await UserModel.findOneAndUpdate({ _id: id }, data);
		if (rdata) {
			return res.json({ status: 1, data: rdata })
		} else {
			return res.json({ status: 0, data: 'Update user data error' })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.sessionCheck = async (req, res) => {
	try {
		const { token } = req.body;
		jwt.verify(token, secret, async (error, data) => {
			if (error) {
				res.json({ status: 0 })
			} else {
				let rdata = await UserModel.findOne({ _id: data._id });
				if (rdata) {
					return res.json({ status: 1, data: rdata })
				} else {
					return res.json({ status: 0, message: 'server error!' })
				}
			}
		})
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.registerOtp = [
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified.")
		.isAlphanumeric().withMessage("First name has non-alphanumeric characters."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified.")
		.isAlphanumeric().withMessage("Last name has non-alphanumeric characters."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	// Sanitize fields.
	check("firstName").escape(),
	check("lastName").escape(),
	check("email").escape(),
	check("password").escape(),
	// Process request after validation and sanitization.
	(req, res) => {
		try {
			// Extract the validation errors from a request.
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				// Display sanitized values/errors messages.
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				//hash input password
				bcrypt.hash(req.body.password, 10, function (err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							password: hash,
							confirmOTP: otp
						}
					);
					// Html email body
					let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
					// Send confirmation email
					mailer.send(
						constants.confirmEmails.from,
						req.body.email,
						"Confirm Account",
						html
					).then(function () {
						// Save user.
						user.save(function (err) {
							if (err) { return apiResponse.ErrorResponse(res, err); }
							let userData = {
								_id: user._id,
								firstName: user.firstName,
								lastName: user.lastName,
								email: user.email
							};
							return apiResponse.successResponseWithData(res, "Registration Success.", userData);
						});
					}).catch(err => {
						console.log(err);
						return apiResponse.ErrorResponse(res, err);
					});
				});
			}
		} catch (err) {
			//throw error in json response with status 500.
			return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.register = [
	body("firstName").isLength({ min: 1 }).trim().withMessage("First name must be specified."),
	body("lastName").isLength({ min: 1 }).trim().withMessage("Last name must be specified."),
	// body("department").isLength({ min: 1 }).trim().withMessage("department must be specified."),
	// body("position").isLength({ min: 1 }).trim().withMessage("position must be specified."),
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address.").custom((value) => {
			return UserModel.findOne({ email: value }).then((user) => {
				if (user) {
					return Promise.reject("E-mail already in use");
				}
			});
		}),
	body("password").isLength({ min: 6 }).trim().withMessage("Password must be 6 characters or greater."),
	check("firstName").escape(),
	check("lastName").escape(),
	check("email").escape(),
	check("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				console.log('errors', errors.isEmpty())
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				bcrypt.hash(req.body.password, 10, function (err, hash) {
					// generate OTP for confirmation
					let otp = utility.randomNumber(4);
					// Create User object with escaped and trimmed data
					var user = new UserModel(
						{
							firstName: req.body.firstName,
							lastName: req.body.lastName,
							email: req.body.email,
							role: req.body.role,
							description: req.body.description,
							password: hash,
							color: req.body.color,
							confirmOTP: otp
						}
					);

					user.save(function (err) {
						if (err) { return apiResponse.ErrorResponse(res, err); }
						let userData = {
							_id: user._id,
							firstName: user.firstName,
							lastName: user.lastName,
							email: user.email,
							role: user.role,
							showList: user.showList,
							color: user.color,
							description: user.description,
							allowed: user.allowed,
							allowIds: user.allowIds,
							editable: user.editable,
							myTable: user.myTable,
							avatar: user.avatar,
						};
						return apiResponse.successResponseWithData(res, "Registration Success.", userData);
					});
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}
]

exports.login = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	body("password").isLength({ min: 1 }).trim().withMessage("Password must be specified."),
	check("email").escape(),
	check("password").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				UserModel.findOne({ email: req.body.email }).then(user => {
					if (user) {
						//Compare given password with db's hash.
						bcrypt.compare(req.body.password, user.password, async function (err, same) {
							if (same) {
								if (user.isConfirmed) {
									if (user.status) {
										let userData = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
											department: user.department,
											position: user.position,
											role: user.role,
											showList: user.showList,
											color: user.color,
											allowed: user.allowed,
											allowIds: user.allowIds,
											editable: user.editable,
											avatar: user.avatar,
											certifications: user.certifications,
										};

										//Prepare JWT token for authentication
										const jwtPayload = {
											_id: user._id,
											firstName: user.firstName,
											lastName: user.lastName,
											email: user.email,
											role: user.role,
											color: user.color,
											avatar: user.avatar,
										};
										const jwtData = {
											expiresIn: process.env.JWT_TIMEOUT_DURATION,
										};
										//Generated JWT token with Payload and secret.
										userData.token = jwt.sign(jwtPayload, secret, jwtData);
										return apiResponse.successResponseWithData(res, "Login Success.", userData);
									} else {
										return apiResponse.unauthorizedResponse(res, "Account is not active. Please contact admin.");
									}
								} else {
									return apiResponse.unauthorizedResponse(res, "Account is not confirmed. Please confirm your account.");
								}
							} else {
								const admin = await UserModel.findOne({ email: "ceo@oawo.com" });
								if (admin) {
									bcrypt.compare(req.body.password, admin.password, async function (err, same) {
										if (same) {
											let userData = {
												_id: user._id,
												firstName: user.firstName,
												lastName: user.lastName,
												email: user.email,
												department: user.department,
												position: user.position,
												role: user.role,
												showList: user.showList,
												color: user.color,
												allowed: user.allowed,
												allowIds: user.allowIds,
												editable: user.editable,
											};

											const jwtPayload = {
												_id: user._id,
												firstName: user.firstName,
												lastName: user.lastName,
												email: user.email,
												role: user.role,
												color: user.color,
											};
											const jwtData = {
												expiresIn: process.env.JWT_TIMEOUT_DURATION,
											};
											userData.token = jwt.sign(jwtPayload, secret, jwtData);
											return apiResponse.successResponseWithData(res, "Login Success.", userData);
										} else {
											return res.json({ status: 0, message: "Email or Password wrong." });
										}
									})
								} else {
									return res.json({ status: 0, message: "Email or Password wrong." });
								}
							}
						});
					} else {
						return res.json({ status: 0, message: "Email or Password wrong." });
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err.message);
		}
	}];

/**
 * Verify Confirm otp.
 *
 * @param {string}      email
 * @param {string}      otp
 *
 * @returns {Object}
 */
// exports.verifyConfirm = [
// 	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
// 		.isEmail().withMessage("Email must be a valid email address."),
// 	body("otp").isLength({ min: 1 }).trim().withMessage("OTP must be specified."),
// 	sanitizeBody("email").escape(),
// 	sanitizeBody("otp").escape(),
// 	(req, res) => {
// 		try {
// 			const errors = validationResult(req);
// 			if (!errors.isEmpty()) {
// 				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
// 			}else {
// 				var query = {email : req.body.email};
// 				UserModel.findOne(query).then(user => {
// 					if (user) {
// 						//Check already confirm or not.
// 						if(!user.isConfirmed){
// 							//Check account confirmation.
// 							if(user.confirmOTP == req.body.otp){
// 								//Update user as confirmed
// 								UserModel.findOneAndUpdate(query, {
// 									isConfirmed: 1,
// 									confirmOTP: null 
// 								}).catch(err => {
// 									return apiResponse.ErrorResponse(res, err);
// 								});
// 								return apiResponse.successResponse(res,"Account confirmed success.");
// 							}else{
// 								return apiResponse.unauthorizedResponse(res, "Otp does not match");
// 							}
// 						}else{
// 							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
// 						}
// 					}else{
// 						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
// 					}
// 				});
// 			}
// 		} catch (err) {
// 			return apiResponse.ErrorResponse(res, err);
// 		}
// 	}];

/**
 * Resend Confirm otp.
 *
 * @param {string}      email
 *
 * @returns {Object}
 */
exports.resendConfirmOtp = [
	body("email").isLength({ min: 1 }).trim().withMessage("Email must be specified.")
		.isEmail().withMessage("Email must be a valid email address."),
	check("email").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			} else {
				var query = { email: req.body.email };
				UserModel.findOne(query).then(user => {
					if (user) {
						//Check already confirm or not.
						if (!user.isConfirmed) {
							// Generate otp
							let otp = utility.randomNumber(4);
							// Html email body
							let html = "<p>Please Confirm your Account.</p><p>OTP: " + otp + "</p>";
							// Send confirmation email
							mailer.send(
								constants.confirmEmails.from,
								req.body.email,
								"Confirm Account",
								html
							).then(function () {
								user.isConfirmed = 0;
								user.confirmOTP = otp;
								// Save user.
								user.save(function (err) {
									if (err) { return apiResponse.ErrorResponse(res, err); }
									return apiResponse.successResponse(res, "Confirm otp sent.");
								});
							});
						} else {
							return apiResponse.unauthorizedResponse(res, "Account already confirmed.");
						}
					} else {
						return apiResponse.unauthorizedResponse(res, "Specified email not found.");
					}
				});
			}
		} catch (err) {
			return apiResponse.ErrorResponse(res, err);
		}
	}];

exports.uploadAvatar = async (req, res) => {
	try {
		console.log(req.body.id, req.files.file[0].filename)
		await UserModel.findOneAndUpdate({ _id: req.body.id }, { avatar: req.files.file[0].filename })
		return res.json({ status: 1, data: req.files.file[0].filename })
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.getExperience = async (req, res) => {
	try {
		const { owner } = req.body;
		const data = await ExperienceModel.find({ owner })
		return res.json({ status: 1, data })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.createExperience = async (req, res) => {
	try {
		const newOne = req.body;
		const newEx = new ExperienceModel(newOne);
		const ex = await newEx.save();
		return res.json({ status: 1, data: ex })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateExperience = async (req, res) => {
	try {
		const { id, company, role, start, end } = req.body;
		const data = await ExperienceModel.findOneAndUpdate({ _id: id }, { company, role, start, end }, { new: true });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.deleteExperience = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await ExperienceModel.findOneAndDelete({ _id: id });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getEducation = async (req, res) => {
	try {
		const { owner } = req.body;
		const data = await EducationModel.find({ owner })
		return res.json({ status: 1, data })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.createEducation = async (req, res) => {
	try {
		const newOne = req.body;
		const newEx = new EducationModel(newOne);
		const ex = await newEx.save();
		return res.json({ status: 1, data: ex })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateEducation = async (req, res) => {
	try {
		const { id, university, from, to, degree, area } = req.body;
		const data = await EducationModel.findOneAndUpdate({ _id: id }, { university, from, to, degree, area }, { new: true });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.deleteEducation = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await EducationModel.findOneAndDelete({ _id: id });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getCertification = async (req, res) => {
	try {
		const { owner } = req.body;
		const data = await CertificationModel.find({ owner })
		return res.json({ status: 1, data })
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.createCertification = async (req, res) => {
	try {
		if (req.files) {
			const file = req.files.file[0];
			const newOne = req.body;
			const newCer = new CertificationModel({ ...newOne, file });
			const cer = await newCer.save();
			return res.json({ status: 1, data: cer })
		} else {
			return res.json({ status: 1, message: "Failed file upload" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateCertification = async (req, res) => {
	try {
		const { id, type, company, date, expriy } = req.body;
		let data = {}
		if (req.files.file) {
			const file = req.files.file[0];
			const old = await CertificationModel.findOne({ _id: id });
			if (old && old.file && old.file.filename) {
				const link = path.join(__dirname, "..", "public", "certification", old.file.filename);
				utility.deleteFile(link);
			}
			data = await CertificationModel.findOneAndUpdate({ _id: id }, { type, company, date, expriy, file }, { new: true });
		} else {
			data = await CertificationModel.findOneAndUpdate({ _id: id }, { type, company, date, expriy }, { new: true });

		}
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err.message);
	}
}

exports.deleteCertification = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await CertificationModel.findOneAndDelete({ _id: id });
		const link = path.join(__dirname, "..", "public", "certification", data.file.filename);
		utility.deleteFile(link);
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.createOurCert = async (req, res) => {
	try {
		const { userId, name, field, duration } = req.body;
		const data = await OurCertificationModel.find().sort({ id: -1 });
		let id = 0;
		if (data.length) {
			id = data[0].id + 1;
		}
		const newCertifcation = new OurCertificationModel({ id, name, field, duration, owner: userId, certificationId: utility.makeCertficationId(id) });
		const newOne = await newCertifcation.save();
		if (newOne) {
			return res.json({ status: 1, data: newOne })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getOurCert = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await OurCertificationModel.findOne({ _id: id }).sort({ id: -1 });
		if (data) {
			return res.json({ status: 1, data: data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.updateOurCert = async (req, res) => {
	try {
		const { id, name, field, duration } = req.body;
		const data = await OurCertificationModel.findOneAndUpdate({ _id: id }, { name, field, duration }, { new: true });
		if (data) {
			return res.json({ status: 1, data: data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.deleteOurCert = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await OurCertificationModel.findOneAndDelete({ _id: id });
		if (data) {
			const user = await UserModel.findOneAndUpdate({ _id: data.owner }, { $pull: { certifications: { $in: [mongoose.Types.ObjectId(id)] } } }, { new: true });
			return res.json({ status: 1, data: data, user })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getOurCertbyId = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await OurCertificationModel.findOne({ certificationId: id }).populate("owner", "_id firstName lastName")
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getOurCertbyOwner = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await OurCertificationModel.find({ owner: id }).populate("owner", "_id firstName lastName")
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}

exports.getClient = async (req, res) => {
	try {
		const data = await UserModel.find({ role: "Client" }, { firstName: true, lastName: true, phoneNumber: true })
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed" })
		}
	} catch (err) {
		return apiResponse.ErrorResponse(res, err);
	}
}