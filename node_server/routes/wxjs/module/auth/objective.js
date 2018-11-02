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

router.route('/add_objective').post(async function (req, res, next) {
	let currentTime = dayjs().format("YYYY-MM-DD HH:mm:ss");
	/* if(!utils.contains(req.body,"errorInfo,errorCode,errorType")){
	 	resUtils.sendError(res,"参数错误"+req.body)
	 	return;
	 }*/
	let sql = `select count(*) from objective where userId = ${req.body.userId} and state=1`
	let result = await db.query(sql)
	if (result.number != 0) {
		resUtils.sendData(res, Resolve.success("您有个目标正在进行中，请完成后再添加下一个目标"));
		return;
	}

	req.body.createTime = currentTime;
	db.insert("objective", req.body);
	resUtils.sendData(res, Resolve.success("添加成功"));
});

async function getProgressObjective(userId) {
	let sql = `select * from objective where userId = ${userId} and state= 2`
	let result = await db.query(sql)
	return result;
}


function dealSignDays(signData){
	let data = {result:1};

	for(let i=0;i<signData.length;i++){
		if(signData[i].signState==2){
			data.result=2;
			data.sign = signData[i]
			break
		}
	}

	let shouldSignNum = dayjs(signData[signData.length-1].signDate).diff(signData[0], "day")


}
 

async function computeMyObjective(userId) {
 
	//检查是否有正在进行的持戒目标
	let result = await  getProgressObjective(userId);
	if (result.length == 0) {
		return;
	}

    console.log(result)
	let objective = result[0]
	//dayjs(objective.createTime).add(objective.days,"day")
	
	let days = objective.days;
	let startTime = objective.createTime;
	let endTime = dayjs(objective.createTime).add(objective.days,"day");

	let progressDays = dayjs().diff(startTime, "day")
	let progress = progressDays / days;//进度

	let isDeadLine = progress >= 1 ? true : false


	let formatStartTime = dayjs(startTime).format("YYYY-MM-DD hh:mm:ss")
	let formatEndTime = endTime.format("YYYY-MM-DD hh:mm:ss")
	let signData = await	getTimeSign(userId,formatStartTime,formatEndTime)
	 
	let state=0;
	let result =1;
	if(isDeadLine){
		state=1;
		if(signData.length<days){
			result = 2
		}else{
			for(let i=0;i<signData.length;i++){
				if(signData[i].signState==2){
					result=2;
					break
				}
			}
		}
	}

	if(!isDeadLine){

	}




	let sql = `update objective set progress = ${progress},state = ${state} where id = ${objective.id}`
	db.query(sql)
	return;

}

//获取两个时间段的签到数据
async function getTimeSign(userId,startTime,endTime){
	let sql = `select * from sign where userId = ${userId} and signDate between '${startTime}' and '${endTime}'`
    console.log(sql)
	let result = await db.query(sql);
	return result;
}


router.route("/get_myobjective").post(async function (req, res, next) {

	await computeMyObjective(req.body.userId)

	let sql = `select * from objective where userId = ${req.body.userId}`
	if (req.body.state) {
		sql += " and state = " + req.body.state
	}
	db.query(sql).then(data => {
		console.log(data)
		resUtils.sendData(res, Resolve.success({ list: data }));
	}).catch(next)

})

router.route("/get_allobjective").post(function (req, res, next) {

	let sql = `select * from objective  `
	if (req.body.state) {
		sql += " where  state = " + req.body.state
	}
	db.query(sql).then(data => {
		console.log(data)
		resUtils.sendData(res, Resolve.success({ list: data }));
	}).catch(next)

})




module.exports = router;