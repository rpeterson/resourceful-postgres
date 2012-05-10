var url = require('url'),
    pg = require('pg'),
    resourceful = require('resourceful'),
    async = require('async');

 var PostgreSQL = exports.PostgreSQL = function PostgreSQL(config) {
 	//To-Do: Setup config and connection string
 });

PostgreSQL.prototype.protocol = 'evented'; //use normal or evented connection


PostgreSQL.prototype.load = function (data) {
  throw new(Error)("Load not valid for PostgreSQL engine.");
};


PostgreSQL.prototype.get = function(key, cb) {
	//To-Do
};


PostgreSQL.prototype.save = function(key, val, cb) {
	//To-Do
};


PostgreSQL.prototype.update = function(key, val, cb) {
	//To-Do
};


PostgreSQL.prototype.destroy = function(key, cb) {
	//To-Do 
};


PostgreSQL.prototype.find = function(conditions, cb) {
	//To-Do 
};


PostgreSQL.prototype.filter = function(filter, cb) {
	//To-Do
};


PostgreSQL.prototype.sync = function(factory, callback) {
  process.nextTick(function () { callback(); });
};

//register engine with resourceful
resourceful.engines.PostgreSQL = PostgreSQL;

//export resourceful
module.exports = resourceful;