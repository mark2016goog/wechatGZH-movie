'use strict'

const Promise=require('bluebird')
const _=require('lodash')
const request=Promise.promisify(require('request'))
const fs=require('fs')
const util=require('./util')

const prefix='https://api.weixin.qq.com/cgi-bin/'
const mpPrefix='https://mp.weixin.qq.com/cgi-bin/'
//语义理解
const semanticUrl='https://api.weixin.qq.com/semantic/semproxy/search?'

const api={
	semanticUrl:semanticUrl,
	accessToken:prefix+'token?grant_type=client_credential',
	//临时素材的api
	temporary:{
		//上传临时素材
		upload:prefix+'media/upload?',
		//获取临时素材
		fetch:prefix+'media/get?'
	},
	//永久素材的api
	permanet:{
		//上传永久素材
		//新增其他类型的永久素材
		upload:prefix+'material/add_material?',
		//新增永久图文素材
		uploadNews:prefix+'material/add_news?',
		//永久图文素材中的图片url
		uploadNewsPic:prefix+'media/uploadimg?',

		//获取永久素材
		//获取其他类型的永久素材
		fetch:prefix+'material/get_material?',

		//删除永久素材
		del:prefix+'material/del_material',
		//更新修改永久素材
		update:prefix+'material/update_news',
		//获取各种永久素材的数量(voice video image news)
		count:prefix+'material/get_materialcount?',
		//获取各种永久素材的列表
		batch:prefix+'material/batchget_material?'
	},
	//用户分组
	groups:{
		//创建分组
		create:prefix+'groups/create?',
		//查询所有分组
		fetch:prefix+'groups/get?',
		//查询用户所在分组
		check:prefix+'groups/getid?',
		//修改分组名
		update:prefix+'groups/update?',
		//移动用户分组
		move:prefix+'groups/members/update?',
		//批量移动用户分组
		batchupdate:prefix+'groups/members/batchupdate',
		//删除分组
		del:prefix+'groups/delete?'
	},
	//用户管理
	user:{
		// 设置用户备注名
		remark:prefix+'user/info/updateremark?',
		//获取单个用户基本信息(UnionID机制)
		fetch:prefix+'user/info?',
		//批量获取用户基本信息
		batchFetch:prefix+'user/info/batchget?',
		//获取用户列表
		list:prefix+'user/get?'
	},
	//高级群发接口
	mass:{
		//根据分组进行群发
		group:prefix+'message/mass/sendall?',
		//根据OpenID列表群发【订阅号不可用，服务号认证后可用】
		openId:prefix+'message/mass/send?',
		//删除群发【订阅号与服务号认证后均可用】
		del:prefix+'message/mass/delete?',
		//预览接口【订阅号与服务号认证后均可用】
		preview:prefix+'message/mass/preview?',
		// 查询群发消息发送状态【订阅号与服务号认证后均可用】
		check:prefix+'message/mass/get?'
		
	},
	//自定义菜单按钮
	menu:{
		//菜单按钮创建接口
		create:prefix+'menu/create?',
		//菜单按钮查询接口
		get:prefix+'menu/get?',
		//菜单删除接口
		del:prefix+'menu/delete?',
		//获取自定义菜单配置接口
		current:prefix+'get_current_selfmenu_info?',
	},
	//账号管理
	//生成带参数的二维码
	qrcode:{
		//生成二维码
		create:prefix+'qrcode/create?',
		//通过ticket换取二维码
		show:mpPrefix+'showqrcode?'
	},
	//长链接转短链接接口
	shortUrl:{
		create:prefix+'shorturl?'
	},
	//微信卡券接口中使用的签名凭证api_ticket,用以配置使用JS-SDK所需要的信息
	//开发者在调用微信卡券JS-SDK的过程中需依次完成两次不同的签名，并确保凭证的缓存。
	ticket:{
		get:prefix+'ticket/getticket?'
	}
}

function Wechat(opts) {
	const that=this
	this.appID=opts.appID
	this.appSecret=opts.appSecret
	this.getAccessToken=opts.getAccessToken
	this.saveAccessToken=opts.saveAccessToken
	this.getTicket=opts.getTicket
	this.saveTicket=opts.saveTicket

	this.fetchAccessToken()
	
}

