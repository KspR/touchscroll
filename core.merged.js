(sand.define("core/Array/collect", function() {
  
  Array.prototype.collect = function(f) {
    var res = [];
    if (typeof(f) === "string") {
      for (var i = -1, n = this.length; ++i < n; ) {
        res.push(this[i][f]);
      }
    }
    else {
      for (var i = -1, n = this.length; ++i < n; ) {
        res.push(f(this[i]));
      }
    }
    return res;
  };
  
}));
(sand.define("core/Array/compact", function() {
  
  Array.prototype.compact = function() { // same as above but the "not-in-the-return" values are the one where f(el) is true
    for (var i = this.length; i--; ) if (!this[i]) this.splice(i, 1);
    return this;
  }
  
}));
(sand.define("core/Array/diff", ["core/Array/has"], function() {
  
  Array.prototype.diff = function(a) {
    var o = {add:[],rem:[]};
    for (var i = this.length; i--; ) if (!a.has(this[i])) o.rem.push(this[i]);
    for (i = a.length; i--; ) if (!this.has(a[i])) o.add.push(a[i]);
    return o;
  };
  
}));
(sand.define("core/Array/each", function() {
  
  Array.prototype.each = function(f) {
    for (var i = 0, n = this.length; i < n; i++){
			f(this[i], i, this);
    }
    return this;
  };
  
}));
(sand.define("core/Array/except", function() {
  
  Array.prototype.except = function(v) { // same as above but the "not-in-the-return" values are the one where f(el) is true
    var res = [];
    for (var i = 0, n = this.length; i < n; i++) if (this[i] !== v) res.push(this[i])
    return res;
  }
  
}));
(sand.define("core/Array/exceptFn", function() {
  
  Array.prototype.exceptFn = function(f) { // same as above but the "not-in-the-return" values are the one where f(el) is true
    var r = this.slice();
    for (var i = r.length; i--; ) if (f(r[i])) r.splice(i, 1);
    return r;
  }
  
}));
(sand.define("core/Array/exec", function() {
  
  Array.prototype.exec = function(e) {
    if (typeof(e) === "function") {
      for (var i = this.length; i--; ) f(this[i]);
    }
    else {
      e = e.substr(2, e.length);
      for (var i = this.length; i--; ) this[i][e]();
    }
  }
  
}));
(sand.define("core/Array/find", function() {
  
  Array.prototype.find = function(f) {
    for (var i = 0,n=this.length;i<n;i++) {
      if (f(this[i])) return this[i];
    }
  };
  
}));
(sand.define("core/Array/first", function() {
  
  Array.prototype.first = function(f) {
    for (var i = 0, n = this.length; i < n; i++) {
      if (f(this[i])) return this[i];
    }
    return null;
  };
  
}));
sand.define('core/Array/flatten', function(r) {
  
  Array.prototype.flatten = function(lvl) { // same as above but the "not-in-the-return" values are the one where f(el) is true
    var res = [];

    if (typeof(lvl) !== 'number') {
      for (var i = -1, n = this.length; ++i < n; ) {
        if (Array.isArray(this[i])) res = res.concat(this[i].flatten());
        else res.push(this[i]);
      }
    }
    else {
      for (var i = -1, n = this.length; ++i < n; ) {
        if (Array.isArray(this[i]) && lvl) res = res.concat(this[i].flatten(lvl - 1));
        else res.push(this[i]);
      }
    }

    return res;
  };
  
});
(sand.define("core/Array/has", function() {
  
  Array.prototype.has = function(value) {
    for (var i = this.length; i--; ) {
      if (this[i] === value) {
        return true;
      }
    } 
    return false;
  };
  
}));
sand.define('core/Array/include', function() {
  
  Array.prototype.include = function(v) {
	for (var i = this.length; i--; ) if (this[i] === v) return true;
	return false;
  };
  
});sand.define('core/Array/includedIn', function() {
  
  Array.prototype.includedIn = function(a) {
    for (var i = -1, n = this.length; ++i < n; ) if (!a.include(this[i])) return false;
    return true;
  };
  
});sand.define("core/Array/indexesOf",function(){
  Array.prototype.indexesOf = function(v){
    var i,current = this.concat(),dec=0,indexes= [];
    while((i = current.indexOf(v)) !== -1){
      indexes.push(i+dec);
      current = current.splice(i,i);
      dec++;
    }
    return indexes;
  }
});
sand.define('core/Array/insert', function() {
  
  Array.prototype.insert = function(v, i) {
    var r = this.slice(0, i);
    r.push(v);
    r = r.concat(this.slice(i, this.length));
    return r;
  };
  
});(sand.define("core/Array/last", function() {
  
  Array.prototype.last = function() {
    return this[this.length-1];
  };
  
}));
(sand.define("core/Array/map", function() {
  
  Array.prototype.map = function(fn, scope) { // returns a new array where elements are fn(this[i])
  //scope is here for node's map compatibility
    if (scope) fn = fn.bind(scope);
    var r = this.slice();
    if (typeof(fn) === "function") {
      for (var i = 0, n = r.length; i < n; i++) r[i] = fn(r[i], i);
    }
    else {
      fn = fn.substr(2, fn.length);
      for (var i = 0, n = r.length; i < n; i++) r[i] = r[i][fn]();
    }
    return r;
  };
  
  Array.prototype.as = function(fn) {
    return (Array.prototype.map.call(this, fn));
  };
  
}));
sand.define("core/Array/mapAsync",["core/Array/curry"],function(r){
   Array.prototype.mapAsync = function(cb,fn){
     var l = this.length,l2=l,
         res = [],
         isErr = false,
         c = function(i,err,o){   
           if(isErr){return;};
           if(err){   
             isErr = true;
             if(typeof(err)==="object" &&  typeof(err.index)==="undefined"){
               err.index = i;
             }
             cb(err);
           }
           //console.log(res,l2,i);
           
           res[i] = o;
           !--l2&&cb(null,res);
         };
     for(var i = 0; i < l; i++){ 
       fn(c.curry(i),this[i]);
     }
  }
});
(sand.define("core/Array/max", function() {
  
  Array.prototype.max = function() { // returns a new array where elements are fn(this[i])
    var n = this.length;
    if (n) {
      var max = this[0];
      for (var i = 1; i < n; i++) {
        if (this[i] > max) max = this[i];
      }
      return max;
    }
    else {
      return null;
    }
  };
  
}));
(sand.define("core/Array/min", function() {
  
  Array.prototype.min = function(){
    var m = this[0];
    for(var i = 1; i < this.length; i++){
      if (this[i] < m){
        m = this[i];
      }
    }
    return m;
  };

}));
sand.define('core/Array/move', function() {
  
  Array.prototype.move = function (from, to) {
    this.splice(to, 0, this.splice(from, 1)[0]);
    return this;
  };

});sand.define('core/Array/eachB', function() {
  
  return (Array.prototype.eachB = function(f) {
    
    for (var i = -1, n = this.length; ++i < n; ) {
      if (f(this[i])=== false) {
        return this[i];
      }
    }
    
    return null;
  });
  
});(sand.define("core/Array/onEls", function() {
  
  Array.prototype.onEls = function(f) { // replaces every element of this with f(element)
    for (var i = this.length; i--; ) this[i] = f(this[i]);
    return this;
  };
  
}));
sand.define('core/Array/one', function() {
  
  Array.prototype.one = function(f, value) {
    if (typeof(f) === 'function') {
      for (var i = -1, n = this.length; ++i < n; ) {
        if (f(this[i])) return this[i];
      }
    }
    else {
      if (typeof(value) === 'undefined') value = true;
      for (var i = -1, n = this.length; ++i < n; ) {
        if (this[i][f] === value) return this[i];
      }
    }
    return null
  };
  
});(sand.define("core/Array/remove", function() {
  
  Array.prototype.remove = function(v) {
    for (var i = this.length; i--; ) {
      if (this[i] === v) this.splice(i, 1);
    }
    return this;
  };
  
}));
sand.define('core/Array/removeOneValue', function() {

  Array.prototype.removeOneValue = function(v) {
		for (var i = this.length; i--; ) {
        if (this[i] === v) {
          return (this.splice(i, 1));
        }
    }
  };

});
sand.define('core/Array/replace', function() {

	Array.prototype.replace = function(a, b) {
		for (var i = this.length; i--; ) if (this[i] === a) this[i] = b;
		return this;
	};

});sand.define("core/Array/send", function() {
  
  Array.prototype.send = function(method) {
    var args = Array.prototype.slice.call(arguments);
    args.splice(0, 1);
    if (typeof(method) === 'string') {
      for (var i = -1, n = this.length; ++i < n; ) {
        this[i][method].apply(this[i], args);
      }
    }
    else for (var i = -1, n = this.length; ++i < n; ) method.apply({}, [this[i]].concat(args));
    return this;
  };
  
});
sand.define("core/Array/set", function() {
  
  Array.prototype.set = function(attr, value) {
    for (var i = -1, n = this.length; ++i < n; ) this[i][attr] = value;
    return this;
  };
  
});
(sand.define("core/Array/substract", function() {
  
  Array.prototype.substract = function(o) { // same as sub but doesn't override this
    var r = this.slice();
    for (var i = o.length; i--; ) {
      r.remove(o[i]);
    }
    return r;
  };
  
}));
(sand.define("core/Array/uniq", ["core/Array/has"], function() {

  Array.prototype.uniq = function(f) {
    var res = []
    if (!f) {
      for (var i = -1, n = this.length; ++i < n; ) {
        !res.has(this[i]) && res.push(this[i]);
      }
    }
    else {
      if (typeof(f) === 'string') {
        var _r = [];
        for (var i = -1, n = this.length; ++i < n; ) {
          var v = this[i][f];
          if (!_r.has(v)) {
            res.push(this[i]);
            _r.push(v);
          }
        }
      }
      else {
        var _r = [];
        for (var i = 0, n = this.length; i < n; i++) {
          var v = f(this[i]);
          if (!_r.has(v)) {
            res.push(this[i])
            _r.push(v);
          }
        }
      }
    }
    return res;
  }
  
}));
(sand.define("core/Array/where", function() {
  
  Array.prototype.where = function(f, value) {
    var res = [];
    if (typeof(f) === 'function') {
      for (var i = -1, n = this.length; ++i < n; ) {
        if (f(this[i], i)) res.push(this[i]);
      }
    }
    else {
      if (typeof(value) === 'undefined') value = true;
      for (var i = -1, n = this.length; ++i < n; ) {
        if (this[i][f] === value) res.push(this[i]);
      }
    }
    return res;
  }
  
}));
(sand.define("core/Function/bind", function() {
  //---
  // Really important function
  // binds this to a certain scope, makes it easier to handle closure
  Function.prototype.bind || (Function.prototype.bind = function(scope) {
    var self = this;
    return (function() {
      return (self.apply(scope, arguments));
    });
  });
  
  Function.prototype.for = function(array) {
    for (var i = array.length; i--; ) {
      if (!this(array[i])) return false;
    }
    return true;
  };
  
}));
/*
 * 
    var f = function() {
      return (self.apply(scope, arguments));
    };
    f._scope = scope;
    return f;
 */
