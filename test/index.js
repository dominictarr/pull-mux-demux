//var tape = require('tape')
var md = require('../')
var pull = require('pull-stream')
var msgpack = require('pull-msgpack')
var net = require('net')
var toPull = require('stream-to-pull-stream')
var test = require('tape')
var master
var port =9726

test('start tcp master', function(t) {
  master = net.createServer()
  master.listen(port, function() {
    t.end()
  })
})

function netToPull(connection) {
  return { 
    source : toPull.read2(connection),
    sink : toPull.sink(connection)
  }
}

var mdPull = function(connection, muxDemux) {
  pull(connection.source, msgpack.unpack(), muxDemux.sink)
  pull(muxDemux.source, msgpack.pack(), connection.sink)
}

function waitForConnection(onConnection, n) {
  master.once('connection', function(con) {
    var connection = netToPull(con)
    var muxDemux = md(true)
    onConnection(muxDemux, con)
    mdPull(connection, muxDemux)
  })
}

function waitForStream(onConnection, n) {
  master.once('connection', function(con) {
    var connection = netToPull(con)
    var muxDemux = md(true, function(c) {
      return onConnection(c, con, muxDemux)
    })
    mdPull(connection, muxDemux)
  })
}

function connectToMaster(onConnection) {
  var c = net.connect({ port : port})
  var connection = netToPull(c)
  var muxDemux = md(false, onConnection)
  mdPull(connection, muxDemux)
  return muxDemux
}

test('stream to master and wait for response', function(t) {
  waitForStream(function(connection, socket) {
    pull(connection.source, pull.collect(function(err, data) {
      t.equal(err, null)
      t.deepEqual(data, [ 'a1', 'a2', 'a3' ])
      t.end()
    }))
  })
  pull(pull.values([ 'a1', 'a2', 'a3' ]), connectToMaster().createStream())
})

test('stream to slave and wait for response ', function(t) {
  waitForConnection(function(muxDemux) {
    pull(pull.values([ 'b1', 'b2', 'b3' ]), muxDemux.createStream())
  })

  connectToMaster(function(connection) {
    pull(connection.source, pull.collect(function(err, data) {
      t.equal(err, null)
      t.deepEqual(data, [ 'b1', 'b2', 'b3' ])
      t.end()
    }))
  })
})

test('send ping on master and wait for pong', function(t) {
  waitForStream(function(connection) {
    pull(connection.source, pull.map(function(m) {
      t.equal(m, 'ping')
      return m = 'pong'
    }), connection.sink)
  })

  var mx = connectToMaster()
  var stream = mx.createStream()

  pull(pull.values([ 'ping' ]), stream, pull.collect(function(err, data) {
    t.equal(err, null)
    t.equal(data[0], 'pong')
    t.end()
  }))

})

test('send ping on slave and wait for pong', function(t) {
  waitForConnection(function(mx) {
    var stream = mx.createStream()
    pull(pull.values([ 'ping' ]), stream, pull.collect(function(err, data) {
      t.equal(err, null)
      t.equal(data[0], 'pong')
      t.end()
    }))
  })

  connectToMaster(function(connection) {
    pull(connection.source, pull.map(function(m) {
      t.equal(m, 'ping')
      return m = 'pong'
    }),connection.sink)
  })
})

test('end', function(t) {
  console.log('master stopped')
  t.end()
  process.exit()
})