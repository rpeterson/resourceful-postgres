var url = require('url'),
    queryString = require('querystring'),
    pg = require('pg'),
    resourceful = require('resourceful'),
    async = require('async');


 var PostgreSQL = resourceful.engines.Pg = function Pg(config) {

 	if(config && config.table) {
		this.table = config.table;
	} else {
		throw new Error('table must be set in the config for each model.')
	}

	if (config.uri) {
		var uri = url.parse('tcp://' + config.uri, true);
		config.host = uri.hostname;
		config.port = uri.port;

		if (uri.pathname) {
		  config.database = uri.pathname.replace(/^\/|\/$/g, '');
		}

		if (uri.query) {
		  resourceful.mixin(config, uri.query);
		}
	}

	config.host     = config.host     || '127.0.0.1';
	config.auth     = config.auth     || 'postgres';
	config.port     = config.port     || 5432;
	config.database = config.database || resourceful.env || 'postgres';
	
	config.uri = url.format({
		protocol: 'tcp',
		auth: config.auth,
		hostname: config.host,
		port: config.port,
		pathname: '/' + config.database
	});

	config.port = parseInt(config.port, 10);

	this.client = config.client || new pg.Client(config.uri);

  this.client.connect();

  this._key = config._key || 'id';

  this.config = config;

	this.cache = new resourceful.Cache();

 };


PostgreSQL.prototype.protocol = 'pg';


PostgreSQL.prototype.load = function (data) {
	throw new(Error)("Load not valid for PostgreSQL engine.");
};


PostgreSQL.prototype.get = function(id, cb) {
	this._query(
		"SELECT * " 
		+ " FROM " + this.table 
		+ " WHERE " + this._key + " = " + id 
		+ " LIMIT 1"
    , cb);
};


PostgreSQL.prototype.save = function(obj, cb) {
	if( obj.id ) {
    this.update(obj.id, obj, cb);
	} else {
		this.create(obj, cb);
	}
};


PostgreSQL.prototype.create = function(obj, cb) {
	this._query(
      "INSERT INTO " + this.table 
      + " (" + this._getFields(obj) + ")" 
      + " VALUES (" + this._getValues(obj) + ") RETURNING *;"
  , cb);
};


PostgreSQL.prototype.update = function(id, obj, cb) {
	this._query(
		"UPDATE " + this.table 
		+ " SET " + queryString.stringify(obj, '\', ', ' = \'') + '\''
		+ " WHERE " + this._key + " = " + id + " RETURNING *;"
	, cb);
};


PostgreSQL.prototype.destroy = function(id, cb) {
	this._query("DELETE FROM " + this.table 
		+ " WHERE " + this._key + " = " + id 
	, cb);
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


PostgreSQL.prototype._getFields = function(obj){
  delete obj.id;
  delete obj.resource;
  var fields = [];
  for(key in obj){
    fields.push(key);
  }
  return fields.join(", ");
};


PostgreSQL.prototype._getValues = function(obj){
  delete obj.id;
  delete obj.resource;
  var fields = [];
  for(key in obj){
    value = (typeof obj[key] === 'number') ? obj[key] : "'" + obj[key] + "'";
    fields.push(value);
  }
  return fields.join(", ");
};


PostgreSQL.prototype._query = function(sql, cb){
  this.client.query(sql, function(err, res){
      if(err) console.log(err);
      result = null;
      if(res) result = (res.rowCount === 1) ? res.rows[0] : res.rows;
      cb(err, result);
  });
};