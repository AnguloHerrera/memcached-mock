/*
 * Copyright (c) 2015 Jeffrey Hunter
 *
 * Distributed under the MIT license. See the LICENSE file distributed
 * with this work for details and restrictions.
 */

var Memcached = require("../../index");

/** Evaluate calling context for callback */
function testContext(test, that, name, args) {
  test.ok(that.hasOwnProperty('start'));
  test.ok(that.start <= Date.now());
  test.ok(that.hasOwnProperty('execution'))
  test.ok(that.execution >= 0);
  
  var expected = {
    start: that.start,
    execution: that.execution,
    callback: args.callback,
    type: name,
    command: null,
    validate: []
  };
  
  Object.keys(args).forEach(function(arg) {
    expected[arg] = args[arg];
    expected.validate.push([arg,null]);
  });
  
  test.deepEqual(that, expected);
}

/** Test basic get and set operations */
module.exports.testGetSet = function(test) {
  var key = '19en8bgbr';
  var value = '19en8c6bs';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.get(key, function(err, data) {
    test.ifError(err);
    test.strictEqual(data, undefined);
    
    memcached.set(key, value, 1, function setCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'set', {"key": key, "value": value, "lifetime": 1, callback: setCallback});
      test.strictEqual(reply, true);
      
      memcached.get(key, function getCallback(err, data) {
        test.ifError(err);
        test.strictEqual(data, value);
        testContext(test, this, 'get', {"key": key, callback: getCallback});
        test.done();
        
      });
    });
  });
}

/** Test expiration */
module.exports.testSetExpiration = function(test) {
  var key = '19epfu6vj';
  var value = '19epfueu8';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value, 1, function(err, data) {
    test.ifError(err);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, value);
      
      setTimeout(function() {
        memcached.get(key, function(err, data) {
          test.ifError(err);
          test.strictEqual(data, undefined);
          test.done();
          
        });
        
      }, 1500);
    });
  });
}

/** Test touch */
module.exports.testTouch = function(test) {
  var key = '19eph2mg1';
  var value = '19eph35c8';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value, 1, function(err, data) {
    test.ifError(err);
    
    memcached.touch(key, 2, function(err, reply) {
      test.ifError(err);
      test.strictEqual(reply, true);
      
      setTimeout(function() {
        memcached.get(key, function(err, data) {
          test.ifError(err);
          test.strictEqual(data, value);
          test.done();
          
        });
        
      }, 1500);
    });
  });
}

/** Test touch non-existent key */
module.exports.testTouchNonExistent = function(test) {
  var key = '19epr4uj1';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.touch(key, 1, function(err, reply) {
    test.ifError(err);
    test.strictEqual(reply, false);
    test.done();
    
  });
}

/** Test gets */
module.exports.testGets = function(test) {
  var key = '19epmksqm';
  var value = '19epml3p7';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value, 1, function(err, data) {
    test.ifError(err);
    test.strictEqual(data, true);
    
    memcached.gets(key, function getsCallback(err, data) {
      test.ifError(err);
      testContext(test, this, 'gets', {"key": key, callback: getsCallback});
      test.ok(data.hasOwnProperty('cas'));
      test.ok(typeof data.cas, "string");
      test.ok(data.cas.length > 0);
      
      var expected = {cas: data.cas};
      expected[key] = value;
      test.deepEqual(data, expected);
      test.done();
      
    });
  });
}

/** Test getMutli */
module.exports.testGetMulti = function(test) {
  var keys = ['19epo6uuj', '19epo77eh', '19epo7jp8'];
  var values = ['19epo7tqc', '19epo882f', '19epo8ek8'];
  var toSet = [0, 1, 2];
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  function setNext(err) {
    test.ifError(err);
    
    if (toSet.length > 0)
      memcached.set(keys[toSet[0]], values[toSet.shift()], 1, setNext);
    else
      getAll();
  }
  
  function getAll() {
    memcached.getMulti(keys, function getMultiCallback(err, data) {
      test.ifError(err);
      // global context is used by memcached for this call
      
      var expected = {};
      keys.forEach(function(key, idx) { expected[key] = values[idx]; });
      
      test.deepEqual(expected, data);
      test.done();
      
    });
  }
  
  setNext();
}

