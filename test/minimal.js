


var pull = require('pull-stream')
var many = require('pull-many')
var fork = require('pull-fork')
var pair = require('pull-pair')

var p = pair()
var f = fork(function (data) {
    return data%2
  })

f.add(0, p.sink)
f.add(1, pull.drain(console.log, function (err, ary) {
  console.log('done*************************!')
}))

var loopback = pull(
  p.source,
  pull.take(function (e) {
    console.log('TAKE', e)
    return e <= 3
  })
)

pull(
  many([loopback, pull.values([1,2,3,5,7,9])]),
  f
)

