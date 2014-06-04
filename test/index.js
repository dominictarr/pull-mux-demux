
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')


var A = mx()
var B = mx(function (stream) {
  console.log('connection!')
  //fake echo server
  pull(stream.source, pull.through(console.error), stream.sink)
})

pull(A, B, A)

var stream = 

pull(
  pull.values([1,2,3]),
  A.createStream(),
  pull.collect(function (err, ary) {
    console.log(ary)
  })
)
