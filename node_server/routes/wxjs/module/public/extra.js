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

router.route('/get_extra_info').post(function (req, res, next) {
	let sql = "select * from extra"
	db.query(sql).then(data => {
		console.log(data)
		let obj = {}
		if (data && data.length != 0) {
			obj = data[0];
		}
		resUtils.sendData(res, Resolve.success({ obj }));
	}).catch(next)

});

router.route('/set_extra_info').post(function (req, res, next) {
	let extradata = req.body.extra;
	let sql = ` update extra set notice ='${extradata.notice}',
	showNotice =${extradata.showNotice},
	showMessageBoard =${extradata.showMessageBoard},
	showNoteInput =${extradata.showNoteInput},
	showHomePic =${extradata.showHomePic},
	showSwiper =${extradata.showSwiper},
	showHomeTip =${extradata.showHomeTip}`
	db.query(sql).then(data => {
		resUtils.sendData(res, Resolve.success("配置修改成功"));
	}).catch(next)

});


router.route('/get_swiper_info').post(function (req, res, next) {
	let sql = "select * from swiper"
	db.query(sql).then(data => {
		console.log(data)
		//let obj = {}
		if (data && data.length != 0) {
		
		}
		resUtils.sendData(res, Resolve.success({ list:data }));
	}).catch(next)

});


router.route('/get_extra_info').get(function (req, res, next) {
	let sql = "select * from extra"
	db.query(sql).then(data => {
		console.log(data)
		let obj = {}
		if (data && data.length != 0) {
			obj = data[0];
		}
		resUtils.sendData(res, Resolve.success(obj));
	}).catch(next)
	// var data = fs.readFileSync("main.txt", "utf-8");
	// console.log(data);
	//  let obj = JSON.parse(data)

	// console.log(obj);
	// resUtils.sendData(res, Resolve.success(obj));
});




module.exports = router;