
//box the messages in a stream so that you can
//track data/end and the id of that stream.

var fork = require('pull-switch')
//var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

var u = require('./util')

var pullFSM = require('./fsm')

module.exports = function (onConnection, name) {

  var created = 0
  var received = 0

  //streams given to the user
  var streams = {}
  //flip side of those streams
  //fed into the hine.
  var _streams = {}

  //returns a source that reads from many sources
  var sources = many()

  function createPairs (id) {
    //this needs to be negative on responses
    //so we can handle streams from both sides.

    if(!streams[id]) {
      var p = pair()
      var q = pair()
      streams[id] = {
        source: p.source,
        sink: q.sink
      }
      _streams[id] = {
        //this is the 'incoming' stream
        //it has a negative id. piped into the connection.
        source: pull(q.source, u.wrap(id)),
        //this is the 'outgoing' stream,
        //it has a positive id.
        sink: pull(u.unwrap(id*-1), p.sink)
      }

      sources.add(_streams[id].source)
    }
  }

  //returns a single sink, splits to many sinks.
  var sinks = fork(function (wrapped) {
    return wrapped.id * -1
  }, function (id) {

    var has = !!streams[id]
    //is this a response to my stream, or a new stream they created?
    createPairs(id)

    if(id < 0)
      onConnection(streams[id], id)
    return _streams[id].sink
  }, null, name)

  return {
    //outer streams that are routed over network.
    source: sources,
    sink: sinks,

    //create a new dial-out stream.
    createStream: function () {
      var id = ++created
      createPairs(id)
      sinks.add(id, _streams[id].sink)
      return streams[id]
    }
  }

}
