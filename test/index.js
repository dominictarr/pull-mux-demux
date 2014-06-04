
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')
var assert = require('assert')

var interleave = require('interleavings')


interleave.test(function (async) {

  var seen = []
  var A = mx()
  var B = mx(function (stream) {
    console.log('connection!', stream)
    //fake echo server
    pull(
      stream.source,
      pull.through(function (data) {
        seen.push(data)
      }),
      async.through(),
      stream.sink
    )
  })

  pull(A, async.through(), B, async.through(), A)

  pull(
    pull.values([1,2,3]),
    async.through(),
    A.createStream(),
    async.through(),
    pull.collect(function (err, ary) {
      console.log(ary, '?')
      assert.deepEqual(ary, seen)
      async.done()
    })
  )

})