/** Test get with array */
module.exports.testGetWithArray = function(test) {
  var keys = ['19epp4imt', '19epp4rt5', '19epp555h'];
  var values = ['19epp5fe3', '19epp5s4c', '19epp688v'];
  var toSet = [0, 1, 2];
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  function setNext(err) {
    test.ifError(err);
    
    if (toSet.length > 0)
      memcached.set(keys[toSet[0]], values[toSet.shift()], 1, setNext);
    else
      getAll();
  }
  
  function getAll() {
    memcached.get(keys, function getMultiCallback(err, data) {
      test.ifError(err);
      // global context is used by memcached for this call
      
      var expected = {};
      keys.forEach(function(key, idx) { expected[key] = values[idx]; });
      
      test.deepEqual(expected, data);
      test.done();
      
    });
  }
  
  setNext();
}

/** Test successful replace */
module.exports.testReplaceSuccess = function(test) {
  var key = '19ept1qon';
  var value1 = '19ept7un3';
  var value2 = '19ept96oc';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.replace(key, value2, 1, function replaceCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'replace', {"key": key, "value": value2, "lifetime": 1, callback: replaceCallback});
      test.strictEqual(reply, true);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value2);
        test.done();
        
      });
    });
  });
}

/** Test unsuccessful replace */
module.exports.testReplaceFailure = function(test) {
  var key = '19eptdnq3';
  var value = '19epteo37';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.replace(key, value, 1, function replaceCallback(err, reply) {
    test.ok(err);
    test.strictEqual(err.notStored, true);
    test.strictEqual(err.message, "Item is not stored");
    testContext(test, this, 'replace', {"key": key, "value": value, "lifetime": 1, callback: replaceCallback});
    test.strictEqual(reply, false);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, undefined);
      test.done();
      
    });
  });
}

/** Test flush */
module.exports.testFlush = function(test) {
  var key = '19epuc5dp';
  var value = '';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value, 1, function(err) {
    test.ifError(err);
    
    memcached.flush(function flushCallback(err, reply) {
      test.ifError(err);
      // global context is used by memcached for this call
      test.deepEqual(reply, [true]);
      
      memcached.get(key, function getCallback(err, data) {
        test.ifError(err);
        test.strictEqual(data, undefined);
        test.done();
        
      });
    });
  });
}

/** Test successful add */
module.exports.testAddSuccess = function(test) {
  var key = '19esns0kt';
  var value = '19esnsd6m';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.add(key, value, 1, function addCallback(err, reply) {
    test.ifError(err);
    testContext(test, this, 'add', {"key": key, "value": value, "lifetime": 1, callback: addCallback});
    test.strictEqual(reply, true);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, value);
      test.done();
      
    });
  });
}

/** Test failed add */
module.exports.testAddFailure = function(test) {
  var key = '19esnstjk';
  var value1 = '19eso8qge';
  var value2 = '19eso924r';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.add(key, value2, 1, function addCallback(err, reply) {
      test.ok(err);
      test.strictEqual(err.notStored, true);
      test.strictEqual(err.message, "Item is not stored");
      testContext(test, this, 'add', {"key": key, "value": value2, "lifetime": 1, callback: addCallback});
      test.strictEqual(reply, false);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value1);
        test.done();
        
      });
    });
  });
}

/** Test successful cas call */
module.exports.testCasSuccess = function(test) {
  var key = '19espjh7k';
  var value1 = '19espjpl5';
  var value2 = '19espjtqq';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.gets(key, function(err, data) {
      test.ifError(err);
      
      memcached.cas(key, value2, data.cas, 1, function casCallback(err, reply) {
        test.ifError(err);
        testContext(test, this, 'cas', {"key": key, "value": value2, "cas": data.cas, "lifetime": 1, callback: casCallback});
        test.strictEqual(reply, true);
      
        memcached.get(key, function(err, data) {
          test.ifError(err);
          test.strictEqual(data, value2);
          test.done();
        
        });
      });
    });
  });
}

/** Test failed cas call */
module.exports.testCasFailure = function(test) {
  var key = '19espmmg4';
  var value1 = '19espq82q';
  var value2 = '19espqia5';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.gets(key, function(err, data) {
      test.ifError(err);
      
      memcached.cas(key, value2, "invalid", 1, function casCallback(err, reply) {
        test.ifError(err);
        testContext(test, this, 'cas', {"key": key, "value": value2, "cas": "invalid", "lifetime": 1, callback: casCallback});
        test.strictEqual(reply, false);
      
        memcached.get(key, function(err, data) {
          test.ifError(err);
          test.strictEqual(data, value1);
          test.done();
        
        });
      });
    });
  });
}

