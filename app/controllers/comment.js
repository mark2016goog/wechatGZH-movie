'use strict'

var mongoose = require('mongoose')
var Comment = mongoose.model('Comment')
// var Comment = require('../models/comment')

// comment
exports.save = function* (next) {
  var _comment = req.body.comment
  var movieId = _comment.movie

  if (_comment.cid) {
    let comment =yield Comment.findOne({_id:_comment.cid}).exec()
      var reply = {
        from: _comment.from,
        to: _comment.tid,
        content: _comment.content
      }

      comment.reply.push(reply)
      try{
        yield comment.save()
      }
      catch(e){
        console.log(e)
      }
      this.body={success:1}
  }
  else {
    var comment = new Comment({
      movie:_comment.movie,
      from:_comment.from,
      content:_comment.content,
    })
    try{
      yield comment.save()
    }
    catch(e){
      console.log(e)
    }
    this.body={success:1}
  }
}