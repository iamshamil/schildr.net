const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userModel = () => {
	const UserSchema = new Schema({
		firstName: { type: String, required: true },
		lastName: { type: String, required: true },
		email: { type: String, required: true },
		password: { type: String, required: true },
		department: { type: String },
		position: { type: String },
		role: { type: String },
		phoneNumber: { type: String },
		skills: { type: String },
		description: { type: String, default: '' },
		color: { type: String, default: '' },
		avatar: { type: String, default: '' },
		allowed: { type: Object, default: {} },
		editable: { type: Object, default: {} },
		showList: { type: Object, default: {} },
		allowIds: { type: Object, default: {} },
		myTable: { type: Object, default: [] },
		isConfirmed: { type: Boolean, required: true, default: 1 },
		confirmOTP: { type: String, required: false },
		otpTries: { type: Number, required: false, default: 0 },
		certifications: { type: Array, default: [] },
		status: { type: Boolean, required: true, default: 1 }
	}, { timestamps: true });

	return mongoose.model('user', UserSchema)
}

const experienceModel = () => {
	const ExperienceSchema = new Schema({
		company: { type: String },
		role: { type: String },
		start: { type: Date },
		end: { type: Date },
		owner: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
	}, { timestamps: true });

	return mongoose.model('experience', ExperienceSchema)
}

const ourCertificationModel = () => {
	const CertificationSchema = new Schema({
		id: { type: Number },
		name: { type: String },
		field: { type: String },
		duration: { type: Number },
		certificationId: { type: String },
		owner: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
	}, { timestamps: true });

	return mongoose.model('ourCertification', CertificationSchema)
}

const certificationModel = () => {
	const CertificationSchema = new Schema({
		file: { type: Object },
		type: { type: String },
		company: { type: String },
		date: { type: Date },
		expiry: { type: Date },
		owner: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
	}, { timestamps: true });

	return mongoose.model('certification', CertificationSchema)
}

const educationModel = () => {
	const EducationSchema = new Schema({
		university: { type: String },
		from: { type: Date },
		to: { type: Date },
		degree: { type: String },
		area: { type: String },
		owner: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
	}, { timestamps: true });

	return mongoose.model('education', EducationSchema)
}

module.exports = {
	UserModel: userModel(),
	ExperienceModel: experienceModel(),
	CertificationModel: certificationModel(),
	EducationModel: educationModel(),
	OurCertificationModel: ourCertificationModel(),
}
