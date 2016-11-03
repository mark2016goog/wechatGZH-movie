/*
 *用来设置对用户各种形式的回复
 */
'use strict'

const path=require('path')
const wx=require('../wx/index')
const Movie=require('../app/api/movie')
const wechatApi=wx.getWechat()

const help='thanks for focusing our movie\n'+
						'回复1~3，测试文字回复\n'+
						'回复4，测试图文回复\n'+
						'回复 首页，进入电影首页\n'+
						'回复 电影名字，查询电影信息\n'+
						'回复 语音，查询电影信息\n'+
						'也可以点击<a href="http://zhtwx.com.cn/movie">语音查电影</a>，查询电影信息\n'

exports.reply=function* (next){
	const message=this.weixin
	console.log('weixin.js:message:',message)
	console.log('message.MsgType,message.Event:',message.MsgType+','+message.Event)
	//如果是event，则属于事件推送
	if(message.MsgType==='event'){
		//如果是订阅
		if(message.Event==='subscribe'){
			
			this.body=help
		}
		//如果是取消订阅
		else if(message.Event==='unsubscribe'){
			console.log('无情取关')
			this.body=''
		}
		//如果是地理位置
		else if(message.Event==='LOCATION'){
			this.body='您上报的位置是：'+message.Latitude+'/'+message.Longitude+'-'+message.Precision
		}
		//如果是点击菜单请求
		else if(message.Event==='CLICK'){
			var news=[]
			//最热门
			if(message.EventKey==='movie_hot'){
				//-1 和 1 代表从数据库查询倒序还是逆序
				let movies=yield Movie.findHotMovies(-1,10)
				if(movies.length<1){
					news='对不起，没有符合要求的电影！'
				}
				else{
					movies.forEach(function(movie){
						news.push({
							title:movie.title,
							description:movie.title,
							picUrl:movie.poster,
							url:'http://zhtwx.com.cn/movie/'+movie._id
						})
					})
				}

			}
			//最冷门
			else if(message.EventKey==='movie_cold'){
				let movies=yield Movie.findHotMovies(1,10)
				if(movies.length<1){
					news='对不起，没有符合要求的电影！'
				}else{
					movies.forEach(function(movie){
						news.push({
							title:movie.title,
							description:movie.title,
							picUrl:movie.poster,
							url:'http://zhtwx.com.cn/movie/'+movie._id
						})
					})
				}
			}
			//电影类型，犯罪
			else if(message.EventKey==='movie_crime'){
				let cat=yield Movie.findMoviesByCate('犯罪')
				if(cat.movies.length<1){
					news='对不起，没有符合要求的电影！'
				}else{
					cat.movies.forEach(function(movie){
						news.push({
							title:movie.title,
							description:movie.title,
							picUrl:movie.poster,
							url:'http://zhtwx.com.cn/movie/'+movie._id
						})
					})
				}
			}
			//电影类型，动画
			else if(message.EventKey==='movie_cartoon'){
				let cat=yield Movie.findMoviesByCate('动画')
				if(cat.movies.length<1){
					news='对不起，没有符合要求的电影！'
				}else{
					cat.movies.forEach(function(movie){
						news.push({
							title:movie.title,
							description:movie.title,
							picUrl:movie.poster,
							url:'http://zhtwx.com.cn/movie/'+movie._id
						})
					})
				}
			}
			//帮助
			else if(message.EventKey==='help'){
				news=help
			}

			this.body=news
		}
		
	}
	else if(message.MsgType==='voice'){
		let voiceText=message.Recognition
		const movies=yield Movie.searchByName(voiceText)
			if(!movies || movies.length===0){
				movies=yield Movie.searchByDouban(voiceText)
			}

			if(movies && movies.length>0){
				let reply=[]

				movies=movies.slice(0,10)
				movies.forEach(function(movie){
					reply.push({
						title:movie.title,
						description:movie.title,
						picUrl:movie.poster,
						url:'http://zhtwx.com.cn/wechat/movie/'+movie._id
					})
				})
			}else{
				reply='没有查询到与 '+content+' 匹配的电影，换个试试'
			}
			this.body=reply
	}
	else if(message.MsgType==='location'){
		this.body='message.MediaId:'+message.Label
		console.log(this.body)
	}
	else if(message.MsgType==='image'){
		this.body='您的位置是:'+message.MediaId+'上传成功！'
		console.log(this.body)
	}
	//如果是text，则属于普通消息
	else if(message.MsgType==='text'){
		const content=message.Content
		let reply='你说的 '+message.Content+' 太复杂了'

		if(content==='1'){
			//文本消息
			reply='天下第一'
		}
		else if(content==='2'){
			reply='天下第二'
		}else if(content==='3'){
			reply='天下第三'
		}else if(content==='4'){
			//图文消息（点击图文，跳转）
			reply=[{
				title:'是时候展现真正的技术了',
				description:'低调',
				picUrl:'http://res.cloudinary.com/moveha/image/upload/v1441184110/assets/images/Mask-min.png',
				url:'https://github.com/'
			}]
		}else{
			let movies=yield Movie.searchByName(content)
			if(!movies || movies.length===0){
				movies=yield Movie.searchByDouban(content)
			}

			if(movies && movies.length>0){
				reply=[]
				console.log('<<<<<<<<<<<<',movies)
				movies=movies.slice(0,10)
				movies.forEach(function(movie){
					console.log('app.js:165:movies.url','http://zhtwx.com.cn/wechat/movie/'+movie._id)
					reply.push({
						title:movie.title,
						description:movie.title,
						picUrl:movie.poster,
						url:'http://zhtwx.com.cn/movie/'+movie._id
					})
				})
			}else{
				reply='没有查询到与 '+content+' 匹配的电影，换个试试'
			}
		}
		console.log('reply.js:reply:',reply)
		this.body=reply
	}
	//设置好需要发送给用户的消息之后，
	//因为没有下一个中间件了，所以返回回去，执行wechat.js中的Wechat.prototype.reply()函数
	yield next
}