//获取Token
Wechat.prototype.fetchAccessToken=function(){
	const that=this
	// console.log('this:',this)
	//如果全局中存在access_token以及expires_in
	// if(this.access_token && this.expires_in){
		//并且票据是有效的，那么直接返回当前票据
	// 	if(this.isValidAccessToken(this)){
	// 		return Promise.resolve(this)
	// 	}
	// }
	//获取票据
	return this.getAccessToken()
		.then((data)=>{
			try{
				data=JSON.parse(data)
			}catch(e){
				//如果发生错误，重新更新
				return that.updateAccessToken()
			}
			//验证Token是否合法
			if(that.isValidAccessToken(data)){
				return Promise.resolve(data)
			}else{
				return that.updateAccessToken()
			}
		})
		.then((data)=>{
			// that.access_token=data.access_token
			// that.expires_in=data.expires_in
			//将Token保存起来
			that.saveAccessToken(data)

			return Promise.resolve(data)
		})
		.catch((err)=>{
			return Promise.reject(err)
		})
		
}

/* 获取签名凭证api_ticket(调用JS-SDK的配置凭据)
 * access_token：需要使用全局票据access_token来获取api_ticket
 */
Wechat.prototype.fetchTicket=function(access_token){
	const that=this
	// console.log('this:',this)
	//获取api_ticket
	return this.getTicket()
		.then((data)=>{
			try{
				data=JSON.parse(data)
			}catch(e){
				console.log('catch:',e)
				//如果发生错误，重新更新
				return that.updateTicket(access_token)
			}
			//验证Token是否合法
			if(that.isValidTicket(data)){
				return Promise.resolve(data)
			}else{
				return that.updateTicket(access_token)
			}
		})
		.then((data)=>{
			//将Token保存起来
			that.saveTicket(data)

			return Promise.resolve(data)
		})
		.catch((err)=>{
			return Promise.reject(err)
		})
		
}

//验证access_token是否合法（是否存在，以及是否过期）
Wechat.prototype.isValidAccessToken=function(data){
	if(!data || !data.access_token || !data.expires_in){
		return false
	}

	const access_token=data.access_token
	const expires_in=data.expires_in
	//返回一个毫秒数
	const now=(new Date().getTime())

	if(now<expires_in){
		//还没过期
		return true
	}else{
		//已经过期
		return false
	}
}

//验证api_ticket是否合法（是否存在，以及是否过期）
Wechat.prototype.isValidTicket=function(data){
	if(!data || !data.ticket || !data.expires_in){
		return false
	}
	let ticket=data.ticket
	let expires_in=data.expires_in
	//返回一个毫秒数
	let now=(new Date().getTime())

	if(ticket && now<expires_in){
		//还没过期
		return true
	}else{
		//已经过期
		return false
	}
}
//更新access_token ,一般在access_token过期和发生错误的情况下
Wechat.prototype.updateAccessToken=function(){
	console.log('>>>>>>>>>>>>>>>>')
	const appID=this.appID
	const appSecret=this.appSecret
	const url=api.accessToken+'&appid='+appID+'&secret='+appSecret

	return new Promise((resolve,reject)=>{
		request({url:url,json:true}).then((response)=>{
			let data=response.body
			const now=(new Date().getTime())
			const expires_in=now+(data.expires_in-20)*1000

			data.expires_in=expires_in
			resolve(data)
		})
	})	
}

//更新api_ticket,一般在api_ticket过期和发生错误的情况下
Wechat.prototype.updateTicket=function(access_token){
	console.log('<<<<<<<<<<<<<')
	const url=api.ticket.get+'&access_token='+access_token+'&type=jsapi'

	return new Promise((resolve,reject)=>{
		request({url:url,json:true}).then((response)=>{
			let data=response.body
			let now=(new Date().getTime())
			let expires_in=now+(data.expires_in-20)*1000

			data.expires_in=expires_in
			console.log('278:wechat.js:data:',data)
			resolve(data)
		})
	})	
}

/*
 * 上传素材，包括上传临时素材和永久素材
 * type：要上传的素材类型
 * material:要上传的素材数组数据（针对永久素材）或路径信息（针对临时素材）
 * permanet：如果存在这一项，则表明要上传的是永久素材，否则表明要上传的是临时素材
 */
