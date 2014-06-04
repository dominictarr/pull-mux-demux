var pull = require('pull-stream')

var pullFSM = require('./test/fsm/pull')

function q (s) {
  return JSON.stringify(s)
}

var i = 0
function instance (fsm, type) {
  var state = fsm.START ? 'START' : first(fsm)
  var j = ++i
  return function (event) {
    console.error(event, state, j)
    if(!fsm[state][event])
      throw new Error('event:' + q(event) + ' is forbidden in state:'+ q(state) + ' on type:' + q(type))
    state = fsm[state][event]
  }
}

module.exports = function () {
  var event = instance(pullFSM, 'pull-stream')
  return function fsmed (read) {
    event('piped')
    return function (abort, cb) {
      event(abort ? 'abort' : 'read')
      read(abort, function (end, data) {
        event(end === true ? 'end' : end ? 'error' : 'cb')
        cb(end, data)
      })
    }
  }
}

