'use strict'

const fs=require('fs')
const Promise=require('bluebird')

exports.readFileAsync=(fpath,encoding='utf8')=>{
	return new Promise((resolve,reject)=>{
		fs.readFile(fpath,encoding,(err,content)=>{
			if(err){
				console.log('utilError:',err)
				reject(err)
			}else{
				resolve(content)
			}
		})
	})
}

exports.writeFileAsync=(fpath,content)=>{
	return new Promise((resolve,reject)=>{
		fs.writeFile(fpath,content,(err)=>{
			if(err){
				reject(err)
			}else{
				resolve()
			}
		})
	})
}

const crypto=require('crypto')

//用以生成签名signature的随机串nonceStr、签名的时间戳timestamp，
//用来配置使用JS-SDK的配置信息
let createNonce=()=>{
	//把随机数字转换成36进制的字符串，并进行截取
	return Math.random().toString(36).substr(2,15)
}
let createTimestamp=()=>{
	return parseInt(new Date().getTime()/1000,10)+''
}

//JS-SDK使用权限的签名算法
let _sign=(noncestr,ticket,timestamp,url)=>{
	let params=[
		'noncestr='+noncestr,
		'jsapi_ticket='+ticket,
		'timestamp='+timestamp,
		'url='+url
	]
	let str=params.sort().join('&')
	//使用crypto库进行加密，以下就是crypto的固定加密逻辑
	let shasum=crypto.createHash('sha1')

	shasum.update(str)
	return shasum.digest('hex')
}

//根据noncestr和timestamp,生成签名signature
exports.sign=function(ticket,url){
	let noncestr=createNonce()
	let timestamp=createTimestamp()
	let signature=_sign(noncestr,ticket,timestamp,url)
	// console.log('ticket:',ticket)
	// console.log('url:',url)
	//返回最终的JS-SDK权限验证的配置信息
	return {
		noncestr:noncestr,
		timestamp:timestamp,
		signature:signature
	}
}