/** Test successful append */
module.exports.testAppendSuccess = function(test) {
  var key = '19esr70ik';
  var value1 = '19esr75a6';
  var value2 = '19esr7939';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.append(key, value2, function appendCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'append', {"key": key, "value": value2, callback: appendCallback});
      test.strictEqual(reply, true);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value1 + value2);
        test.done();
        
      });
    });
  });
}

/** Test unsuccessful append */
module.exports.testAppendFailure = function(test) {
  var key = '19esr7gcj';
  var value = '19esr7lsr';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.append(key, value, function appendCallback(err, reply) {
    test.ok(err);
    test.strictEqual(err.notStored, true);
    test.strictEqual(err.message, "Item is not stored");
    testContext(test, this, 'append', {"key": key, "value": value, callback: appendCallback});
    test.strictEqual(reply, false);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, undefined);
      test.done();
      
    });
  });
}

/** Test successful prepend */
module.exports.testPrependSuccess = function(test) {
  var key = '19evau93p';
  var value1 = '19evaujvt';
  var value2 = '19evaunli';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.prepend(key, value2, function prependCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'prepend', {"key": key, "value": value2, callback: prependCallback});
      test.strictEqual(reply, true);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value2 + value1);
        test.done();
        
      });
    });
  });
}

/** Test unsuccessful prepend */
module.exports.testPrependFailure = function(test) {
  var key = '19evausm8';
  var value = '19evavruq';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.prepend(key, value, function prependCallback(err, reply) {
    test.ok(err);
    test.strictEqual(err.notStored, true);
    test.strictEqual(err.message, "Item is not stored");
    testContext(test, this, 'prepend', {"key": key, "value": value, callback: prependCallback});
    test.strictEqual(reply, false);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, undefined);
      test.done();
      
    });
  });
}

/** Test successful increment */
module.exports.testIncrSuccess = function(test) {
  var key = '19evbdh8t';
  var value1 = 258;
  var value2 = 12;
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.incr(key, value2, function incrCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'incr', {"key": key, "value": value2, callback: incrCallback});
      test.strictEqual(reply, value1 + value2);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value1 + value2);
        test.done();
        
      });
    });
  });
}

/** Test unsuccessful increment */
module.exports.testIncrFailure = function(test) {
  var key = '19evbj7rf';
  var value = 438;
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.incr(key, value, function incrCallback(err, reply) {
    test.ifError(err);
    testContext(test, this, 'incr', {"key": key, "value": value, callback: incrCallback});
    test.strictEqual(reply, false);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, undefined);
      test.done();
      
    });
  });
}

/** Test successful decrement */
module.exports.testDecrSuccess = function(test) {
  var key = '19evc21pi';
  var value1 = 833;
  var value2 = 333;
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value1, 1, function(err) {
    test.ifError(err);
    
    memcached.decr(key, value2, function decrCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'decr', {"key": key, "value": value2, callback: decrCallback});
      test.strictEqual(reply, value1 - value2);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, value1 - value2);
        test.done();
        
      });
    });
  });
}

/** Test unsuccessful decrement */
module.exports.testDecrFailure = function(test) {
  var key = '19evc4uqo';
  var value = 128;
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.decr(key, value, function decrCallback(err, reply) {
    test.ifError(err);
    testContext(test, this, 'decr', {"key": key, "value": value, callback: decrCallback});
    test.strictEqual(reply, false);
    
    memcached.get(key, function(err, data) {
      test.ifError(err);
      test.strictEqual(data, undefined);
      test.done();
      
    });
  });
}

/** Test delete */
module.exports.testDelete = function(test) {
  var key = '19evevlni';
  var value = '19evf0356';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.set(key, value, 1, function(err) {
    test.ifError(err);
    
    memcached.del(key, function delCallback(err, reply) {
      test.ifError(err);
      testContext(test, this, 'delete', {"key": key, callback: delCallback});
      test.strictEqual(reply, true);
      
      memcached.get(key, function(err, data) {
        test.ifError(err);
        test.strictEqual(data, undefined);
        test.done();
        
      });
    });
  });
}

