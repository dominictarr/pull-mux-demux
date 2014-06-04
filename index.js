
//box the messages in a stream so that you can
//track data/end and the id of that stream.

var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

var u = require('./util')

var pullFSM = require('./fsm')

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

  function createPairs (id) {
    console.log('createPairs', id)
    //this needs to be negative on responses
    //so we can handle streams from both sides.
    if(!streams[id]) {
      var p = pair()
      var q = pair()
      streams[id] = {
        source: pull(p.source, pull.through(console.log)),
        sink: pull(pull.through(console.log), q.sink)
      }
      _streams[id] = {
        //this is the 'incoming' stream
        //it has a negative id. piped into the connection.
        source: pull(q.source, pullFSM(), u.wrap(id)),
        //this is the 'outgoing' stream,
        //it has a positive id.
        sink:
          pull(
            u.unwrap(id*-1),
            pull.through(console.log.bind(null, '?>')),
            p.sink
          )
      }
    sources.add(_streams[id].source)
    }
  }

  //returns a single sink, splits to many sinks.
  var sinks = fork(function (wrapped) {
    return wrapped.id * -1
  }, function (id) {

    var has = !!streams[id]

    createPairs(id)

    if(!has) onConnection(streams[id])
    return _streams[id].sink
  })

  return {
    //outer streams that are routed over network.
    source: sources,
    sink: sinks,

    //create a new dial-out stream.
    createStream: function () {
      var id = ++created
      console.log('createStream', id)
      createPairs(id)
      //forks is attached when it receives a message.
      return streams[id]
    }
  }

}
