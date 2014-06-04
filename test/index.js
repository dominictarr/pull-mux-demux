
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
  var B = mx(function (stream) {
    console.log('connection!', stream)
    //fake echo server
    pull(
      stream.source,
      pull.through(function (data) {
        seen.push(data)
      }),
    pullFSM(),
      async.through(),
    pullFSM(),
      stream.sink
    )
  })

  pull(A,     pullFSM(),
async.through(),     
log('>>'), B,     pullFSM(),
log('<<'), async.through(), A)

  pull(
    pull.values([1,2,3]),
    async.through(),
//    function (read) {
//      var reading = false
//      return function (abort, cb) {
//        if(reading) throw new Error('already reading')
//        reading = true
//        read(abort, function (end, data) {
//          reading = false
//          console.log('READ', data, end)
//          cb(end, data)
//        })
//      }
//    },
    pullFSM(),
    A.createStream(),
//    async.through(),
    pullFSM(),
    pull.collect(function (err, ary) {
      console.log(ary, '?')
      assert.deepEqual(ary, seen)
      assert.deepEqual(ary, [1,2,3])
      async.done()
    })
  )

})
