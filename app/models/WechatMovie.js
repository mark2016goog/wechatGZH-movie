var mongoose = require('mongoose')
var WechatMovieSchema = require('../schemas/WechatMovie')
var WechatMovie = mongoose.model('WechatMovie', WechatMovieSchema)

module.exports = WechatMovie