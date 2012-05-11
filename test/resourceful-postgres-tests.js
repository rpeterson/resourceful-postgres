var resourceful = require('resourceful'),
    async = require('async'),
    assert = require('assert'),
    events = require('events'),
    vows = require('vows'),
    pg = require('pg'),
    pgConnString = 'tcp://postgres@localhost/postgres',
    pgTestTable  = 'users';

require('../index');

resourceful.env = 'postgres';

vows.describe('resourceful/engines/database').addVows({
  "A database containing default resources": {
    topic: function () {
      var promise = new(events.EventEmitter);
      var db = new pg.Client(pgConnString);
          db.connect();
      db.query("DROP TABLE " + pgTestTable + "", function(err, res) {
        db.query("CREATE TABLE " + pgTestTable 
                  + " (id SERIAL, name varchar(10), age integer, hair varchar(10))"
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
}).addVows({
  "A default Resource factory" : {
    topic: function() {
      this.Factory = resourceful.define('user', function () {
        this.use('pg');
      });
      this.Factory._key = 'id';
      delete this.Factory.schema.properties['_id'];
      this.Factory.number('id');
      this.Factory.string('name');
      this.Factory.number('age');
      this.Factory.string('hair');
      return this.Factory;
    },
    "a create() request": {
      topic: function (r) {
        r.create({name: 'james', age: 30, hair: 'red'}, this.callback);
      },
      "should return the newly created object": function (e, obj) {
        assert.instanceOf(obj, this.Factory);
        assert.equal(obj.id, 4);
      }
    },
    "should create the record in the db": {
      topic: function (_, r) {
        r.get(4, this.callback);
      },        
      "which can then be retrieved": function (e, res) {
        assert.isObject(res);
        assert.equal(res.age, 30);
      },
      "and updated": {
        topic: function (r) {
          r.update({ hair: 'blue'}, this.callback);
        },
        "which can then be retrieved": function (e, res) {
          assert.isObject(res);
          assert.equal(res.hair, 'blue');
        }
      }
    }
  }
}).export(module);