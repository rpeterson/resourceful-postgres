var resourceful = require('resourceful'),
    async = require('async'),
    assert = require('assert'),
    events = require('events'),
    vows = require('vows'),
    pg = require('pg'),
    pgConnString = 'tcp://postgres@localhost/postgres',
    pgTestTable  = 'users',
    pgIdKey = '_id';

require('../index');

resourceful.env = 'postgres';

vows.describe('resourceful/engines/database').addBatch({
  "A database containing default resources": {
    topic: function () {
      var promise = new(events.EventEmitter);
      var db = new pg.Client(pgConnString);
          db.connect();
      db.query("DROP TABLE " + pgTestTable + "", function(err, res) {
        db.query("CREATE TABLE " + pgTestTable 
                  + " ("+pgIdKey+" SERIAL, name varchar(10), age integer, hair varchar(10))"
                  , function(err, res) {
          async.map([
            {name: 'bob', age: 35, hair: 'black'},
            {name: 'tim', age: 16, hair: 'brown'},
            {name: 'mat', age: 29, hair: 'black'}
          ], function(prop, cb) {
            db.query("INSERT INTO " + pgTestTable + " (name, age, hair) VALUES ('" 
              + prop.name + "', '" + prop.age + "', '" + prop.hair + "');", cb);
          }, function(e, res) {
            promise.emit('success', res);
          });
          promise.emit('is created', res);
        });
      });
      return promise;
    },
    "is created": function (e, obj) {
      assert.isNull(e);
      assert.isArray(obj);
    }
  }
}).addBatch({
  "A default Resource factory" : {
    topic: function() {
      this.Factory = resourceful.define('user', function () {
        this.use('pg', {table: pgTestTable});
      });
      this.Factory.string('name');
      this.Factory.number('age');
      this.Factory.string('hair');
      return this.Factory;
    },
    "a create() request": {
      topic: function (r) {
        return r.create({name: 'james', age: 30, hair: 'red'}, this.callback);
      },
      "should return the newly created object": function (e, obj) {
        if(e) console.log(e);
        assert.instanceOf(obj, this.Factory);
        assert.equal(obj.name, 'james');
      },
      "should create the record in the db": {
        topic: function (_, r) {
          return r.get(4, this.callback);
        },        
        "which can then be retrieved": function (e, res) {
          if(e) console.log(e);
          assert.isObject(res);
          assert.equal(res[pgIdKey], 4);
          assert.equal(res.age, 30);
        },
        "and be able to update it": {
          topic: function (_, r) {
            return r.update({ hair: 'blue'}, this.callback);
          },
          "which can then be retrieved": function (e, res) {
            assert.isObject(res);
            assert.equal(res.hair, 'blue');
          }
        }
      }
    },
    "a get() request": {
      "focus: when successful": {
        topic: function (r) {
          return r.get(1, this.callback);
        },
        "should respond with a Resource instance": function (e, obj) {
          assert.isObject(obj);
          assert.instanceOf(obj, resourceful.Resource);
          assert.equal(obj.constructor, this.Factory);
        },
        "should respond with the right object": function (e, obj) {
          assert.isNull(e);
          assert.equal(obj[pgIdKey], 1);
          assert.equal(obj.name, 'bob');
        },
        "should store the object in the cache": function () {
          assert.isObject(this.Factory.connection.cache.store[1]);
        },
        "followed by an update() request": {
          topic: function (r) {
            r.update({ name: 'robert' }, this.callback);
          },
          "should respond successfully": function (e, obj) {
            assert.isNull(e);
            assert.ok(obj);
          },
          "followed by another update() request": {
            topic: function (_, r) {
              r.update({ age: 37 }, this.callback);
            },
            "should respond successfully": function (e, res) {
              assert.isNull(e);
            },
            "should save the latest revision to the cache": function (e, res) {
              assert.equal(this.Factory.connection.cache.store[1].age, 37);
            }
          }
        }
      },
      "when unsuccessful": {
        topic: function (r) {
          r.get(86, this.callback);
        },
        "should respond with an error": function (e, obj) {
          assert.isTrue(e.notFound);
          assert.equal(e.status, 404);
          assert.isUndefined(obj);
        }
      }
    }
  }
}).addBatch({
  "A default Resource factory": {
    topic: function() {
      this.Factory = resourceful.define('user', function () {
        this.use('pg', {table: pgTestTable});
      });
      this.Factory.string('name');
      this.Factory.number('age');
      this.Factory.string('hair');
      return this.Factory;
    },
    "all() request": {
      topic: function(r){
        r.all(this.callack);
      },
      "should respond with an object of all records": function(e, obj) {
        assert.isNull(e);
        assert.isObject(obj);
      }
    }
  }
}).export(module);