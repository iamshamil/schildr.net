const { InvoiceModel } = require("../models/InvoiceModel");

const apiResponse = require("../helpers/apiResponse");

exports.getInvoice = async (req, res) => {
	try {
		const data = await InvoiceModel.find().populate("toUser", "_id firstName lastName email color avatar");
		if (data) {
			return res.json({ status: 1, data });
		} else {
			return res.json({ status: 0, message: 'Failed to get data!' });
		}
	} catch (err) {
		console.log("Get Error => ", err.message)
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.getById = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await InvoiceModel.findOne({ _id: id }).populate("toUser", "_id firstName lastName email color avatar phoneNumber").populate("fromUser", "_id firstName lastName email color avatar phoneNumber");
		if (data) {
			return res.json({ status: 1, data });
		} else {
			return res.json({ status: 0, message: 'Failed to get data!' });
		}
	} catch (err) {
		console.log("Get Error => ", err.message)
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.saveInvoice = async (req, res) => {
	try {
		const data = req.body;
		const oldData = await InvoiceModel.find({}, { invoiceId: true }).sort({ invoiceId: -1 });
		let invoiceId = 0;
		if (oldData.length) {
			invoiceId = oldData[0].invoiceId + 1;
		}

		const newInvoice = new InvoiceModel({ ...data, invoiceId });
		newInvoice.save(async function (err, data) {
			if (err) { return apiResponse.ErrorResponse(res, err); }
			const newData = await InvoiceModel.findById(data._id).populate("toUser", "_id firstName lastName email color avatar");
			return res.json({ status: 1, data: newData })
		});
	} catch (err) {
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.updateInvoice = async (req, res) => {
	try {
		let { id, data, } = req.body;
		InvoiceModel.findOneAndUpdate({ _id: id }, { ...data }, { new: true }).then(async (ndata) => {
			const data = await InvoiceModel.findOne({ _id: ndata._id }).populate("toUser", "_id firstName lastName email color avatar");
			return res.json({ status: 1, data })
		}).catch(err => {
			return apiResponse.ErrorResponse(res, err);
		});
	} catch (err) {
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.deleteInvoice = async (req, res) => {
	try {
		const { id } = req.body;
		const data = await InvoiceModel.findOneAndDelete({ _id: id });
		if (data) {
			return res.json({ status: 1, data });
		} else {
			return res.json({ status: 0, message: 'server error' });
		}
	} catch (err) {
		return res.json({ status: 0, message: 'server error' });
	}
}