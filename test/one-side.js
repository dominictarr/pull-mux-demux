
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')


var A = mx()

pull(A, pull.through(console.log), pull.drain())

pull(
  pull.values([1,2,3]),
  A.createStream().sink
)