(sand.define("core/Function/bindThis", function() {
  // just a marker to note that the function must be executed in instance scope
  (Function.prototype.bindThis = function(scope) {
    this._b = true;
    return this;
  });
  
}));
(sand.define("core/Function/curry", function() {
  //---
  // 
  Function.prototype.curry = function() {
    var self = this,
        args1 = Array.prototype.slice.call(arguments);
    return (function() { 
      var args2 = Array.prototype.slice.call(arguments);
      return (self.apply(this, args1.concat(args2)));
    });
  };
  
}));
(sand.define("core/Function/exec", function() {
  // just a marker to note that the function must be executed in instance scope
  (Function.prototype.exec = function(scope) {
    this._e = true;
    return this;
  });
  
}));
(sand.define("core/Function/lurry", function() {
  //---
  // lurry <=> last curry
  Function.prototype.lurry = function() {
    var self = this,
        args1 = Array.prototype.slice.call(arguments);
    return (function() { 
      var args2 = Array.prototype.slice.call(arguments);
      return (self.apply(this, args2.concat(args1)));
    });
  };
  
}));
(sand.define("core/String/as", function() {

  String.prototype.as = function(f) {
    return f(this);
  };
  
}));
(sand.define("core/String/bindThis", ["core/Function/bindThis"], function() {
  var debug = this.debug;

  String.prototype.bindThis = function() {
    var a = this;
    return function(){
      this[a].apply(this,arguments);
    }.bindThis()
  };
  
}));
(sand.define("core/String/capitalize", function() {
  
  String.prototype.capitalize = function() {
    return (this.charAt(0).toUpperCase() + this.slice(1));
  };
  
}));
(sand.define("core/String/exec", ["core/Function/exec"], function() {
  var debug = this.debug;
  var fns = [{// order by mathematical priority
      symbol : "+", 
      fn : function(leftString,rightString){ 
          var str1 = leftString.exec()(this),
              str2 = rightString.exec()(this);
          //debug.log(str1,str2);
          if(isNaN(parseInt(str1)) || isNaN(parseInt(str2))){
            return str1+str2;
          }
          return (parseInt(str1)+parseInt(str2));
      } 
    },{
      symbol : "-", 
      fn : function(leftString,rightString){ 
         var str1 = leftString.exec()(this),
              str2 = rightString.exec()(this);
          if(isNaN(parseInt(str1)) || isNaN(parseInt(str2))){
            return  str1+"-"+str2;
          }
          return (parseInt(str1)-parseInt(str2));
      } 
    },{
      symbol : ".", 
      fn : function(leftString,rightString){ 
        var scope = this[leftString];
        return rightString.exec()(scope);
      } 
    }
  ];
  String.prototype.exec = function() {
    
    // fix to avoid for(var i in obj), that string is considered as an obj, this.toString() !== this
    var str = this.toString();
    
    //debug.log(this.toString());
    
    return function(sc){
      var scope = sc || this;
      for(var j = 0, l2 = fns.length; j<l2;j++){
        for (var i =0, l= str.length; i< l ; i++) {
          if(fns[j].symbol === str[i]){
            return fns[j].fn.call(scope || this, str.substr(0,i),str.substr(i+1));
          }
        }
      }
      var key = isNaN(parseInt(str)) ? str : parseInt(str);
      if(scope.length && typeof(scope) === "object") return scope[key];
      if(typeof(scope[key]) === "function"){
        return scope[key].bind(scope)();
      } 
      return scope[key] || str.toString();
    }.exec()
  };
  
}));
sand.define("core/String/indexesOf",function(){
  String.prototype.indexesOf = function(v){
    var i,current = this.concat(),dec=0,indexes= [];
    while((i = current.indexOf(v)) !== -1){
      indexes.push(i+dec);
      current = current.substr(0,i)+current.substr(i+1,current.length-i-1);
      dec++;
    }
    return indexes;
  }
});
(sand.define("core/String/isBlank", function() {
  
  String.prototype.isBlank = function() {
    return (/^[ ]*$/.test(this));
  };
  
}));
(sand.define("core/String/pluralize", function() {
  String.prototype.pluralize = function() {
    return this + "s";
  };
}));
(sand.define("core/String/safe", function() {
  
  String.prototype.safe = function() {
    return (this.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  }
  
}));
sand.define('core/String/shrink', function() {

  String.prototype.shrink = function(n, w) {
  	if (!w) w = 3;
    if (this.length < n) return this;
    return this.slice(0, n - (w + 3 + 1)) + '...' + this.slice(this.length - w, this.length);
  };

});(sand.define("core/String/singularize", function() {
  
  String.prototype.singularize = function() { // simply removes the last char atm
    return (this.substr(0, this.length-1));
  }
  
}));
(sand.define("core/String/uncapitalize", function() {
  
  String.prototype.uncapitalize = function() {
    return (this[0].toLowerCase()+this.substr(1, this.length-1));
  };
  
}));
sand.define('core/String/unsafe', function() {
  
  String.prototype.unsafe = function() {
    return this.replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\n/g, '<br />').replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&gt;/g, '>').replace(/&lt;/g, '<');
  }
  
});
sand.define("core/as", function() {
  
  return function(o, f) {
    return f(o);
  };
  
});
(sand.define("core/clone", function() {
  
  return function(o) { // clones an object (only lvl 1, see hardClone)
    var res = {};
    for (var i in o) if (o.hasOwnProperty(i)) res[i] = o[i];
    return res;
  }
  
}));
sand.define('dot', function() {

  return {
    set : function(o, attr, v) {
      var split = attr.split('.');

      for (var i = -1, n = split.length - 1; ++i < n; ) {
        if (!o[split[i]]) o[split[i]] = {};
        o = o[split[i]];
      }

      o[split[n]] = v;
    }
  }

});(sand.define("core/empty", function() {
  
  this.exports = function(o) { // checks if an object is empty of not
    var d = [], rd = {};
    for (var i in rd) if (rd.hasOwnProperty(i)) d.push(i);
    for (i in o) if (o.hasOwnProperty(i) && !d.has(i)) return false;
    return true;
  }
    
}));
(sand.define("core/extend", function() {
  
  return function(o) {
    if (o.prototype) o = o.prototype;
    for (var i = 1, n = arguments.length; i < n; i++) {
      var e = arguments[i].prototype || arguments[i];
      for (var j in e) if (e.hasOwnProperty(j)) {
        o[j] = e[j];
      }
    }
    return o;
  };
  
}));
(sand.define("core/AsyncStack", function() {
  
  var AsyncStack = function(cb) {
    this._fs = [];
    this.cb = cb;
  };

  AsyncStack.prototype = {
    add : function(fs) {
      this._fs.push(fs);
    },
    process : function() {
      if (this._fs.length) {
        this._fs.shift()(function() {
          this.process();
        }.bind(this));
      }
      else this.cb();
    }
  };
  
  this.exports = AsyncStack;
    
}));
(sand.define("core/arrayify", function() {
  
  this.exports = function(o) { // returns the array of an object ({ key : "a" } => ["a"])
    var res = [];
    for (var i in o) o.hasOwnProperty(i)&&res.push(o[i]);
    return (res);
  }
  
}));
(sand.define("core/close", function() {
  
  this.exports = function(toClose, fn) { 
    var c = toClose;
    if (!Core.helpers.isArray(c)) c = [c];
    return (function() {
        return (fn.apply({}, c.concat(Array.prototype.slice.call(arguments))))
    })
  }
  
}));
(sand.define("core/deepSmoothExtend", ['core/isArray'], function(r, module, isArray) {
  
  var f = function(o, p) {
    for (var i in p) if (p.hasOwnProperty(i)) {
      if (typeof(o[i]) === 'object' && !isArray(o[i])) {
        f(o[i], p[i]);
      }
      else {
        o[i] = p[i];
      }
    }
    return o;
  }
  return f;
  
}));
sand.define('core/each', function() {
  
  return function(o, f) {
    for (var i in o) if (o.hasOwnProperty(i)) {
      f(o[i], i);
    }
    return o;
  };
  
});
(sand.define("core/extend", function() {
  
  return function(o) {
    if (o.prototype) o = o.prototype;
    for (var i = 1, n = arguments.length; i < n; i++) {
      var e = arguments[i].prototype || arguments[i];
      for (var j in e) if (e.hasOwnProperty(j)) {
        o[j] = e[j];
      }
    }
    return o;
  };
  
}));
(sand.define("core/isArray", function() {
  
  this.exports = function(o) {
    return (typeof(o) === "object" && o && o.constructor.toString().indexOf("Array") !== -1);
  }
    
}));
(sand.define("core/merge", function() {
  
  this.exports = function(o, b) {
    var j = {};
    for (var i in b) if (b.hasOwnProperty(i)) j[i] = b[i];
    for (i in o) if (o.hasOwnProperty(i)) j[i] = o[i];
    return j;
  }
  
}));
sand.define('core/send', ['core/each'], function(r, module, each) {
  
  return function(o, m) {
    var args = Array.prototype.slice.call(arguments);
    args.shift();
    args.shift();
    if (typeof(m) === 'string') { // method
      each(o, function(e) {
        e[m].apply(e, args);
      });
    }
    else {
      each(o, function(e) {
        m.apply(e, args);
      });
    }
    return o;
  };
  
});
(sand.define("core/values", function() {
  
  return (function(o) {
    var r = [];
    for (var i in o) r.push(o[i]);
    return r;
  });
  
}));
(sand.define("core/hardClone", ["core/isArray"], function(r) {
  
  return function(obj) { // USE WITH CAUTION : clones recursively an object
    if (typeof(obj) !== 'object') return obj;
    if (!r.isArray(obj)) {
      var o = {};
      for (var i in obj) {
        if (obj.hasOwnProperty(i)) {
          var t = typeof(obj[i]);
          if(t === "string" || t === "number" || t === "boolean" || obj[i] === null)
            o[i] = obj[i];
          else // array or obj
            o[i] = arguments.callee(obj[i]);
        }
      }
      return o;
    }
    else {
      var a = [];
      for (var i = obj.length; i--; ) {
        var t = typeof(obj[i]);
        if(t === "string" || t === "number" || t === "boolean" || obj[i] === null)
          a[i] = obj[i];
        else // array or obj
          a[i] = arguments.callee(obj[i]);
      }
      return a;
    }
  }
    
}));
(sand.define("core/hardCloneProperties", ["core/hardClone"], function(r) {
  
  var hardClone = r.hardClone;
  
  return function(op, o) { // bit tricky, this creates a new object with the keys in op and the values of o
     var r = {};
     for (var i in op) {
       if (op.hasOwnProperty(i)) {
         r[i] = hardClone(o[i]);
       }
     }
     return r
   }
    
}));
(sand.define("core/isArray", function() {
  
  return function(o) {
    return (typeof(o) === "object" && o && o.constructor.toString().indexOf("Array") !== -1);
  }
    
}));
(sand.define("core/keys", function() {
  
  return (function(o) {
    var r = [];
    for (var i in o) r.push(i);
    return r;
  });
  
}));
sand.define('core/params', function() {

	var params = {};
	var reg = /(\?|&)([^=]*)=([^&$#]*)/g;

	var res;
	while (res = reg.exec(window.location.href)) {
		params[res[2]] = res[3];
	}

	return params;

});(sand.define("core/RegExp/match", function() {
    
  RegExp.prototype.match = function(str) {
    var res = [], result;
    while ((result = this.exec(str)) !== null) res.push(result);
    return res;
  };
  
}));
(sand.define("core/protos/string", [
    "core/extend"
  ],
  function(r) {
  
  var l = r,
    extend = l.extend;
    
  extend(String.prototype, {
    
    safe : function() {
      return (this.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    },
    
    pluralize : function() {
      return (this+"s");
    },
    
    uncapitalize : function() {
      return (this[0].toLowerCase()+this.substr(1, this.length-1));
    },

    isBlank : function() {
      /^[ ]*$/.test(this);
    },
    
    capitalize : function() {
      return (this.charAt(0).toUpperCase() + this.slice(1));
    },
      
    multiply : function(n) {
      var res = "";
      while(n--) res += this;
      return res;
    },
      
    isColor : function() { // checks if a string represents an hex color or not ("#abcdef" ...)
      var isHex = function(string) {
        string = string.substr(1, 6);
        for (var i = 6; i--; ) {
          i = i.toUpperCase();
          if (!(i === "1" || i === "2" || i === "3" || i === "4" || i === "5" || i === "6" || i === "7" || i === "8" || i === "9" || i === "A" || i === "B" || i === "C" || i === "D" || i === "E" || i === "F")) {
            return false;
          }
        }
        return true;
      }
      return (this.length === 7 && this[0] === "#" && isHex(this))
    },
    
    rgbToHex: function(){
        var a,r;
        r = /rgb\(\ ?([0-9]+)\ ?,\ ?([0-9]+)\ ?,\ ?([0-9]+)\ ?\)/;
        return (a= this.match(r)) && a.shift() && ("#"+a.collect(function(e){
              var t = parseInt(e).toString(16);
              if(!t[1]) t="0"+t;
              return t;
            }).join(""));
    },
    // as parseInt but without the unit "34KLJ".toNumber => false
    toNumber: function(){
      var n = parseInt(this);
      return (this.length === n.toString().length) && n;
    },

    singularize : function() { // simply removes the last char atm
      return (this.substr(0, this.length-1));
    },

    splice : function( idx, rem, s ) {
    return (this.slice(0,idx) + s + this.slice(idx + Math.abs(rem)));
    }
        
  });
  
}));
sand.define("core/setDot", function() {
  
  return function(o, str, value) {
    str = str.split('.');
    for (var i = -1, n = str.length; ++i < n; ) {
      console.log(o, str[i]);
      o = o[str[i]];
    }
    o = value;
  };
  
  //tomove & test
  return function(o, str) {
    str = str.split('.');
    for (var i = 0, n = str.length; ++i < n; ) {
      o = o[str[i]];
    }
    return o;
  };
  
});
sand.define('core/toArray', function() {
  
  return function(o) {
    var res = [];
    for (var i in o) res.push(o[i]);
    return res;
  };
  
});(sand.define("core/treeValue", function() {
  
  this.exports = function(string, scope) {
    var tree = string.split('.'), value = scope;
    for (var i = 0, n = tree.length; i < n; i++) {

      var lastChar = tree[i].charAt(tree[i].length-1);
      if (lastChar === ")") {
        var fnName = tree[i].substr(0, tree[i].indexOf('('));
        value = value[fnName]();
      }
      else if (lastChar === "]") {
        var valueName = tree[i].substr(0, tree[i].indexOf('['));
        value = value[fnName];
      }
      else {
        value = value[tree[i]];
      }

      if (!value) break;
    }
    return value || null;
  };
    
}));

