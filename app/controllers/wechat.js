'use strict'

const wechat=require('../../wechat/g')
const reply=require('../../wx/reply')
const wx=require('../../wx/index')

exports.hear=function *(next){
	this.middle=wechat(wx.wechatOptions.wechat,reply.reply)

	yield this.middle(next)
}