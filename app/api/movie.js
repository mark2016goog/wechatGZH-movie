/*
  微信端
 */

var mongoose = require('mongoose')
var Movie=require('../models/movie')
var WechatMovie = require('../models/WechatMovie')
var Promise=require('bluebird')
// var Movie = mongoose.model('Movie')
var koa_request=require('koa-request')
var request=Promise.promisify(require('request'))
var Category=require('../models/category')
// var Category = mongoose.model('Category')
var _=require('lodash')
var co=require('co')

// index page
exports.findAll = function *() {
  const categories=
  	yield Category
		    .find({})
		    .populate({
		      path: 'movies',
		      select: 'title poster',
		      options: { limit: 6 }
		    })
		    .exec()
      return categories
}

// search page
exports.searchByCategory = function *(catId) {
	const categories=
  	yield Category
		    .find({_id:catId})
		    .populate({
		      path: 'movies',
		      select: 'title poster',
		      options: { limit: 6 }
		    })
		    .exec()

	return categories
}
// search page
exports.searchByName = function *(q) {
	const movies=
  	yield Movie
      .find({title: new RegExp(q + '.*', 'i')})
      .exec()
		    
	return movies
}
// wechat 最热门(1)、最冷门(-1)查询
// 通过pv的高低查询
exports.findHotMovies = function *(hot,count) {
	let movies=
	  	yield Movie
	      .find({})
	      .sort({'pv':hot})
	      .limit(count)
	      .exec()
		    
	return movies
}
//wechat 通过类型查询(犯罪、动画)
exports.findMoviesByCate = function *(cat) {
	let category=
	  	yield Category
	      .findOne({name:cat})
	      .populate({
	      	path:'movies',
	      	select:'title poster _id'
	      })
	      .exec()
		    
	return category
}

exports.searchById = function *(id) {
	console.log('movie.js:54:id:',id)
	const movies=
	  	yield Movie
	      .find({_id:id})
	      .exec()
		    
	console.log('movies.js:61:movies:',movies)
	return movies
}
//从豆瓣查询某一个电影的详情信息
function updateMovies(movie){
	var options={
		url:'https://api.douban.com/v2/movie/subject/'+movie.doubanId,
		json:true
	}

	request(options).then(function(response){
		var data=response.body
		// console.log('\r\n')
		// console.log('movie.js:84:data:',data)
		// console.log('\r\n')

		_.extend(movie,{
			country:data.countries?data.countries[0]:[],
			language:data.language?data.language:'',
			summary:data.summary?data.summary:''
		})
		//电影的种类
		var genres=movie.genres
		//从数据库查询，对应de电影种类是否已经存在
		if(genres && genres.length>0){
			var cateArray=[]
			genres.forEach(function(genre){
				cateArray.push(function *(){
					var cat=yield Category.findOne({name:genre}).exec()
					if(cat){
						//如果对应de电影种类已经存在，将所查询到的电影id添加进去
						cat.movies.push(movie._id)
						yield cat.save()
					}else{
						//如果对应de电影种类并不存在，新建分类，并将所查询到的电影id添加进去
						cat=new Category({
							name:genre,
							movies:[movie._id]
						})
						console.log('movie.js:107:movie._id',movie._id)
						cat=yield cat.save()
						movie.category=cat._id
						yield movie.save()
					}
				})
			})
			co(function* (){
				yield cateArray
			})
		}else{
			movie.save()
		}
	})
}

//从豆瓣查询所有与查询字段q有关de电影信息,wechat
exports.searchByDouban=function *(q){
	console.log('\r\n')
	console.log('now search DOUBAN...')
	console.log('\r\n')
	let options={
		url:'https://api.douban.com/v2/movie/search?q='
	}
	options.url+=encodeURIComponent(q)
	let response=yield koa_request(options)
	let data=JSON.parse(response.body)
	let subjects=[]
	let movies=[]

	if(data && data.subjects){
		subjects=data.subjects
	}else{
		console.log('movies.js:dataMessage:140:',data)
	}

	if(subjects.length>0){
		let queryArray=[]
		subjects.forEach(function(item){
			queryArray.push(function *(){
				//查询数据库,电影的详情
				
				let movie=yield Movie.findOne({doubanId:item.id})
				//如果数据库中已经存在
				if(movie){
					movies.push(movie)
				}else{
					let directors=item.directors || []
					let director=directors[0] || {}
					movie=new Movie({
						director: director.name||'',
						title: item.title,
						doubanId:item.id,
						poster: item.images.large,
						year: item.year,
						genres:item.genres || []
					})
					movie=yield movie.save()
					movies.push(movie)
				}
			})
		})

		yield queryArray
		movies.forEach(function(movie){
			updateMovies(movie)
		})

		// console.log('movie.js:151:queryArray:',queryArray.toString())
	}

	return movies
}

