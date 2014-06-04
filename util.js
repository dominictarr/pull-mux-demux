var assert = require('assert')

exports.wrap = function (n) {
  return function (read) {
    var ended = null
    return function (abort, cb) {
      if(ended) return cb(true)
      read(abort, function (end, data) {
        if(end) cb(null, {id: n, end: ended = end, data: null})
        else    cb(null, {id: n, end: null       , data: data})
      })
    }
  }
}

exports.unwrap = function (n) {
  return function (read) {
    return function (abort, cb) {
      read(abort, function (end, data) {
        if(end) return cb(end)
        assert.equal(n, data.id)
        //about the stream when you see end message.
        //I'm not sure if this is the right way to do this.
        if(data.end) read(data.end, cb)
        else         cb(null, data.data)
      })
    }
  }
}


