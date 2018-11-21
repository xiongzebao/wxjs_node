var express = require('express');
var router = express.Router();
var path = require("path");
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

router.route('/add_msg').post(async function(req, res, next) {
	let currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
	/* if(!utils.contains(req.body,"errorInfo,errorCode,errorType")){
	 	resUtils.sendError(res,"参数错误"+req.body)
	 	return;
	 }*/
	 let sql = `select * from user where userId = ${req.body.userId}`
	 let data = await db.query(sql)
	  console.log(data)
	  let u = data[0]
    
	 let t={}
	 t.userId = u.userId;
	 t.level = u.level
	 t.nickName = u.nickName
	 t.admin = u.admin
	 t.avatarUrl = u.avatarUrl
	 t.content = req.body.content
	 t.createTime = currentTime;
	 t.gender = u.gender;

	 db.insert("msg",t);
	 resUtils.sendData(res,Resolve.success("操作成功"));
});

router.route("/get_msg").post(function(req, res, next){
	let sql = "select id, userId, nickName,content,DATE_FORMAT(createTime,'%Y-%m-%d') as createTime,avatarUrl,`admin`, level,gender from msg where del <> 1"

	db.query(sql).then(data=>{
		console.log(data)
		resUtils.sendData(res,Resolve.success({list:data}));
	}).catch(next) 
})

router.route("/del_msg").post(function(req, res, next){
	let sql = " update msg set del = 1 where id = "+req.body.id;

	db.query(sql).then(data=>{
		console.log(data)
		resUtils.sendData(res,Resolve.success("删除成功"));
	}).catch(next) 
})



module.exports = router;