var mx = require('../../')
var pull = require('pull-stream')
var assert = require('assert')
var interleave = require('interleavings')
var util = require('util')

interleave.test(function(async) {
  var A = mx()
  var B = mx(function(stream) {
    pull(
      stream.source,
      async.through('collect'),
      pull.collect(function(err,res) {
        if (err) throw err
        assert.deepEqual(res, [ 1, 2, 3 ])
        isEmpty(A, 'A')
        isEmpty(B, 'B')
        async.done()
      })
    )
  })

  pull(A, async.through('A->B'), B)

  pull(pull.values([ 1, 2, 3 ]), async.through(), A.createStream())
})

function isEmpty(mx, name) {
  assert(
    Object.keys(mx.streams).length === 0,
    name + '.streams is not empty\n'+
    util.inspect(mx.streams)
  )

  assert(
    Object.keys(mx._streams).length === 0,
    name + '._streams is not empty\n' +
    util.inspect(mx._streams)
  )
}
