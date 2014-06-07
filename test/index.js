
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')
var assert = require('assert')

var pullFSM = require('../fsm')

var interleave = require('interleavings')

function log (m) {
  return pull.through(console.log.bind(null, m || ''))
}

interleave.test(function (async) {

  var seen = []
  var A = mx()
  var B = mx(async(function (stream) {
    //fake echo server
    pull(
      stream.source,
      pull.through(function (data) {
        seen.push(data)
      }),
      async.through('echo'),
      stream.sink
    )
  },'connection'))

  pull(
    A,
    async.through('A->B'),
    B,
    async.through('A<-B'),
    A
  )

  pull(
    pull.values([1,2,3]),
    async.through('source'),
    A.createStream(),
    async.through('sink'),
    pull.collect(function (err, ary) {
      console.log(ary, '?')
      assert.deepEqual(ary, seen)
      assert.deepEqual(ary, [1,2,3])
      async.done()
    })
  )

})
