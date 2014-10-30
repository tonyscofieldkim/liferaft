'use strict';

var setImmediate = require('immediate')
  , Node = require('./');

module.exports = Log;

/**
 * The representation of the log of a single node
 *
 * @constructor
 * @param {Node} instance of a node
 * @api public
 */
function Log(node, engine) {
  if (!(this instanceof Log)) return new Log(options);

  // Might be necessary
  this.node = node;
  this.engine = engine || 'memory';
  //
  // Remark: So we want to use something like leveldb here with a particular engine but
  // for now lets just use a silly little array
  // The following would all be stored in a leveldb database. Entries would be
  // its own namespaced key set for easy stream reading and the other values
  // would be stored at their particular key for proper persistence and
  // fetching. These could be used as a cache like thing as well if we wanted
  // faster lookups by default
  //
  this._entries = [];
  this._commitIndex = 0;
  this._lastApplied = 0;
  this._startIndex = 0;
  this._startTerm = 0;

}

/**
 * Commit a log entry
 *
 * @param {Object} Data we receive from ourselves or from LEADER
 * @param {function} Callback function
 * @api public
 */
Log.prototype.commit = function (data, fn) {
  var entry = this.entry(data);

  if (entry) this.append(entry);
  return setImmediate(fn.bind(null, null, !!entry));
};

Log.prototype.append = function (entry) {
  this._entries.push(entry);
};

/**
 *
 * Return the last entry (this may be async in the future)
 *
 * @api public
 */
Log.prototype.last = function () {
  var last = this._entries[this._entries.length - 1];
  if (last) return last;
  return { term: this._startTerm, index: this._startIndex };
};

/**
 * Create a log entry that we will append with correct form and attrs
 *
 * @param {object} Data to compute to a proper entry
 * @api public
 */
Log.prototype.entry = function (data) {
  //
  // type of entry, (data/command, or something related to raft itself)
  //
  var type = data.type
    , command = data.command
  //
  // Remark: Hmm this may have to be async if we are fetching everything from a db,
  // lets just keep it in memory for now because we may just preload into cache
  // on startup?
  //
    , index = this.last().index + 1;
  //
  // Remark: How do we want to store function executions or particular actions
  // to be replayed in case necessary?
  //
  return {
    type: type,
    term: this.node.term,
    index: index,
    command: command
  }
};