Wechat.prototype.uploadMaterial=function(type,material,permanet){
	console.log('type:',type)
	const that=this
	let form={}
	//默认是临时素材
	let uploadUrl=api.temporary.upload
	//如果permanet存在，则是永久素材
	if(permanet){
		uploadUrl=api.permanet.upload
		//用到lodash,_.extend(object, [sources]),
		//分配sources中的可枚举属性到object上，相当于复制，不过覆盖le相同属性的项，参照Object.assign.
		_.extend(form,permanet)
	}
	//临时素材的type属性有image video  musci
	//除了这三个之外，就是永久素材,pic  news
	if(type==='pic'){
		//表明是所要上传永久图文素材中的图片
		uploadUrl=api.permanet.uploadNewsPic
	}
	if(type==='news'){
		//表明是所要上传永久图文素材
		uploadUrl=api.permanet.uploadNews
		//如果是图文，则material中就是图文数组数据
		form=material
	}else{
		//如果不是图文，则material中就是素材路径信息
		form.media=fs.createReadStream(material)
	}

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=uploadUrl+'&access_token='+data.access_token
				if(!permanet){
					//如果不是上传永久素材，则需要在url中缀追加临时素材路径
					url+='&type='+type
				}else{
					//表明是永久素材
					form.access_token=data.access_token
				}
				let options={
					method:'POST',
					url:url,
					json:true
				}
				if(type==='news'){
					//如果是图文，则body里面就是图文数据
					options.body=form
				}else{
					//如果不是图文，
					options.formData=form
				}
				console.log('url:',url)
				// console.log('form:',form)
				//发起请求
				request(options).then((response)=>{
					let _data=response.body
					console.log('wechat.js:_data:',_data)
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('upload material fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 获取素材，包括获取临时素材和永久素材
 * mediaId:要获取的素材ID
 * type：要获取的素材类型
 * permanet：如果存在这一项，则表明要获取的是永久素材，否则表明要获取的是临时素材
 */
Wechat.prototype.fetchMaterial=function(mediaId,type,permanet){
	const that=this
	//默认是临时素材
	let fetchUrl=api.temporary.fetch
	let form={}
	//如果permanet存在，则是永久素材
	if(permanet){
		fetchUrl=api.permanet.fetch
	}
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=fetchUrl+'&access_token='+data.access_token+'&media_id='+mediaId
				let options={
					method:'POST',
					url:url,
					json:true
				}
				//如果是永久素材
				if(permanet){
					form.media_id=mediaId,
					form.access_token=data.access_token
					options.body=form
				}else{
					if(type==='video'){
						url=url.replace('https://','http://')
					}
					url+='&media_id='+mediaId
				}

				if(type==='news' || type==='video'){
					//发起请求
					request(options).then((response)=>{
						let _data=response.body
						
						if(_data){
							resolve(_data)
						}
						else{
							throw new Error('fetch material fail')
						}
					})
					.catch((err)=>{
						reject(err)
					})
				}else{
					resolve(url)
				}
				

				// if(!permanet && type==='video'){
				// 	//注意http与https协议的转换
				// 	url=url.replace('https://','http://')
				// }
				// resolve(url)
			})
	})
}

/*
 * 删除永久素材
 * mediaId:要删除的素材ID
 */
