
//var tape = require('tape')
var mx = require('../')
var pull = require('pull-stream')
var assert = require('assert')

var interleave = require('interleavings')


interleave.test(function (async) {

  function echo (seen) {
    return function (stream) {
      //fake echo server
      pull(
        stream.source,
        pull.through(function (data) {
          seen.push(data)
        }),
        stream.sink
      )
    }
  }

  var n = 2
  var seenB = []
  var seenA = []
  var A = mx(function (stream) {
    pull(
      stream.source,
      async.through('echo'),
      pull.through(function (d) { seenA.push(d) }),
      stream.sink
    )
  })

  var B = mx(function (stream) {
    pull(
      stream.source,
      pull.map(function (d) {
        return d*10
      }),
      pull.collect(function (err, ary) {
        pull(pull.values(ary), stream.sink)
      })
    )

  })

  pull(A,
    async.through('[A->B]'),
    pull.through(console.log.bind(null, '>>')),
    B,
    pull.through(console.log.bind(null, '<<')),
    async.through('[A<-B]'),
    A)

  pull(
    pull.values([1,2,3]),
    A.createStream(),
    pull.collect(function (err, ary) {
      assert.deepEqual(ary, [10,20,30])
      done()
    })
  )

  pull(
    pull.values([4,5,6]),
    async.through('even'),
    B.createStream(),
    async.through('collect'),
    pull.collect(function (err, ary) {
      if(err) throw err
      assert.deepEqual(ary, seenA)
      assert.deepEqual(ary, [4,5,6])
      done()
    })
  )

  function done () {
    if(--n) return
    console.log(seenA)
    async.done()
  }

})