/** Test delete nonexistent key */
module.exports.testDeleteNonExisting = function(test) {
  var key = '19evf3p03';
  
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.del(key, function delCallback(err, reply) {
    test.ifError(err);
    testContext(test, this, 'delete', {"key": key, callback: delCallback});
    test.strictEqual(reply, false);
    test.done();
      
  });
}

/** Test version */
module.exports.testVersion = function(test) {
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.version(function versionCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "127.0.0.1:11211",
      "version": "1.4.20",
      "major": "1",
      "minor": "4",
      "bugfix": "20"
    }]);
    test.done();
      
  });
}

/** Test version with multiple servers */
module.exports.testVersionMultiple = function(test) {
  var memcached = new Memcached(["192.168.0.1:11211","192.168.0.2:11211"]);
  
  memcached.version(function versionCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "192.168.0.1:11211",
      "version": "1.4.20",
      "major": "1",
      "minor": "4",
      "bugfix": "20"
    },{
      "server": "192.168.0.2:11211",
      "version": "1.4.20",
      "major": "1",
      "minor": "4",
      "bugfix": "20"
    }]);
    test.done();
      
  });
}

/** Test stats */
module.exports.testStats = function(test) {
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.stats(function statsCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "127.0.0.1:11211",
      "pid":1,"uptime":1,"time":reply[0].time,"version":"1.4.20","libevent":"2.0.22-stable","pointer_size":64,"rusage_user":"0.0","rusage_system":"0.0","curr_connections":1,"total_connections":1,"connection_structures":1,"reserved_fds":0,"cmd_get":0,"cmd_set":0,"cmd_flush":0,"cmd_touch":0,"get_hits":0,"get_misses":0,"delete_misses":0,"delete_hits":0,"incr_misses":0,"incr_hits":0,"decr_misses":0,"decr_hits":0,"cas_misses":0,"cas_hits":0,"cas_badval":0,"touch_hits":0,"touch_misses":0,"auth_cmds":0,"auth_errors":0,"bytes_read":1,"bytes_written":1,"limit_maxbytes":67108864,"accepting_conns":1,"listen_disabled_num":0,"threads":4,"conn_yields":0,"hash_power_level":16,"hash_bytes":524288,"hash_is_expanding":0,"malloc_fails":0,"bytes":0,"curr_items":0,"total_items":0,"expired_unfetched":0,"evicted_unfetched":0,"evictions":0,"reclaimed":0,"crawler_reclaimed":0
    }]);
    test.done();
      
  });
}

/** Test stats with multiple servers */
module.exports.testStatsMultiple = function(test) {
  var memcached = new Memcached(["192.168.0.1:11211","192.168.0.2:11211"]);
  
  memcached.stats(function statsCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "192.168.0.1:11211",
      "pid":1,"uptime":1,"time":reply[0].time,"version":"1.4.20","libevent":"2.0.22-stable","pointer_size":64,"rusage_user":"0.0","rusage_system":"0.0","curr_connections":1,"total_connections":1,"connection_structures":1,"reserved_fds":0,"cmd_get":0,"cmd_set":0,"cmd_flush":0,"cmd_touch":0,"get_hits":0,"get_misses":0,"delete_misses":0,"delete_hits":0,"incr_misses":0,"incr_hits":0,"decr_misses":0,"decr_hits":0,"cas_misses":0,"cas_hits":0,"cas_badval":0,"touch_hits":0,"touch_misses":0,"auth_cmds":0,"auth_errors":0,"bytes_read":1,"bytes_written":1,"limit_maxbytes":67108864,"accepting_conns":1,"listen_disabled_num":0,"threads":4,"conn_yields":0,"hash_power_level":16,"hash_bytes":524288,"hash_is_expanding":0,"malloc_fails":0,"bytes":0,"curr_items":0,"total_items":0,"expired_unfetched":0,"evicted_unfetched":0,"evictions":0,"reclaimed":0,"crawler_reclaimed":0
    },{
      "server": "192.168.0.2:11211",
      "pid":1,"uptime":1,"time":reply[1].time,"version":"1.4.20","libevent":"2.0.22-stable","pointer_size":64,"rusage_user":"0.0","rusage_system":"0.0","curr_connections":1,"total_connections":1,"connection_structures":1,"reserved_fds":0,"cmd_get":0,"cmd_set":0,"cmd_flush":0,"cmd_touch":0,"get_hits":0,"get_misses":0,"delete_misses":0,"delete_hits":0,"incr_misses":0,"incr_hits":0,"decr_misses":0,"decr_hits":0,"cas_misses":0,"cas_hits":0,"cas_badval":0,"touch_hits":0,"touch_misses":0,"auth_cmds":0,"auth_errors":0,"bytes_read":1,"bytes_written":1,"limit_maxbytes":67108864,"accepting_conns":1,"listen_disabled_num":0,"threads":4,"conn_yields":0,"hash_power_level":16,"hash_bytes":524288,"hash_is_expanding":0,"malloc_fails":0,"bytes":0,"curr_items":0,"total_items":0,"expired_unfetched":0,"evicted_unfetched":0,"evictions":0,"reclaimed":0,"crawler_reclaimed":0
    }]);
    test.done();
      
  });
}

