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

  config.host     = config.host     || 'localhost';
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

  this._key = config._key || '_id';

  this.cache = new resourceful.Cache();

  this.config = config;

 };


PostgreSQL.prototype.protocol = 'pg';


PostgreSQL.prototype.load = function (data) {
  throw new(Error)("Load not valid for PostgreSQL engine.");
};


PostgreSQL.prototype.get = function(id, cb) {
  this._query(
    "SELECT " + this.table + ".* " 
    + " FROM " + this.table 
    + " WHERE " + this._key + " = " + id 
    + " LIMIT 1"
    , cb);
};


PostgreSQL.prototype.save = function(obj, cb) {
  if( obj[this._key] ) {
    this.update(obj[this._key], obj, cb);
  } else {
    this.create(obj, cb);
  }
  return;
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
  delete conditions.resource;
  var sql = "SELECT " + this.table + ".* FROM " + this.table;
  if(JSON.stringify(conditions) != '{}'){
    sql += queryString.stringify(conditions, '\', ', ' = \'') + '\''
  }
  this._query(sql, cb);
};


// PostgreSQL.prototype.filter = function(filter, cb) {
//   //To-Do
// };


PostgreSQL.prototype.sync = function(factory, callback) {
  process.nextTick(function () { callback(); });
};


PostgreSQL.prototype._getFields = function(obj){
  delete obj[this._key];
  delete obj.resource;
  var fields = [];
  for(key in obj){
    fields.push(key);
  }
  return fields.join(", ");
};


PostgreSQL.prototype._getValues = function(obj){
  delete obj[this._key];
  delete obj.resource;
  var fields = [];
  for(key in obj){
    value = (typeof obj[key] === 'number') ? obj[key] : "'" + obj[key] + "'";
    fields.push(value);
  }
  return fields.join(", ");
};


PostgreSQL.prototype._query = function(sql, cb){
  var self = this;
  this.client.query(sql, function(err, res){
    result = null;
    if(err) return cb(err);
    if(res.rowCount === 1) {
      self.cache.update(res.rows[0][self._key], res.rows[0]);
      result = res.rows[0];
    }else{
      if(res.rowCount){
        self.cache.update(sql, res.rows);
        result = res.rows;
      }else{
        err = {};
        err.status = 404;
        err.notFound = true;
      }
    }
    cb(err, result);
  });
};