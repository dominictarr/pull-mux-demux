
var mux = require('../')
var pull = require('pull-stream')
var assert = require('assert')
var interleave = require('interleavings')

function log (name) {
  return function (read) {
    console.log(name, 'piped')
    return function (abort, cb) {
      console.log(name, abort ? 'ABORT' : 'read')

      read(abort, function (end, data) {
        console.log(name, end ? 'end' : 'cb', end ? end : data)
        cb(end, data)
      })
    }
  }
}

interleave.test(function (async) {
  var received = false
  var mx = mux(function (stream) {
    received = true
    console.log('RECEIVED')
    console.log('=====================================')
    pull(
      stream.source,
      log('echo'),
      async.through('echo'),
      pull.map(function (e) { return e*10 }),
      stream.sink
    )
  })

  pull(
    pull.values([1]),
    async.through('values'),
    mx.createStream(),
    async.through('collect'),
    log('collect'),
    pull.collect(function (err, one) {

      console.log(err, one)
      assert.ok(received)
      async.done()
    })
  )
  console.log('pull(', mx.source, mx.sink)
  pull(mx.source, async.through('loop'), log('loop'), mx.sink)


})
