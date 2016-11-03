'use strict'

const xml2js=require('xml2js')
const Promise=require('bluebird')
const tpl=require('./tpl')

exports.parseXMLAsync=function(xml) {
	return new Promise(function(resolve,reject) {
		xml2js.parseString(xml,{trim:true},function(err,content){
			if(err){
				reject(err)
			}else{
				resolve(content)
			}
		})
	})
}

//用来解决数组的嵌套问题
function formatMessage(result){
	let message={}
	//判断类型是否为object
	if(typeof result==='object'){
		//得到result中所有可被枚举的属性，也就是键值对中的键key，将所有的键key放在数组keys中
		let keys=Object.keys(result)
		// console.log(keys)

		for(let i=0;i<keys.length;i++){
			let item=result[keys[i]]
			let key=keys[i]
			//判断是否是Array的实例
			if(!(item instanceof Array)||item.length===0){
				continue
			}

			if(item.length===1){
				let val=item[0]
				if(typeof val==='object'){
					message[key]=formatMessage(val)
				}else{
					message[key]=(val||'').trim()
				}
			}else{
				message[key]=[]
				for(let j=0,k=item.length;j<k;j++){
					message[key].push(formatMessage(item[j]))
				}
			}
		}
	}
	// console.log('util.js:message:'+JSON.stringify(message))
	return message
}

exports.formatMessage=formatMessage

exports.tpl=function(content,message){
	// console.log('\r\n')
	// console.log('message:'+JSON.stringify(message))
	// console.log('\r\n')
	let info={}
	let type='text'
	const fromUserName=message.FromUserName
	const toUserName=message.ToUserName

	if(Array.isArray(content)){
		//说明是图文消息
		type='news'
	}
	if(typeof(content)!=='undefined'){
		if(content.type){
			type=content.type
		}
	}
	// type=?type:content.type
	// type=content.type || type
	// console.log('>>--'+typeof(content)==='undefined'?type:content.type+'--<<')
	if(type==='image'){
		info.mediaId=message.MsgId
	}
	info.content=content
	info.createTime=new Date().getTime()
	info.msgType=type
	info.toUserName=fromUserName
	info.fromUserName=toUserName

	return tpl.compiled(info)
}