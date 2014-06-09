
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
//        async.through(),
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
//      eagre(),
//      pull.highWaterMark(2),
      pull.map(function (d) {
        return d*10
      }),
      pull.collect(function (err, ary) {
        pull(pull.values(ary), stream.sink)
      })
//      stream.sink
    )

//    pull(
//      stream.source,
//      pull.map(function (data) {
//        return data*10
//      }),
//      stream.sink
//    )
//    pull(stream.source, pull.collect(function (err, ary) {
//      assert.deepEqual(ary, [1,2,3])
//      done()
//    }))
//    pull(pull.values([10,20,30]), stream.sink)
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
//    async.through(),
    A.createStream(),
    //.sink
    pull.collect(function (err, ary) {
      assert.deepEqual(ary, [10,20,30])
      done()
    })
//    ,
//    async.through(),
//    pull.collect(function (err, ary) {
//      console.log(ary, '?', seenB)
//      assert.deepEqual(ary, seenB)
//      assert.deepEqual(ary, [1])
//      done()
//    })
  )

  pull(
    pull.values([4,5,6]),
    async.through('even'),
    B.createStream(),
    async.through('collect'),
    pull.through(console.log.bind(null, '>>>>>>>>>>')),
    pull.collect(function (err, ary) {
      console.log(ary, '?', seenA)
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
