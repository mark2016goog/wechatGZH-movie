'use strict'

const sha1=require('sha1')
const getRawBody=require('raw-body')
const Wechat=require('./wechat')
const util=require('./util')



module.exports= function (opts,handler) {
	const wechat=new Wechat(opts)
	//注意*号，指得是生成器函数，ES6的新特性，Generator Function(生成器函数)
	return	function *(next){
				const that=this
				const signature=this.query.signature
				const token=opts.token
				const timestamp=this.query.timestamp
				const nonce=this.query.nonce
				const echostr=this.query.echostr
				//加密
				const str=[token,timestamp,nonce].sort().join('')
				const sha=sha1(str)

				//判断事件类型
				//如果是GET，说明是微信服务器的请求验证，则进行验证
				console.log('g.js:wechat will go!')
				if(this.method==='GET'){
					if(sha===signature){
						console.log('g.js:wechat go!')
						this.body=echostr+''
					}else{
						this.body='wrong'
					}	
				}
				//如果是POST,说明是用户动作,处理用户请求
				else if(this.method==='POST'){
					console.log('----------------------------')
					if(sha!==signature){
						this.body='wrong'
						return false
					}
					//使用raw-body模块，解析XML
					const data=yield getRawBody(this.req,{
						length:this.length,
						limit:'1mb',
						encoding:this.charsets
					})
					//将xml格式转换成json
					const content=yield util.parseXMLAsync(data)
					console.log('content:'+JSON.stringify(content))
					//将json对象转换成数组对象
					/*  message:
						[ ToUserName: 'gh_51ff0cc4e685',
						  FromUserName: 'oCjfRszy7mhhQJzWvFnq8gMxnWeM',
						  CreateTime: '1477394144',
						  MsgType: 'text',
						  Content: 'gji',
						  MsgId: '6345359532192493894'
						]
					 */
					const message=util.formatMessage(content.xml)
					console.log('g.js:message:'+JSON.stringify(message))
					
					this.weixin=message

					
					yield handler.call(this,next)

					wechat.reply.call(this)
			}
}
}

