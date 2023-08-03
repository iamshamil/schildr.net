const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const invoiceModel = () => {
	const UserSchema = new Schema({
		invoiceId: {
			type: Number,
			required: true
		},
		fromUser: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
		toUser: {
			type: Schema.Types.ObjectId, ref: 'user',
			required: true
		},
		createDate: {
			type: Date,
			required: true
		},
		details: {
			type: Array,
			required: true
		},
	}, { timestamps: true });

	return mongoose.model('invoice', UserSchema)
}

module.exports = {
	InvoiceModel: invoiceModel(),
}
