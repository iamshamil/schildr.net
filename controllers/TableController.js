const mongoose = require('mongoose');
const TableModel = require("../models/TableModel");
const { UserModel } = require("../models/UserModel");
const apiResponse = require("../helpers/apiResponse");
const { v4: uuidv4 } = require('uuid')

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const secret = process.env.JWT_SECRET;
const path = require('path');
const fs = require('fs');

const { headModel, bodyModel, logModel } = TableModel;

exports.saveTable = async (req, res) => {
	try {
		let { header, } = req.body;
		let headerData = new headModel({ row: header });
		headerData.save(function (err) {
			if (err) { return apiResponse.ErrorResponse(res, err); }

		});
		return res.json({ status: 1 })
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.getTable = async (req, res) => {
	try {
		const { userId, projectId } = req.body;
		var isValid = mongoose.Types.ObjectId.isValid(projectId);

		const project = await TableModel.projectModel.findOne({ _id: projectId });
		if (!isValid || !project) {
			return res.json({ status: 0, message: 'Invalid id' });
		}

		let headerCondition = {}
		const user = await UserModel.findOne({ _id: userId })

		if (user.role !== "Admin") {
			if (user.myTable.length) {
				let orCondition = [];
				for (let aTable of user.myTable) {
					orCondition.push({ "_id": aTable });
				}
				headerCondition["$and"] = [
					{ pId: projectId },
					{ "$or": orCondition }
				]
			} else {
				let users = await UserModel.find();
				return res.json({ status: 1, data: { project, headers: [], header: {}, body: [], users, notification: [] } })
			}
		} else {
			headerCondition = {
				pId: projectId
			}
		}
		headModel.find(headerCondition).sort({ order: 1 }).then(async (headers) => {
			if (headers && headers.length) {
				let header = headers[0];
				let users = await UserModel.find();
				let body = [];
				if (header && header._id) {
					let condition = { hId: header._id }
					body = await bodyModel.find(condition).populate("creator", "_id firstName lastName email color").populate("updater", "_id firstName lastName email color").sort({ order: 1 })
				}
				let notificationCondition = { type: "activity", "creator._id": { $ne: user._id } }
				let allowIds = user.allowIds && user.allowIds[header._id] ? user.allowIds[header._id] : [];
				if (user.role !== "Admin") {
					notificationCondition["columnId"] = { $in: allowIds };
				}

				let notification = await logModel.find(notificationCondition);
				headers = headers.map((one) => ({ _id: one._id, name: one.name, order: one.order }));
				res.json({ status: 1, data: { project, headers, header: header ? header : {}, body, users, notification } })
			} else {
				await UserModel.findOneAndUpdate({ _id: user._id }, { myTable: [] });
				let users = await UserModel.find();
				return res.json({ status: 1, data: { project, headers: [], header: {}, body: [], users, notification: [] } })
			}
		}).catch((err) => {
			console.log("Get Error => ", err.message)
			return res.json({ status: 0, message: 'server error' });
		})
	} catch (err) {
		console.log("Get Error => ", err.message)
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.addRow = async (req, res) => {
	try {
		let { data, hId, creator, } = req.body;
		let order = 0;
		let orderList = await bodyModel.find({ hId }, { order: true }).sort({ order: 1 });
		if (orderList.length) {
			order = orderList.pop().order + 1;
		}
		let headerData = new bodyModel({ row: data, hId, order, creator });
		headerData.save(function (err, data) {
			if (err) { return apiResponse.ErrorResponse(res, err); }
			return res.json({ status: 1, data });
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateRow = async (req, res) => {
	try {
		let { data, updater, } = req.body;
		bodyModel.findOneAndUpdate({ _id: data._id }, { row: data.row, updater }, { new: true }).then((ndata) => {
			return res.json({ status: 1, data: ndata })
		}).catch(err => {
			return apiResponse.ErrorResponse(res, err);
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateChat = async (req, res) => {
	try {
		let { id, chat, } = req.body;
		let newChat = [];
		let data = await bodyModel.findOne({ _id: id });
		if (data.chat) {
			newChat = data.chat;
			newChat.push(chat);
		} else {
			newChat.push(chat);
		}

		bodyModel.findOneAndUpdate({ _id: id }, { chat: newChat }, { new: true }).then(async (data) => {
			return res.json({ status: 1, data })
		}).catch(err => {
			return apiResponse.ErrorResponse(res, err);
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.getLog = async (req, res) => {
	try {
		let { rowId, allowIds, } = req.body;
		// allowIds.push('chat');
		// columnId: { $in: allowIds }
		let rdata = await logModel.find({ rowId, });
		if (rdata) {
			return res.json({ status: 1, data: rdata })
		} else {
			return res.json({ status: 0, message: 'database error Error' })
		}
	} catch (err) {
		console.log(err)
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateLog = async (req, res) => {
	try {
		let { data, } = req.body;
		let date = new Date().getTime() - (1000 * 60 * 2);
		let exsit = await logModel.findOne({ rowId: data.rowId, cellId: data.cellId, type: 'activity', updatedAt: { $gt: new Date(date) } });
		if (data.type === "comment") {
			await bodyModel.updateOne({ _id: data.rowId }, { $inc: { chat: 1 } });
		}
		if (data.dataType === "multiSelect" || data.dataType === "attached") {
			let newlog = new logModel(data);
			let rdata = await newlog.save();
			if (rdata) {
				return res.json({ status: 1, data: rdata })
			} else {
				return res.json({ status: 0, message: 'Server Error' })
			}
		} else {
			if (exsit) {
				if (exsit.old === data.new) {
					let rdata = await logModel.deleteOne({ _id: exsit._id });
					if (rdata) {
						return res.json({ status: 1, data: rdata })
					} else {
						return res.json({ status: 0, message: 'Server Error' })
					}
				} else {
					delete data.old;
					let rdata = await logModel.findOneAndUpdate({ rowId: data.rowId, cellId: data.cellId, type: 'activity', updatedAt: { $gt: new Date(date) } }, data, { upsert: true, new: true });
					if (rdata) {
						return res.json({ status: 1, data: rdata })
					} else {
						return res.json({ status: 0, message: 'Server Error' })
					}
				}
			} else {
				let rdata = await logModel.findOneAndUpdate({ rowId: data.rowId, cellId: data.cellId, type: 'activity', updatedAt: { $gt: new Date(date) } }, data, { upsert: true, new: true });
				if (rdata) {
					return res.json({ status: 1, data: rdata })
				} else {
					return res.json({ status: 0, message: 'Server Error' })
				}
			}
		}

	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateNotification = async (req, res) => {
	try {
		let { id, user, type, } = req.body;
		if (type === 'all') {
			let allData = await logModel.find({ _id: { $in: id } });
			if (allData) {
				for (let item of allData) {
					item.sign[user] = true;
					await logModel.findOneAndUpdate({ _id: item._id }, { sign: item.sign }, { upsert: true, new: true });
				}
			}
			return res.json({ status: 1, data: allData });
		} else {
			let data = await logModel.findOne({ _id: id });
			if (type === 'read') {
				data.sign[user] = true;
			} else {
				data.sign[user] = false;
			}
			let rdata = await logModel.findOneAndUpdate({ _id: id }, { sign: data.sign }, { upsert: true, new: true });
			if (rdata) {
				return res.json({ status: 1, data: rdata })
			} else {
				return res.json({ status: 0, message: 'Server Error' })
			}
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.removeColumn = async (req, res) => {
	try {
		let { hId, index, } = req.body;

		let header = await headModel.findOne({ _id: hId });
		let body = await bodyModel.find({ hId });
		let newHeader = [];

		for (let item of header.row) {
			if (item.order === header.row[index].order) continue;
			if (item.order > header.row[index].order) {
				item.order--;
			}
			newHeader.push(item);
		}
		await headModel.findOneAndUpdate({ _id: hId }, { row: newHeader });
		let allowIds = newHeader.map(e => e.id);
		await UserModel.updateMany({ role: 'admin' }, { allowIds });

		for (let i = 0; i < body.length; i++) {
			let row = body[i].row;
			row.splice(index, 1);
			await bodyModel.findOneAndUpdate({ _id: body[i]._id }, { row });
		}
		return res.json({ status: 1, data: {} })
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.deleteRow = async (req, res) => {
	try {
		let { data, } = req.body;
		let one = await bodyModel.findOneAndDelete({ _id: data._id });
		let odata = await bodyModel.updateMany({ order: { $gt: one.order } }, { $inc: { order: -1 } });
		if (one && odata) {
			return res.json({ status: 1, data: odata });
		} else {
			return res.json({ status: 0, message: 'error' });
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateHeader = async (req, res) => {
	try {
		let { data, } = req.body;
		headModel.findOneAndUpdate({ _id: data.hId }, { row: data.row }, { new: true }).then((ndata) => {
			return res.json({ status: 1, data: ndata })
		}).catch(err => {
			return apiResponse.ErrorResponse(res, err);
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.deleteHeader = async (req, res) => {
	try {
		let { hId, } = req.body;
		headModel.findOneAndDelete({ _id: hId }).then((e) => {
			res.json({ status: 1 })
		})
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.upload = async (req, res) => {
	try {
		let data = []
		for (let key in req.files) {
			for (let file of req.files[key]) {
				data.push({
					originalname: file.originalname,
					mimetype: file.mimetype,
					filename: file.filename,
					size: file.size,
					path: file.path
				})
			}
		}
		return res.json({ status: 1, data })
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.addColumn = async (req, res) => {
	try {
		let { data, hId, index, type, typeChange, } = req.body;
		if (hId) {
			let header = await headModel.findOne({ _id: hId });
			let body = await bodyModel.find({ hId });
			let row = header.row;
			if (type === 'add') {
				let newHeader = [];
				for (let item of row) {
					if (item.order >= index) {
						item.order++;
					}
					newHeader.push(item);
				}
				newHeader.push(data);
				await headModel.findOneAndUpdate({ _id: hId }, { row: newHeader }, { new: true });
				let allowIds = newHeader.map(e => e.id);
				await UserModel.updateMany({ role: 'admin' }, { allowIds });

				for (let i = 0; i < body.length; i++) {
					let bRow = body[i].row;
					switch (data.type) {
						case 'text':
						case 'longText':
						case 'email':
						case 'date':
						case 'link':
						case 'number':
						case 'select':
						case 'createdAt':
						case 'updatedAt':
						case 'createdBy':
						case 'updatedBy':
							bRow.push({ id: uuidv4(), data: '' });
							break;
						case 'checkBox':
							bRow.push({ id: uuidv4(), data: false });
							break;
						case 'attached':
						case 'multiSelect':
							bRow.push({ id: uuidv4(), data: [] });
							break;
						default:
							bRow.push({ id: uuidv4(), data: '' });
							break;
					}
					await bodyModel.findOneAndUpdate({ _id: body[i]._id }, { row: bRow });
				}
			} else {
				let idx = row.findIndex((e) => e.order === index);
				row[idx] = data;
				await headModel.findOneAndUpdate({ _id: hId }, { row }, { new: true });
				if (typeChange) {
					for (let i = 0; i < body.length; i++) {
						let bRow = body[i].row;
						switch (data.type) {
							case 'text':
							case 'longText':
							case 'email':
							case 'date':
							case 'link':
							case 'number':
							case 'select':
							case 'createdAt':
							case 'updatedAt':
							case 'createdBy':
							case 'updatedBy':
								bRow[idx] = { id: uuidv4(), data: '' };
								break;
							case 'checkBox':
								bRow[idx] = { id: uuidv4(), data: false };
								break;
							case 'multiSelect':
							case 'attached':
								bRow[idx] = { id: uuidv4(), data: [] };
								break;
							default:
								bRow[idx] = { id: uuidv4(), data: '' };
								break;
						}
						await bodyModel.findOneAndUpdate({ _id: body[i]._id }, { row: bRow });
					}
				}
			}
			return res.json({ status: 1, data: { header, body } })
		} else {
			let headerData = new headModel({ row: [data] });
			await headerData.save();
			let create = await headModel.find();
			return res.json({ status: 1, data: create[0], new: true })
		}
	} catch (error) {
		return res.json({ status: 0, message: error.message })
	}
}

exports.updateAllowed = async (req, res) => {
	try {
		let { id, allowed, allowIds, editable, hId } = req.body;
		let user = await UserModel.findOne({ _id: id });
		user.allowed[hId] = allowed;
		user.allowIds[hId] = allowIds;
		user.editable[hId] = editable;

		UserModel.findOneAndUpdate({ _id: id }, { allowed: user.allowed, allowIds: user.allowIds, editable: user.editable }, { new: true }).then((data) => {
			return res.json({ status: 1, data })
		}).catch(err => {
			return apiResponse.ErrorResponse(res, err);
		});
	} catch (error) {
		return res.json({ status: 1, message: error.message })
	}
}

exports.setIds = async (req, res) => {
	const { } = req.body;
	let data = await headModel.find();
	for (let item of data) {
		for (let row of item.row) {
			row.id = uuidv4();
		}
		await headModel.findOneAndUpdate({ _id: item._id }, { row: item.row });
	}
	res.json({ status: 1 });
}

exports.deleteSelected = async (req, res) => {
	let { data, } = req.body;
	let rdata = await bodyModel.deleteMany({ _id: { $in: data } });
	let all = await bodyModel.find().sort({ order: 1 });
	for (let k in all) {
		all[k].order = k;
		await bodyModel.findByIdAndUpdate({ _id: all[k]._id }, { order: k });
	}
	if (rdata && all) {
		res.json({ status: 1, data: all });
	} else {
		res.json({ status: 0, data: rdata, message: 'server error' });
	}
}

exports.updateOrder = async (req, res) => {
	let { id, index, up, } = req.body;
	let fdata, sdata;
	if (up) {
		fdata = await bodyModel.updateOne({ order: index - 1 }, { $inc: { order: 1 } });
		sdata = await bodyModel.updateOne({ _id: id }, { $inc: { order: -1 } });
	} else {
		fdata = await bodyModel.updateOne({ order: index + 1 }, { $inc: { order: -1 } });
		sdata = await bodyModel.updateOne({ _id: id }, { $inc: { order: 1 } });
	}
	if (fdata && sdata) {
		res.json({ status: 1, data: [fdata, sdata] });
	} else {
		res.json({ status: 0, message: 'server error' });
	}
}

exports.duplicateRow = async (req, res) => {
	let { id, userId, } = req.body;
	let one = await bodyModel.findOne({ _id: id });
	let rdata = await bodyModel.updateMany({ order: { $gt: one.order } }, { $inc: { order: 1 } });
	if (rdata) {
		let newRow = new bodyModel({ row: one.row, order: one.order + 1, chat: 0, hId: one.hId, creator: userId, updater: userId });
		let ndata = await newRow.save();
		if (ndata) {
			res.json({ status: 1, data: ndata });
		} else {
			res.json({ status: 0, message: 'server error' });
		}
	} else {
		res.json({ status: 0, message: 'server error' });
	}
}

exports.clearLog = async (req, res) => {
	const { } = req.body;
	let data = await logModel.deleteMany();
	return res.json({ status: 1, data });
}

exports.clearHead = async (req, res) => {
	const { } = req.body;
	let data = await headModel.deleteMany();
	return res.json({ status: 1, data });
}

exports.clearBody = async (req, res) => {
	const { } = req.body;
	let data = await bodyModel.deleteMany();
	return res.json({ status: 1, data });
}

exports.customizeRow = async (req, res) => {
	const { data, key, } = req.body;
	let rdata = await bodyModel.updateMany({ [key]: data });
	return res.json({ status: 1, rdata });
}

exports.deleteAllRow = async (req, res) => {
	try {
		let { } = req.body;
		let body = await bodyModel.deleteMany();
		let log = await logModel.deleteMany();
		return res.json({ status: 1, body, log });
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.changeTab = async (req, res) => {
	try {
		let { id, } = req.body;
		let header = await headModel.findOne({ _id: id });
		let body = await bodyModel.find({ hId: id }).populate("creator", "_id firstName lastName email color").populate("updater", "_id firstName lastName email color").sort({ order: 1 })

		if (header && body) {
			return res.json({ status: 1, body, header });
		} else {
			return res.json({ status: 1, message: 'Server Error!' });
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateTab = async (req, res) => {
	try {
		let { id, name, } = req.body;
		let header = await headModel.findOneAndUpdate({ _id: id }, { name }, { new: true });
		if (header) {
			return res.json({ status: 1, header });
		} else {
			return res.json({ status: 1, message: 'Server Error!' });
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.deleteTab = async (req, res) => {
	try {
		let { currentId, } = req.body;
		await headModel.deleteOne({ _id: currentId });
		await bodyModel.deleteMany({ hId: currentId });
		return res.json({ status: 1 });
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.crateTab = async (req, res) => {
	try {
		let { name, pId } = req.body;
		let orders = await headModel.find({}, { order: true }).sort({ order: -1 });
		let order = 0;
		if (orders.length) {
			order = orders[0].order + 1;
		}

		let headerData = new headModel({ name, pId, row: [], order });
		headerData.save(function (err, data) {
			if (err) { return apiResponse.ErrorResponse(res, err); }
			return res.json({ status: 1, data })
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.approve = async (req, res) => {
	try {
		let { id, status } = req.body;
		let data = await bodyModel.findOneAndUpdate({ _id: id }, { done: status });
		if (data) {
			res.json({ status: 1 })
		} else {
			res.json({ status: 0, msg: 'server error' })
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.updateHeaderOrder = async (req, res) => {
	try {
		let { startIndex, endIndex, } = req.body;
		let newOrder = [];
		let orders = await headModel.find({}, { order: true }).sort({ order: 1 });
		if (startIndex < endIndex) {
			for (let item of orders) {
				if (item.order === startIndex) {
					await headModel.updateOne({ _id: item._id }, { order: endIndex })
				} else if (item.order > startIndex && item.order <= endIndex) {
					await headModel.updateOne({ _id: item._id }, { order: item.order - 1 })
				}
				newOrder.push(item);
			}
		} else {
			for (let item of orders) {
				if (item.order === startIndex) {
					await headModel.updateOne({ _id: item._id }, { order: endIndex })
				} else if (item.order >= endIndex && item.order < startIndex) {
					await headModel.updateOne({ _id: item._id }, { order: item.order + 1 })
				}
				newOrder.push(item);
			}
		}
		return res.json({ status: 1, data: newOrder })
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.transferTable = async (req, res) => {
	try {
		let { projectId, tableId, } = req.body;
		const oldData = await headModel.find({ pId: projectId }).sort({ order: -1 });
		const order = oldData[0] ? oldData[0].order + 1 : 0;
		const data = await headModel.findOneAndUpdate({ _id: tableId }, { pId: projectId, order }, { new: true });
		if (data) {
			return res.json({ status: 1, data })
		} else {
			return res.json({ status: 0, message: "Failed to transfer" })
		}
	} catch (err) {
		return res.json({ status: 0, message: 'server error' });
	}
}

exports.getPriceApi = async (req, res) => {
	try {
		let header = await headModel.findOne({ _id: req.params.tabId });
		if (header) {
			let body = await bodyModel.find({ hId: header._id });
			if (body) {
				header = header.row.map((e) => ({ name: e.name, order: e.order }));
				body = body.map((e) => {
					let data = e.row.map((h, i) => ({ data: h.data, order: header[i].order }));
					return data;
				})
				res.json({ status: 1, header, body });
			} else {
				res.json({ status: 0, message: 'no data' })
			}
		} else {
			res.json({ status: 0, message: 'no data' })
		}
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.createInviteKey = async (req, res) => {
	try {
		const { tableId, userId } = req.body;
		const key = await jwt.sign({ tableId, userId, date: new Date().valueOf() }, secret, {});
		res.json({ status: 1, key });
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}


exports.getInvite = async (req, res) => {
	try {
		const { id } = req.body;

		jwt.verify(id, secret, async (error, keyData) => {
			if (error) {
				res.json({ status: 0, message: "Invalid key" })
			} else {
				const header = await headModel.findOne({ _id: keyData.tableId });
				if (header) {
					const users = await UserModel.find();
					const body = await bodyModel.find({ hId: header._id }).populate("creator", "_id firstName lastName email color").populate("updater", "_id firstName lastName email color").sort({ order: 1 })
					res.json({ status: 1, data: { header, body, users } })
				} else {
					res.json({ status: 0, message: "Data doesn't exsit" })
				}
			}
		});
	} catch (err) {
		return res.json({ status: 0, msg: 'server error' });
	}
}

exports.test = async (req, res) => {
	const directoryPath = path.join(__dirname, "..", 'public', 'attached/New folder');
	const files = fs.readdirSync(directoryPath);

	let fileInfo = []

	for (const item of files) {
		const filePath = path.join(__dirname, "..", 'public', 'attached', item);
		const extension = path.extname(item);
		const fileData = await fs.statSync(filePath)
		fileInfo.push({ name: item, extension, size: fileData.size, isFile: fileData.isFile(), birthtime: fileData.birthtime })
	}

	return res.json({ status: 1, fileInfo })
}