Wechat.prototype.deleteMaterial=function(mediaId){
	const that=this
	let form={
		media_id:mediaId
	}
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=api.permanet.del+'&access_token='+data.access_token+'&media_id='+mediaId
				//发起请求
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('delete material fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 更新永久素材
 * mediaId:要更新的素材ID
 * news:所需更新图文的原始数据
 */
Wechat.prototype.updateMaterial=function(mediaId,news){
	const that=this
	let form={
		media_id:mediaId
	}
	//将所需更新图文的原始数据，更换成新的数据
	_.extend(form,news)
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=api.permanet.update+'&access_token='+data.access_token+'&media_id='+mediaId
				//发起请求
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('update material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 获取各种永久素材的数量列表
 */
Wechat.prototype.countMaterial=function(){
	const that=this
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=api.permanet.count+'&access_token='+data.access_token
				//发起请求
				request({method:'GET',url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('count material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 获取各种永久素材的列表
 * options:想要获取的素材对象，
 * 包括素材的类型type、从什么位置开始获取offset、获取的数量count
 */
Wechat.prototype.batchMaterial=function(options){
	const that=this

	options.type=options.type || 'image'
	options.offset=options.type || 0
	options.count=options.count || 5

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				//拿到票据
				let url=api.permanet.batch+'&access_token='+data.access_token
				//发起请求
				request({method:'POST',url:url,body:options,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('count material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 创建用户分组
 * name:分组名称
 */
Wechat.prototype.createGroup=function(name){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.groups.create+'access_token='+data.access_token
				let form={
					group:{
						name:name
					}
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('createGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 查询所有分组
 */
Wechat.prototype.fetchGroups=function(){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.groups.fetch+'access_token='+data.access_token
				request({method:'GET',url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('fetchGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 查询用户所在分组
 * openId:用户的 openId
 */
Wechat.prototype.checkGroup=function(openId){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.groups.check+'access_token='+data.access_token
				let form={
					openid:openId
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('checkGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 修改分组名
 * id：分组的id
 * name：新的分组名
 */
Wechat.prototype.updateGroup=function(id,name){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.groups.update+'access_token='+data.access_token
				let form={
					group:{
						id:id,
						name:name
					}
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('updateGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 移动用户分组,以及 批量移动用户分组
 * openIds：用户的openId，如果是数组，表明是批量移动，否则为单个移动
 * to:将用户移动到的新的分组Id
 */
Wechat.prototype.moveGroup=function(openIds,to){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url
				let form={
					to_groupid:to
				}
				//判断是移动单个用户，还是批量移动
				if(_.isArray(openIds)){
					url=api.groups.batchupdate+'access_token='+data.access_token
					form.openid_list=openIds
				}else{
					url=api.groups.move+'access_token='+data.access_token
					form.openid=openIds
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('moveGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*
 * 删除分组
 * openIds：分组
 * to:分组的id
 */
Wechat.prototype.deleteGroup=function(id){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.groups.del+'access_token='+data.access_token
				let form={
					group:{
						id:id
					}
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('deleteGroup material_news fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/*设置备注名(该接口暂时开放给微信认证的服务号)
 * openId:普通用户的标识，对当前公众号唯一
 * remark:新的备注名，长度必须小于30字符
 */
Wechat.prototype.remarkUser=function(openId,remark){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.user.remark+'access_token='+data.access_token
				let form={
					openid:openId,
					remark:remark
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('remarkUser fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 获取用户基本信息,包括单个获取，以及批量获取
 * openId:普通用户的标识，对当前公众号唯一
 * lang:返回国家地区语言版本，zh_CN 简体，zh_TW 繁体，en 英语
 */
Wechat.prototype.fetchUsers=function(openIds,lang='zh_CN'){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let options={
					json:true
				}
				//如果是数组，则是批量获取，否则是单个获取
				if(_.isArray(openIds)){
					options.url=api.user.batchFetch+'access_token='+data.access_token
					options.method='POST'
					/*
						"user_list": [{
				            "openid": "otvxTs4dckWG7imySrJd6jSi0CWE", 
				            "lang": "zh-CN"
				        }]
					 */
					console.log('wechat.js:openIds:',openIds)
					options.body={
						user_list:openIds
					}
				}else{
					options.url=api.user.fetch+'access_token='+data.access_token+'&openid='+openIds+'&lang='+lang
					options.method='GET'
				}


				request(options).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('fetch User fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 获取用户列表
 * openId:第一个拉取的OPENID，不填默认从头开始拉取
 */
Wechat.prototype.listUsers=function(openId){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.user.list+'access_token='+data.access_token
				if(openId){
					url+='&next_openid'+openId
				}
				request({method:'GET',url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						resolve(_data)
					}
					else{
						throw new Error('list User fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

// 高级群发接口
/* 根据分组进行群发
 * type:群发的消息类型
 * message:用于设定即将发送的图文消息
 * groupId:群发到的分组的group_id
 */
Wechat.prototype.sendByGroup=function(type,message,groupId){
	const that=this
	let msg={
		filter:{},
		msgtype:type
	}
	msg[type]=message

	if(!groupId){
		//如果没有指定groupId，则默认向所有人发送
		msg.filter.is_to_all=true
	}else{
		//如果指定了groupId，说明是发送给特定de群组
		msg.filter.is_to_all=false
		msg.filter={
			is_to_all:false,
			group_id:groupId
		}
	}
	console.log('msg:',msg)
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.mass.group+'access_token='+data.access_token
				request({method:'POST',url:url,body:msg,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('sendByGroup User fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 根据OpenID列表群发【订阅号不可用，服务号认证后可用】
 * type:群发的消息类型
 * message:用于设定即将发送的图文消息
 * openIds:群发到的用户的openIds
 */
Wechat.prototype.sendByOpenId=function(type,message,openIds){
	const that=this
	let msg={
		msgtype:type,
		touser:openIds
	}
	msg[type]=message

	console.log('msg:',msg)
	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.mass.openId+'access_token='+data.access_token
				request({method:'POST',url:url,body:msg,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('sendBy openIds fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 删除群发【订阅号与服务号认证后均可用】
 * msgId:所需删除的群发消息
 */
Wechat.prototype.deleteMass=function(msgId){
	const that=this
	console.log('msg:',msg)

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.mass.del+'access_token='+data.access_token
				let form={
					msg_id:msgId
				}
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('deleteMass fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 预览接口【订阅号与服务号认证后均可用】
 * msgId:所需删除的群发消息
 */
Wechat.prototype.previewMass=function(type,message,openId){
	const that=this
	let msg={
		msgtype:type,
		touser:openId
	}
	msg[type]=message

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.mass.preview+'access_token='+data.access_token
				let form={
					msg_id:openId
				}
				request({method:'POST',url:url,body:msg,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('previewMass fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 查询群发消息发送状态
 * msgId:所需删除的群发消息
 */
Wechat.prototype.checkMass=function(msgId){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.mass.check+'access_token='+data.access_token
				let msg={
					msg_id:msgId
				}
				request({method:'POST',url:url,body:msg,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('checkwMass fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

// 自定义菜单按钮menu
/* 自定义菜单创建接口
 * menu:所需创建的菜单按钮(数组对象)
 */
Wechat.prototype.createMenu=function(menu){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.menu.create+'access_token='+data.access_token
				request({method:'POST',url:url,body:menu,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('createMenu fail')
					}
				})
				.catch((err)=>{
					console.log('++++++++++++++++++')
					reject(err)
				})
			})
	})
}

/* 
 * 自定义菜单查询接口
 */
Wechat.prototype.getMenu=function(){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.menu.get+'access_token='+data.access_token
				request({url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('getMenu fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 
 * 自定义菜单删除接口
 */
Wechat.prototype.deleteMenu=function(){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.menu.del+'access_token='+data.access_token
				request({url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('deleteMenu fail')
					}
				})
				.catch((err)=>{
					console.log('catchErr1')
					reject(err)
					console.log('catchErr2')
				})
			})
	})
}

/* 
 * 获取自定义菜单配置接口
 */
Wechat.prototype.getCurrentMenu=function(){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.menu.current+'access_token='+data.access_token
				request({url:url,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('wechat.js:_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('getCurrentMenu fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 
 * 生成带参数的二维码
 * qr:封装好的二维码数据
 */
Wechat.prototype.createQrcode=function(qr){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.qrcode.create+'access_token='+data.access_token
				request({method:'POST',url:url,body:qr,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('wechat.js:_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('createQrcode fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 通过ticket换取二维码
 * ticket:用来换取二维码图片的ticket
 */
Wechat.prototype.showQrcode=function(ticket){
	return qpi.qrcode.show+'ticket='+encodeURI(ticket)
}

/* 
 * 长链接转短链接接口
 * urltype:此处填long2short，代表长链接转短链接
 * url:需要转换的长链接
 */
Wechat.prototype.createShorturl=function(action,longUrl){
	action=action || 'long2short'
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.shortUrl.create+'access_token='+data.access_token
				let form={
					action:action,
					long_url:longUrl
				}
				console.log('wechat.js1170form:',form)
				request({method:'POST',url:url,body:form,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('wechat.js:_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('createQrcode fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}

/* 
 * 语义理解
 * data:需要语义理解的数据
 */
Wechat.prototype.semantic=function(semanticData){
	const that=this

	return new Promise((resolve,reject)=>{
		that
			.fetchAccessToken()
			.then((data)=>{
				let url=api.semanticUrl+'access_token='+data.access_token
				semanticData.appid=data.appID
				console.log('semanticData:>',semanticData)
				request({method:'POST',url:url,body:semanticData,json:true}).then((response)=>{
					let _data=response.body
					
					if(_data){
						console.log('wechat.js:_data:',_data)
						resolve(_data)
					}
					else{
						throw new Error('semantic fail')
					}
				})
				.catch((err)=>{
					reject(err)
				})
			})
	})
}
//服务器给用户回复消息
Wechat.prototype.reply=function(){
	//服务器发送给用户的消息
	const content=this.body
	console.log('wechat.js:content:',content)
	//用户发送给服务器的消息
	const message=this.weixin
	const xml=util.tpl(content,message)
	//将需要发送给用户的消息发送出去
	this.status=200
	this.type='application/xml'
	this.body=xml
	console.log('\r\n')
	// console.log('wechat.js:xml:',xml)
}
module.exports=Wechat