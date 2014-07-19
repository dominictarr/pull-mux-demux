var fork = require('pull-fork')
var many = require('pull-many')
var pair = require('pull-pair')
var pull = require('pull-stream')

module.exports = function(isMaster,onConnection){
    if(typeof isMaster ==='function'){
      onConnection=isMaster
      isMaster=true
    }

    if(isMaster == null)isMaster=true

    var masterID = 0,
    slaveID = 0,
    streams = {},
    _streams = {},
    sources = many()

    var sinks = fork(function(s){
      return s.id
    },
    function(id){
      if((isMaster===true && id>0)||(isMaster !==true && id < 0)){
        return _streams[id].sink
      }

      var p = pair(),q = pair(),u = pair()

      pull(p.source,unwrap(id),u.sink)

      streams[id]  = {source:u.source,sink:q.sink}
      _streams[id] = {source: q.source, sink: p.sink}

      if(typeof onConnection !=='function'){
        onConnection=function(){
          pull(u.source,pull.drain())
        }
      }

      sources.add(pull(_streams[id].source,wrap(id)))
      onConnection(streams[id])
      return _streams[id].sink
    })

    function wrap(n) {
      return function (read) {
        var ended = null
        return function (abort, cb) {
          if(ended) return cb(true)
          read(abort, function(end, data){
            if(end){
              cb(null, {id: n, end: ended = end, data: null})
            }
            else  cb(null, {id: n, end: null, data: data})
          })
        }
      }
    }

    function unwrap(n) {
      return function(read) {
        return function (abort, cb) {
          read(abort, function (end, data) {
            if(data.end){
              cb(data.end,null)
              process.nextTick(function(){
                delete streams[n]
                delete _streams[n]
              })
            }
            else cb(null,data.data)
          })
        }
      }
    }

    return {
      source:sources,
      sink:sinks,
      createStream:function(){
        var id
        if(isMaster===true)id=++masterID
        else id=--slaveID

        var p = pair(), q = pair()
        _streams[id] = {source: p.source, sink: q.sink}

        sources.add(
        pull(
          _streams[id].source
          ,wrap(id))
        )

        return streams[id] = {source: pull(q.source,unwrap(id)), sink: p.sink}
      }
    }
  }