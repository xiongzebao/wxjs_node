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
let signDao = require(rootPath + "/dao/sign.js")

// router.route('/get_stat_info').post(function (req, res, next) {

// 	userDao.getAllUserInfo().then(async (data) => {
// 		console.log("getAllUserInfo");
// 		console.log(data);
// 		let list = [];

// 		let userlist = data.data.list
// 		for (var i = 0; i < userlist.length; i++) {

// 			let sql = `select count(*) as num from sign where userId= '${userlist[i].userId}'`
// 			let count = await db.query(sql)
// 			let item = {};
// 			item.nickName = userlist[i].nickName;
// 			item.signNum = count[0].num
// 			if(count[0].num==0){
// 				continue
// 			}
// 			list.push(item)
// 		}
// 		var list2 = list.sort(function (a, b) {
// 			if (a.signNum < b.signNum) {
// 				return 1;
// 			} else if (a.signNum > b.signNum) {
// 				return -1
// 			} else {
// 				return 0;
// 			}
// 		})
// 		resUtils.sendData(res, Resolve.success({ list: list2 }));

// 	}).catch(next);
// });



router.route('/get_stat_info').post(function (req, res, next) {

	userDao.getAllUserInfo().then(async (data) => {

		let list = [];
		let userlist = data.data.list
		for (var i = 0; i < userlist.length; i++) {
			let sql = `select count(*) as num from sign where userId= '${userlist[i].userId}'`
			let count = await db.query(sql)
			let item = {};
			item.nickName = userlist[i].nickName;
			item.avatarUrl = userlist[i].avatarUrl;
			item.gender = userlist[i].gender;
			item.level= userlist[i].level;
			item.admin= userlist[i].admin;
			

			item.signNum = count[0].num

			if (item.signNum >= 7) {
				list.push(item)
			}
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


let spiritAdd = 2;
let spiritReduce = 3;

router.route('/get_sign_detail').post(async function (req, res, next) {
	let object = req.body
	let data = {}
	//一共签到天数
	let allSignDays = await signDao.queryHasSignedNumber(object);
	data.allSignDays = allSignDays;

	//已完成天数
	let sql = "";
	sql = `SELECT  COUNT(*) as number FROM sign WHERE signState=1 and userId= ${object.userId}`;
	let wanchengDays = await db.query(sql)
	data.completeDays = wanchengDays[0].number;
	//未完成天数
	data.unCompleteDays = data.allSignDays - data.completeDays
	//最近30天的已完成天数
	if (allSignDays > 30) {
		object.lastDays = 30;
		let sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=1 and userId=${object.userId} and DATE_SUB(curdate(), INTERVAL ${object.lastDays} DAY) <= DATE(signDate)`;
		let recent30daysNum = await db.query(sql)
		console.log(recent30daysNum)
		data.latest30CompleteDays = recent30daysNum[0].number;
		sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=2 and userId=${object.userId} and DATE_SUB(curdate(), INTERVAL ${object.lastDays} DAY) <= DATE(signDate)`;
		let unCompleteNum = await db.query(sql)
		data.latest30UnCompleteDays = unCompleteNum[0].number;
		data.latest30spiritValue = data.latest30CompleteDays * spiritAdd - (data.latest30UnCompleteDays) * spiritReduce
	}


	//所有精气值
	data.allSpiritValue = data.completeDays * spiritAdd - data.unCompleteDays * spiritReduce
	//月报表
	let userinfo = await userDao.queryUserInfo({
		userId: object.userId
	});
	let registTime = userinfo.data.dateTime
	let registdayjs = dayjs(registTime);
	let curyear = dayjs().year();
	let list = []
	let normalSpiritValue = spiritAdd * (30) - 4 * (spiritReduce + spiritAdd);

	while (registdayjs.unix() < dayjs().unix()) {
		let item = {};
		let yearmonth = dayjs(new Date(curyear, registdayjs.month())).format("YYYY-MM");
		item.date = yearmonth;
		let sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=1 and userId=${object.userId} and DATE_FORMAT(signDate,'%Y-%m') = '${yearmonth}'`;
		let monthComplete = await db.query(sql)
		console.log(monthComplete)
		item.completeDays = monthComplete[0].number;
		sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=2 and userId=${object.userId} and DATE_FORMAT(signDate,'%Y-%m') = '${yearmonth}'`;
		let monthUnComplete = await db.query(sql)
		item.unCompleteDays = monthUnComplete[0].number;
		item.spiritValue = item.completeDays * spiritAdd - item.unCompleteDays * spiritReduce

		if (item.spiritValue >= normalSpiritValue) {
			item.note = " 正常"
		} else if (item.spiritValue < normalSpiritValue && item.spiritValue >= normalSpiritValue * 0.75) {
			item.note = " 轻微不足"
		} else if (item.spiritValue >= normalSpiritValue * 0.5) {
			item.note = " 严重不足"
		} else {
			item.note = "  亏损"
		}

		list.push(item)
		registdayjs = registdayjs.add(1, 'month');
	}
	let note = `1,您一共签到${data.allSignDays}天，其中已完成${data.completeDays}天,未完成${data.unCompleteDays}天
		2,最近一个月已完成${data.latest30CompleteDays}天，未完成${data.latest30UnCompleteDays}天,积累了${data.latest30spiritValue}精气值
		3,自参与持戒计划，您共积累了${data.allSpiritValue}精气值
	`;
	if (data.latest30spiritValue >= normalSpiritValue) {
		note += "4,您已经精气正常\n"
	} else if (data.latest30spiritValue < normalSpiritValue && data.latest30spiritValue >= normalSpiritValue * 0.75) {
		note += "4,您已经精气不足\n"
	} else if (data.latest30spiritValue >= normalSpiritValue * 0.5) {
		note += "4,您已经精气严重不足\n"
	} else {
		note += "4,您已经精气亏损\n"
	}
	data.note = note;
	let weekUnCompleteNums = []
	for (var i = 0; i <= 6; i++) {
		let sql = `SELECT  COUNT(*) as number FROM sign WHERE  WEEKDAY(signDate)=${i} AND signState =2 and userId = ${object.userId}`
		let data = await db.query(sql)
		weekUnCompleteNums.push(data[0].number)
	}
	data.weekUnCompleteNums = weekUnCompleteNums;
	resUtils.sendData(res, Resolve.success({ obj: data, list: list }));
});


router.route('/getXinDe').post(async function (req, res, next) {
	let userId = req.body.userId;
	let sql = `select nickName,DATE_FORMAT(signDate,'%Y-%m-%d') as signDate ,signComment,signState,reason from sign where userId = ${userId}  and signComment is not null and signComment <> ''`
	let data = await db.query(sql)
	resUtils.sendData(res, Resolve.success({ list: data }));
});

//全局统计
router.route('/get_all_sign_detail').post(async function (req, res, next) {
	let weekUnCompleteNums = []
	let reason = []
	for (var i = 0; i <= 6; i++) {
		let sql = `SELECT  COUNT(*) as number FROM sign WHERE  WEEKDAY(signDate)=${i} AND signState =2`
		let data = await db.query(sql)
		weekUnCompleteNums.push(data[0].number)
	}



	for (var i = 0; i <= 4; i++) {
		let sql = `SELECT  COUNT(*) as number FROM sign WHERE  signState =2 and reason =${i}`
		let data = await db.query(sql)
		reason.push(data[0].number)
	}
	let obj = {}
	obj.weekUnCompleteNums = weekUnCompleteNums;
	obj.reason = reason;
	resUtils.sendData(res, Resolve.success({ obj: obj }));
});

router.route('/get_home_spirit').post(async function (req, res, next) {
	let object = req.body
	let retdata = {};
	//精气容量
	retdata.totalValue = 120;
	//最近60天精气值
	object.lastDays = 60;
	let sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=1 and userId=${object.userId} and DATE_SUB(curdate(), INTERVAL ${object.lastDays} DAY) <= DATE(signDate)`;
	let recent30daysNum = await db.query(sql)
	console.log(recent30daysNum)
	retdata.latest30CompleteDays = recent30daysNum[0].number;
	sql = `SELECT  COUNT(*) as number  FROM sign WHERE signState=2 and userId=${object.userId} and DATE_SUB(curdate(), INTERVAL ${object.lastDays} DAY) <= DATE(signDate)`;
	let unCompleteNum = await db.query(sql)
	retdata.latest30UnCompleteDays = unCompleteNum[0].number;
	retdata.value = retdata.latest30CompleteDays * spiritAdd - (retdata.latest30UnCompleteDays) * spiritReduce
	resUtils.sendData(res, Resolve.success({ obj: retdata }));
});




module.exports = router;