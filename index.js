
//box the messages in a stream so that you can
//track data/end and the id of that stream.

var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

function wrap(n) {
  return function (read) {
    var ended = null
    return function (abort, cb) {
      if(ended) return cb(true)
      read(abort, function (end, data) {
        if(end) cb(null, {id: n, end: ended = end, data: null})
        else    cb(null, {id: n, end: null       , data: data})
      })
    }
  }
}

module.exports = function (onConnection) {

  var created = 0
  var received = 0

  //streams given to the user
  var streams = {}
  //flip side of those streams
  //fed into the hine.
  var _streams = {}

  //returns a source that reads from many sources
  var sources = many()

  //returns a single sink, splits to many sinks.
  var sinks = fork(function (wrapped) {
    console.log('message?')
    return wrapped.id
  }, function (id) {
    console.log('create sink')
    //if id is < 0 then it was created by the remote.
    if(id > 0) //this stream was ceated locally.
      return _streams[id]
    var p = pair()
    var q = pair()

    streams[id]  = {source: p.source, sink: q.sink}
    _streams[id] = {sounce: q.source, sink: p.sink}
    onConnection(streams[id])
    return _streams[id].sink
  })

  return {
    //outer streams that are routed over network.
    source: sources,
    sink: sinks,

    //create a new dial-out stream.
    createStream: function () {
      var id = ++created
      var p = pair(), q = pair()
      var _stream = _streams[id] = {source: p.source, sink: q.sink}
      var stream  =  streams[id] = {source: q.source, sink: p.sink}

      console.log('createStream', id)
      sources.add(pull(
        _stream.source,
        wrap(++created),
        pull.through(console.error)
      ))
      //forks is attached when it receives a message.
      return streams[id]
    }
  }

}
