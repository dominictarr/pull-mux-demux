
var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

var assert = require('assert')

function wrap(n) {
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

function unwrap(n) {
  return function (read) {
    return function (abort, cb) {
      read(abort, function (end, data) {
        console.log(end, data)
        assert.equal(n, data.id)
        //about the stream when you see end message.
        //I'm not sure if this is the right way to do this.
        console.log(data.end)
        if(data.end) read(data.end, function (end) {
          console.log('ended!')
          cb(end)
        })
        else         cb(null, data.data)
      })
    }
  }
}

var source = many()

//need a way for parts of forked streams to be endable.
var sink = fork(function (data) {
  return data.id
}, function (id) {
  return pull(
    unwrap(id),
    pull.collect(function (err, ary) {
      console.log('collect', id, ary)
    })
  )
})

console.log(source, sink)
pull(source, sink)

source.add(pull(
  pull.values([1,2,3]),
  wrap(1)
))

source.add(pull(
  pull.values([9,8,7,6,5,4,3,2,1]),
  wrap(2)
))

//pull steams should be able to read
//while steams may still be added.

//source.cap()