/** Test settings */
module.exports.testSettings = function(test) {
  var memcached = new Memcached("127.0.0.1:11211");
  
  memcached.settings(function statsCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "127.0.0.1:11211",
      "maxbytes":67108864,"maxconns":1024,"tcpport":11211,"udpport":11211,"inter":"NULL","verbosity":0,"oldest":13516,"evictions":"on","domain_socket":"NULL","umask":700,"growth_factor":"1.25","chunk_size":48,"num_threads":4,"num_threads_per_udp":4,"stat_key_prefix":":","detail_enabled":"no","reqs_per_event":20,"cas_enabled":"yes","tcp_backlog":1024,"binding_protocol":"auto-negotiate","auth_enabled_sasl":"no","item_size_max":1048576,"maxconns_fast":"no","hashpower_init":0,"slab_reassign":"no","slab_automove":0,"lru_crawler":"no","lru_crawler_sleep":100,"lru_crawler_tocrawl":0,"tail_repair_time":0,"flush_enabled":"yes","hash_algorithm":"jenkins"
    }]);
    test.done();
      
  });
}

/** Test settings with multiple servers */
module.exports.testSettingsMultiple = function(test) {
  var memcached = new Memcached(["192.168.0.1:11211","192.168.0.2:11211"]);
  
  memcached.settings(function statsCallback(err, reply) {
    test.ifError(err);
    // global context is used by memcached for this call
    test.deepEqual(reply, [{
      "server": "192.168.0.1:11211",
      "maxbytes":67108864,"maxconns":1024,"tcpport":11211,"udpport":11211,"inter":"NULL","verbosity":0,"oldest":13516,"evictions":"on","domain_socket":"NULL","umask":700,"growth_factor":"1.25","chunk_size":48,"num_threads":4,"num_threads_per_udp":4,"stat_key_prefix":":","detail_enabled":"no","reqs_per_event":20,"cas_enabled":"yes","tcp_backlog":1024,"binding_protocol":"auto-negotiate","auth_enabled_sasl":"no","item_size_max":1048576,"maxconns_fast":"no","hashpower_init":0,"slab_reassign":"no","slab_automove":0,"lru_crawler":"no","lru_crawler_sleep":100,"lru_crawler_tocrawl":0,"tail_repair_time":0,"flush_enabled":"yes","hash_algorithm":"jenkins"
    },{
      "server": "192.168.0.2:11211",
      "maxbytes":67108864,"maxconns":1024,"tcpport":11211,"udpport":11211,"inter":"NULL","verbosity":0,"oldest":13516,"evictions":"on","domain_socket":"NULL","umask":700,"growth_factor":"1.25","chunk_size":48,"num_threads":4,"num_threads_per_udp":4,"stat_key_prefix":":","detail_enabled":"no","reqs_per_event":20,"cas_enabled":"yes","tcp_backlog":1024,"binding_protocol":"auto-negotiate","auth_enabled_sasl":"no","item_size_max":1048576,"maxconns_fast":"no","hashpower_init":0,"slab_reassign":"no","slab_automove":0,"lru_crawler":"no","lru_crawler_sleep":100,"lru_crawler_tocrawl":0,"tail_repair_time":0,"flush_enabled":"yes","hash_algorithm":"jenkins"
    }]);
    test.done();
      
  });
}