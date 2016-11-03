'use strict'

const path=require('path')
const util=require('../libs/util')
const Wechat=require('../wechat/wechat')
//存放access_token，避免调用超过api上限
const wechat_file=path.join(__dirname,'../config/wechat_file.txt')
//存放api_ticket，避免调用超过api上限
const wechat_ticket_file=path.join(__dirname,'../config/wechat_ticket_file.txt')

const config={
	wechat:{
		appID:'xxxxxxxxxxxxx',
		appSecret:'xxxxxxxxxxxxxxxxxxxxx',
		token:'weixin',
		getAccessToken(){
			return util.readFileAsync(wechat_file)
		},
		saveAccessToken(data){
			data=JSON.stringify(data)
			return util.writeFileAsync(wechat_file,data)
		},
		getTicket(){
			return util.readFileAsync(wechat_ticket_file)
		},
		saveTicket(data){
			data=JSON.stringify(data)
			return util.writeFileAsync(wechat_ticket_file,data)
		}
	}
}

exports.wechatOptions=config

exports.getWechat=function(){
	const wechatApi=new Wechat(config.wechat)
	//进行实例化
	return wechatApi
}
