
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')
var assert = require('assert')

var interleave = require('interleavings')


interleave.test(function (async) {

  function echo (seen) {
    return function (stream) {
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
    }
  }

  var n = 2
  var seenB = []
  var seenA = []
  var A = mx(echo(seenA))
  var B = mx(echo(seenB))

  pull(A, async.through(),
    pull.through(console.log.bind(null, '>>')),
    B,
    pull.through(console.log.bind(null, '<<')),
    async.through(), A)

  pull(
    pull.values([1,2,3]),
    async.through(),
    A.createStream(),
    async.through(),
    pull.collect(function (err, ary) {
      console.log(ary, '?', seenB)
      assert.deepEqual(ary, seenB)
      assert.deepEqual(ary, [1,2,3])
      done()
    })
  )

  pull(
    pull.values([4,5,6]),
    async.through(),
    B.createStream(),
    async.through(),
    pull.collect(function (err, ary) {
      console.log(ary, '?', seenA)
      assert.deepEqual(ary, seenA)
      assert.deepEqual(ary, [4,5,6])
      done()
    })
  )

  function done () {
    if(--n) return
    async.done()
  }

})
