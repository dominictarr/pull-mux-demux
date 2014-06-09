

var mux = require('../')
var pull = require('pull-stream')
var assert = require('assert')

require('interleavings').test(function (async) {

  var x = mux(function (stream) {
    pull(
      stream.source,
      async.through('echo'),
      stream.sink

    )

//    pull(
//      pull.values([5,6,7]),
//     pull.through(console.log.bind(null, 'echo:')),
//      stream.sink
//    )

  })

  var n = 1, all

  var stream = x.createStream()

  pull(
    stream.source,
    async.through('collect'),
    pull.collect(function (err, ary) {
      all = ary
      console.log('collect', err, ary)
      done()
    })
  )

//  stream.sink(function (abort, cb) {
//    cb(true)
//  })
//
  pull(
    pull.values([
      {id:  1, end: false, data: 1},
      {id: -1, end: false, data: 2},
      {id: -1, end: false, data: 4},
      {id:  1, end: false, data: 3},
      {id: -1, end: false, data: 6},
      {id:  1, end: false, data: 7},
      {id: -1, end: false, data: 8},
      {id: -1, end:  true, data: null},
      {id:  1, end:  true, data: null}
    ]),
  //  async.through('receive'),
    x,
//    async.through('send'),
    pull.through(function (d) {
      console.log('x>', d)
//      done()
    }),
    pull.collect()
//    pull.drain()
  )

  function done () {
    if(--n) return
    assert.deepEqual(all, [2,4,6,8])
    async.done()
  }

})
