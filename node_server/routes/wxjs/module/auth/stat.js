var express = require('express');
var router = express.Router();
var path = require("path");

var fs = require("fs");
const rootPath = path.dirname(require.main.filename);

var commenModelPath = rootPath + "/model/CommenModel.js";
var dbUtils = rootPath + "/db/dbUtils.js";
var utilsPath = rootPath + "/public/javascripts/utils"

let {
	RespBaseData,
	Resolve
} = require(rootPath + "/model/CommenModel.js")
let db = require(dbUtils)
let utils = require(utilsPath)
let resUtils = require(rootPath + "/public/javascripts/ResUtils")

let dayjs = require("dayjs");
let userDao = require(rootPath + "/dao/user.js")

router.route('/get_stat_info').post(function (req, res, next) {

	userDao.getAllUserInfo().then(async (data) => {
		console.log("getAllUserInfo");
		console.log(data);
		let list = [];

		let userlist = data.data.list
		for (var i = 0; i < userlist.length; i++) {

			let sql = `select count(*) as num from sign where userId= '${userlist[i].userId}'`
			let count = await db.query(sql)
			let item = {};
			item.nickName = userlist[i].nickName;
			item.signNum = count[0].num
			if(count[0].num==0){
				continue
			}
			list.push(item)
		}
		var list2 = list.sort(function (a, b) {
			if (a.signNum < b.signNum) {
				return 1;
			} else if (a.signNum > b.signNum) {
				return -1
			} else {
				return 0;
			}
		})
		resUtils.sendData(res, Resolve.success({ list: list2 }));

	}).catch(next);
});



router.route('/get_stat_info').get(function (req, res, next) {

	userDao.getAllUserInfo().then(async (data) => {
		console.log("getAllUserInfo");
		console.log(data);
		let list = [];

		let userlist = data.data.list
		for (var i = 0; i < userlist.length; i++) {

			let sql = `select count(*) as num from sign where userId= '${userlist[i].userId}'`
			let count = await db.query(sql)
			let item = {};
			item.nickName = userlist[i].nickName;
			item.signNum = count[0].num
			list.push(item)
		}
		var list2 = list.sort(function (a, b) {
			if (a.signNum < b.signNum) {
				return 1;
			} else if (a.signNum > b.signNum) {
				return -1
			} else {
				return 0;
			}
		})
		resUtils.sendData(res, Resolve.success({ list: list2 }));

	}).catch(next);
});




module.exports = router;