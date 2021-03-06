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
				
					t.latestSignTip = "温馨提醒: 您最近三天有" + unsignDays + "天未签到";
				} else if (data.length == 3) {
					t.latestSignTip = ""
				}
				return signDao.queryHasSignedNumber(object);//已经签到的天数
			})
			.then((number) => {
				let couragementTip = CONSTANT.getCouragement(number);//根据已经签到的天数给予用户鼓励
				t.couragementTip = couragementTip;
				t.signDays= number;
				let sendData = {
					obj: t,	
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



module.exports = router;