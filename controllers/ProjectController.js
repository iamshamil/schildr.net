const TableModel = require("../models/TableModel");
const { UserModel } = require("../models/UserModel");
const apiResponse = require("../helpers/apiResponse");
const { v4: uuidv4 } = require('uuid')

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const path = require('path');
const fs = require('fs');

const { projectModel, headModel, bodyModel, logModel } = TableModel;

exports.create = async (req, res) => {
	try {
		const data = req.body;
		const newProject = new projectModel({ ...data, child: [], mark: 0, });
		const rdata = await newProject.save();

		if (rdata) {
			return res.json({ status: 1, data: rdata })
		} else {
			return res.json({ status: 0, message: 'Failed!' })
		}
	} catch (err) {
		console.log("create project error=> ", err.message);
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.update = async (req, res) => {
	try {
		const { id, name, color } = req.body;
		const data = await projectModel.findOneAndUpdate({ _id: id }, { name, color }, { new: true });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: 'Failed!' })
		}
	} catch (err) {
		console.log("update project error=> ", err.message);
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.delete = async (req, res) => {
	try {
		const { id } = req.body;
		const headers = await headModel.find({ pId: id }, { pId: true });
		for (let item of headers) {
			await bodyModel.deleteMany({ hId: item._id })
		}
		await headModel.deleteMany({ pId: id });

		const data = await projectModel.findOneAndDelete({ _id: id });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: 'Failed!' })
		}
	} catch (err) {
		console.log("delete project error=> ", err.message);
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.getAll = async (req, res) => {
	try {
		const { userId } = req.body;
		const user = await UserModel.findOne({ _id: userId })
		if (user) {
			if (user.role === "Admin") {
				const rdata = await projectModel.find();
				if (rdata) {
					return res.json({ status: 1, data: rdata })
				} else {
					return res.json({ status: 0, message: 'Failed!' })
				}
			} else {
				const headers = await headModel.find({ _id: { $in: user.myTable } }, { pId: true });
				const pId = headers.map(e => e.pId);
				const rdata = await projectModel.find({ _id: { $in: pId } });
				if (rdata) {
					return res.json({ status: 1, data: rdata })
				} else {
					return res.json({ status: 0, message: 'Failed!' })
				}
			}
		} else {
			return res.json({ status: 0, message: 'Failed!' })
		}
	} catch (err) {
		console.log("get project error=> ", err.message);
		return res.json({ status: 0, message: 'server error' });
	}
}