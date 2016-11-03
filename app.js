'use strict'

//koa框架
const Koa=require('koa')
const path=require('path')
const fs=require('fs')
const moment=require('moment')
const mongoose=require('mongoose')
// var User=mongoose.model('User')
var User=require('./app/models/User')

const dbUrl='mongodb://localhost/movieGZH'

mongoose.connect(dbUrl)

// models loading
var models_path = __dirname + '/app/models'
var walk = function(path) {
  fs
    .readdirSync(path)
    .forEach(function(file) {
      var newPath = path + '/' + file
      var stat = fs.statSync(newPath)

      if (stat.isFile()) {
        if (/(.*)\.(js|coffee)/.test(file)) {
          require(newPath)
        }
      }
      else if (stat.isDirectory()) {
        walk(newPath)
      }
    })
}
walk(models_path)


const menu=require('./wx/menu')
const wx=require('./wx/index')
const wechatApi=wx.getWechat()

// 自定义菜单
// 在一开始时就先清除再创建菜单menu，或者也可以使用下面输入数字19、20，来创建、删除
wechatApi.deleteMenu().then(function(){
	return wechatApi.createMenu(menu)
})
.then(function(msg){
	console.log(msg)
})

const app=new Koa()
const Router=require('koa-router')
const session=require('koa-session')
const bodyParser=require('koa-bodyparser')
const router=new Router()
const views=require('koa-views')

app.use(views(__dirname+'/app/views',{
	extension:'jade',
	locals:{
		moment:moment
	}
}))

//存储session
app.keys=['moviesession']
app.use(session(app))
app.use(bodyParser())

app.use(function* (next){
	var user=this.session.user

	if(user && user._id){
		this.session.user=yield User.findOne({_id:user._id}).exec()
		//this.state就是koa-views中，模板引擎进行渲染de时候，传递的本地变量
		this.state.user=this.session.user
	}else{
		this.state.user=null
	}
	// 继续往下走
	yield next
})

require('./config/routes')(router)

app
	.use(router.routes())
	.use(router.allowedMethods())



const port=80
app.listen(port)

console.log('Listening at '+port+'...')