var express = require('express');
var router = express.Router();
var path = require("path");
const rootPath = path.dirname(require.main.filename);;
let {
	RespBaseData,
	Resolve
} = require(rootPath + "/model/CommenModel.js")
let userDao = require(rootPath + "/dao/user.js")
let utils = require(rootPath + "/public/javascripts/utils")
let resUtils = require(rootPath + "/public/javascripts/ResUtils")
let db = require(rootPath + "/db/dbUtils.js")
let CONSTANT = require(rootPath + "/public/javascripts/constant")

router.route('/index').post(function (req, res, next) {
	let t = !utils.isEmpty(req.body) ? req.body : req.query;
});

router.route('/get_all_userinfo').post(function (req, res, next) {
	userDao.getAllUserInfo().then((data) => {
		console.log(data);
		resUtils.sendData(res, data);
	}).catch(next);

});
router.route('/modifyNickName').post(function (req, res, next) {
 
	let sql1 = `update sign 
	set nickName = '${req.body.nickName}'
	where userId = ${req.body.userId}`
	db.query(sql1).then((data) => {
	
	}).catch(next);

	let sql2 = `update user 
	set nickName = '${req.body.nickName}'
	where userId = ${req.body.userId}`
	db.query(sql2).then((data) => {
		resUtils.sendData(res, Resolve.success("修改成功"));
	}).catch(next);


	let sql3 = `update msg 
	set nickName = '${req.body.nickName}'
	where userId = ${req.body.userId}`
	db.query(sql3).then((data) => {
		
	}).catch(next);

});

 


module.exports = router;