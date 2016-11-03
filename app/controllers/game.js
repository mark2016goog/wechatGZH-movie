'use strict'

const wx=require('../../wx/index')
const util=require('../../libs/util')
const Movie=require('../api/movie')

exports.guess=function* (next){
	const wechatApi=wx.getWechat()
	//拿到access_token
	let data=yield wechatApi.fetchAccessToken()
	let access_token=data.access_token
	//根据access_token拿到api_ticket
	let ticketData=yield wechatApi.fetchTicket(access_token)
	let ticket=ticketData.ticket
	//获取当前完整路径
	let url=this.href
	let params=util.sign(ticket,url)
	console.log('params:',params)
	yield this.render('wechat/game',params)
	console.log('>>>>>>>>>>>>>>>game.js:20')
}

exports.find=function* (next){
	var id=this.params.id
	console.log('<<<<<<<<<<<<<<<<<<<game.js:24:this:')
	const wechatApi=wx.getWechat()
	//拿到access_token
	let data=yield wechatApi.fetchAccessToken()
	let access_token=data.access_token
	//根据access_token拿到api_ticket
	let ticketData=yield wechatApi.fetchTicket(access_token)
	let ticket=ticketData.ticket
	//获取当前完整路径
	let url=this.href
	let params=util.sign(ticket,url)
	console.log('game.js:34:id:')
	var movie=yield Movie.searchById(id)
	console.log('game.js:35:movie:')
	params.movie=movie
	console.log('game.js:39:params:')
	yield this.render('wechat/movie',params)
	console.log('game.js:41')
}

