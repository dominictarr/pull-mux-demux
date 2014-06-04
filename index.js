
//box the messages in a stream so that you can
//track data/end and the id of that stream.

var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

var u = require('./util')

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
    var p = pair()
    var q = pair()
    console.log('createPairs', id)
    if(!streams[id]) {
      streams[id] = {
        source: pull(p.source, pull.through(console.log)),
        sink: pull(pull.through(console.log), q.sink)
      }
      _streams[id] = {
        source: pull(q.source, u.wrap(id)),
        sink: pull(u.unwrap(id), p.sink)
      }
    }
    sources.add(_streams[id].source)
  }

  //returns a single sink, splits to many sinks.
  var sinks = fork(function (wrapped) {
    console.log('message?')
    return wrapped.id
  }, function (id) {
    console.log('create sink')
    //if id is < 0 then it was created by the remote.
    //if(id > 0) //this stream was ceated locally.
    //  return _streams[id]

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
      createPairs(id)
      //forks is attached when it receives a message.
      return streams[id]
    }
  }

}
