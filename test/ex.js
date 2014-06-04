
var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

var u = require('../util')

var assert = require('assert')

var source = many()

//need a way for parts of forked streams to be endable.
var sink = fork(function (data) {
  return data.id
}, function (id) {
  return pull(
    u.unwrap(id),
    pull.collect(function (err, ary) {
      console.log('collect', id, ary)
    })
  )
})

console.log(source, sink)
pull(source, sink)

source.add(pull(
  pull.values([1,2,3]),
  u.wrap(1)
))

source.add(pull(
  pull.values([9,8,7,6,5,4,3,2,1]),
  u.wrap(2)
))

//pull steams should be able to read
//while steams may still be added.

//source.cap()

