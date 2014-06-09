'use strict';
//var tape = require('tape')
var mx = require('../')
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

  function echo (seen, name) {
    return function (stream, id) {
      //fake echo server
      pull(
        stream.source,
        pull.map(function (d) {
          console.log(name, d); seen.push(d*10);
          return d*10
        }),
        async.through(name),
        stream.sink
      )
    }//, 'connect:'+name)
  }

  var n = 2
  var seenB = []
  var seenA = []
  var A = mx(echo(seenA, 'echoA'), 'A')
  var B = mx(echo(seenB, 'echoB'), 'B')

  pull(
    A,
    async.through('[A->B]'),
    B,
    async.through('[A<-B]'),
    A
  )

  pull(
    pull.values([1, 2, 3]),
    async.through('oddA'),
    A.createStream(),
    async.through('collectA'),
    pull.collect(function (err, ary) {
      console.log(ary, '?', seenB)
      assert.deepEqual(ary, seenB)
      assert.deepEqual(ary, [10, 20, 30])
      done()
    })
  )

  pull(
    pull.values([4, 5, 6]),
    async.through('evenB'),
    B.createStream(),
    async.through('collectB'),
    pull.collect(function (err, ary) {
      if(err) throw err
      assert.deepEqual(ary, seenA)
      assert.deepEqual(ary, [40, 50, 60])
      done()
    })
  )

  function done () {
    if(--n) return
    async.done()
  }

})
