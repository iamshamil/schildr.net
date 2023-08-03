const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const projectModel = () => {
	var ProjectSchema = new Schema({
		child: { type: Object },
		name: { type: String },
		color: { type: String },
		mark: { type: Number },
		order: { type: Number },
	}, { timestamps: true });

	return mongoose.model('Project', ProjectSchema)
}

const headModel = () => {
	var HeadSchema = new Schema({
		pId: {
			type: Schema.Types.ObjectId, ref: 'project',
			required: true
		},
		row: { type: Object },
		name: { type: String },
		order: { type: Number }
	}, { timestamps: true });

	return mongoose.model('TableHead', HeadSchema)
}

const bodyModel = () => {
	var BodySchema = new Schema({
		row: { type: Array },
		order: { type: Number },
		chat: { type: Number },
		hId: { type: String, require: true },
		done: { type: Boolean, default: false },
		creator: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
		updater: {
			type: Schema.Types.ObjectId, ref: 'user',
		},
	}, { timestamps: true });

	return mongoose.model('TableBody', BodySchema)
}

const logModel = () => {
	var LogSchema = new Schema({
		rowId: { type: String },
		type: { type: String },
		date: { type: Date },
		old: { type: String },
		history: { type: Object },
		oldColor: { type: String },
		new: { type: String },
		color: { type: String },
		dataType: { type: String },
		sign: { type: Object },
		creator: { type: Object },
		cellId: { type: String },
		cellName: { type: String },
		columnId: { type: String },
	}, { timestamps: true });

	return mongoose.model('log', LogSchema)
}

module.exports = {
	projectModel: projectModel(),
	headModel: headModel(),
	bodyModel: bodyModel(),
	logModel: logModel(),
}
