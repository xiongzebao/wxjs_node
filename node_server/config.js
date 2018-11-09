process.env.NODE_ENV = 'development';
//process.env.NODE_ENV = 'product';
var path = require("path");
const rootPath = path.dirname(require.main.filename);
let utils = require(rootPath + "/public/javascripts/utils")
let mysqlpwd = utils.getMySqlPwd()
console.log(mysqlpwd)
module.exports = {
	'root_path':__dirname,
	'originList':["http://xiongbin.nat300.top"],//跨域访问白名单
    'superSecret': 'haha,haha',//校验token用的
    'database': 'mongodb://127.0.0.1',
   // 'host':'xiongbin.top',//主机域名
    'host':'localhost',//主机域名
    'user':'root',//数据库连接用户名
    'password': mysqlpwd,//数据库连接密码 
    'port':'3306'//数据库连接端口号
};