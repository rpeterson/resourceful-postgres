var url = require('url'),
    queryString = require('querystring'),
    pg = require('pg'),
    resourceful = require('resourceful'),
    async = require('async');


 var PostgreSQL = resourceful.engines.PostgreSQL = function PostgreSQL(config) {

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

	this.config = config;

	this.client = config.client || require('pg').Client(config.uri);

	this.pkey = config.pkey || 'id';

	this.fields = this.parent().keys.join(", ") || '*';

	this.cache = new resourceful.Cache();

 };


PostgreSQL.prototype.protocol = 'pg';


PostgreSQL.prototype.load = function (data) {
	throw new(Error)("Load not valid for PostgreSQL engine.");
};


PostgreSQL.prototype.get = function(key, cb) {
	this.client.query(
		"SELECT " + this.fields 
		+ " FROM " + this.table 
		+ " WHERE " + this.pkey + " = " + key 
		+ " LIMIT 1"
	, cb);
};


PostgreSQL.prototype.save = function(obj, cb) {
	if( obj[this.pkey] === "undefined" ) {
		this.create(obj, cb);
	} else {
		this.update(obj[this.pkey], obj, cb);
	}
};

PostgreSQL.prototype.create = function(obj, cb) {
	this.client.query(
		"INSERT INTO " + this.table 
		+ " (" + this.fields + ")" 
		+ " VALUES ('" + obj.join("', '") + "');"
	, cb);
};

PostgreSQL.prototype.update = function(key, obj, cb) {
	this.client.query(
		"UPDATE " + this.table 
		+ " SET " + queryString.stringify(obj, '", ', '= "')
		+ " WHERE " + this.pkey + " = " + key 
	, cb);
};


PostgreSQL.prototype.destroy = function(key, cb) {
	this.client.query(
		"DELETE FROM " + this.table 
		+ " WHERE " + this.pkey + " = " + key 
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