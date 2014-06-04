var mx = require('../')
var pull = require('pull-stream')
var assert = require('assert')

var interleave = require('interleavings')


function log () {
  return pull.through(console.log)
}

interleave.test(function (async) {

  var seen = []
  var A = mx()
  var B = mx(function (stream) {
    console.log('connection!', stream)
    //fake echo server
    pull(
      stream.source,
      async.through(),
      pull.collect(function (err, ary) {
        assert.deepEqual(ary, [1,2,3])
        async.done()
      })
    )
  })

  pull(A, log(), B, async.through(), A)

  pull(
    pull.values([1,2,3]),
    async.through(),
    A.createStream().sink
  )

})
