var mx = require('../../')
var pull = require('pull-stream')
var assert = require('assert')
var interleave = require('interleavings')
var util = require('util')

interleave.test(function(async) {
  var echo = function(name) {
    return function(stream, id) {
      pull(stream.source, async.through(name), stream.sink)
    }
  }

  var A = mx(echo('echoA'), 'A')
  var B = mx(echo('echoB'), 'B')

  var n = 2
  var done=function() {
    if (--n) return
    isEmpty(A, 'A')
    isEmpty(B, 'B')
    async.done()
  }

  pull(A, async.through('A->B'), B, async.through('A<-B'), A)

  pull(
    pull.values([ 1, 2, 3 ]),
    async.through('valuesA'),
    A.createStream(),
    async.through('collectA'),
    pull.collect(function(err, res) {
      if (err) throw err
      assert.deepEqual(res, [ 1, 2, 3 ])
      done()
    })
  )

  pull(
    pull.values([ -1, -2, -3 ]),
    async.through('valuesB'),
    B.createStream(),
    async.through('collectB'),
    pull.collect(function(err, res) {
      if (err) throw err
      assert.deepEqual(res, [ -1, -2, -3 ])
      done()
    })
  )

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
