var express = require('express');
var router = express.Router();
var path = require("path");
const rootPath = path.dirname(require.main.filename);
let {
	RespBaseData,
	Resolve
} = require(rootPath + "/model/CommenModel.js")
let signDao = require(rootPath + "/dao/sign.js")
let utils = require(rootPath + "/public/javascripts/utils")
let resUtils = require(rootPath + "/public/javascripts/ResUtils")
let CONSTANT = require(rootPath + "/public/javascripts/constant")
let db = require(rootPath + "/db/dbUtils.js")
let dayjs = require("dayjs")
let userDao = require(rootPath + "/dao/user.js")

router.use(function (req, res, next) {
	next();
})

router.route('/').post(function (req, res, next) {
	next()
});


router.route('/sign').post(function (req, res, next) {
	signDao.sign(req.body)
		.then((data) => {
			resUtils.sendData(res, data);
		})
		.catch(next)

});


//获取所有签到信息
// queryFlag:1查询所有，2，查询最近n天,3,按月份查询,4,查询当天的签到信息
let getSignInfo = function (req, res, next) {
	let object = req.body;
	if (object.queryFlag == 4) {
		let t = {};
		object.queryFlag = 2;
		object.lastDays = 3;
		signDao.getSignInfo(object)
			.then((data) => {//data是最近三天签到的数据
				t.list = data;//兼容处理
				if (data.length < 3 && data.length >= 0) {//如果最近三天有未签到的
					let unsignDays = 3 - data.length;
					let dayStr = "";
					switch (unsignDays) {
						case 1: dayStr = "一"; break
						case 1: dayStr = "两"; break
						case 1: dayStr = "三"; break
					}
					t.latestSignTip = "温馨提醒: 您最近三天有" + dayStr + "天未签到";
				} else if (data.length == 3) {
					t.latestSignTip = ""
				}
				return signDao.queryHasSignedNumber(object);//已经签到的天数
			})
			.then((number) => {
				let couragementTip = CONSTANT.getCouragement(number);//根据已经签到的天数给予用户鼓励
				t.couragementTip = couragementTip;
				let sendData = {
					obj: t,
					list: t.list,//兼容处理
					couragementTip: t.couragementTip//兼容处理
				}
				resUtils.sendData(res, Resolve.success(sendData));
			})
			.catch(next)
		return;
	}

	signDao.getSignInfo(object)
		.then((data) => {
			resUtils.sendData(res, Resolve.success({ list: data }));
		})
		.catch(next)
}
router.route('/query').post(getSignInfo).get(getSignInfo);

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

	let note = `
		您一共签到${data.allSignDays}天，其中已完成${data.completeDays}天,未完成${data.unCompleteDays}天\n
		最近一个月已完成${data.latest30CompleteDays}天，未完成${data.latest30UnCompleteDays}天,积累了${data.latest30spiritValue}精气值\n
		自参与持戒计划，您共积累了${data.allSpiritValue}精气值\n
	`;

	if (data.latest30spiritValue >= normalSpiritValue) {
		note += "您已经精气正常\n"
	} else if (data.latest30spiritValue < normalSpiritValue && data.latest30spiritValue >= normalSpiritValue * 0.75) {
		note += "您已经精气不足\n"
	} else if (data.latest30spiritValue >= normalSpiritValue * 0.5) {
		note += "您已经精气严重不足\n"
	} else {
		note += "您已经精气亏损\n"
	}

	data.note = note;

	let weekUnCompleteNums = []
	for(var i=0;i<=6;i++){
		let sql = `SELECT  COUNT(*) as number FROM SIGN WHERE  WEEKDAY(signDate)=${i} AND signState =2 and userId = ${object.userId}`
		let data = await db.query(sql)
		weekUnCompleteNums.push(data[0].number)
	}
	data.weekUnCompleteNums = weekUnCompleteNums;

	resUtils.sendData(res, Resolve.success({ obj: data, list: list }));


});


router.route('/getXinDe').post( async function (req, res, next) {
	let userId = req.body.userId;
	let sql = `select * from sign where userId = ${userId}  and signComment is not null and signComment <> ''`
	  let data = await db.query(sql)
	  console.log(data)
	  resUtils.sendData(res, Resolve.success({ list: data}));
});

module.exports = router;