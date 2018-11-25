sand.define('DOM/UA', [
  'core/Array/where'
], function() {
  
  return navigator.userAgent;
  var UA;
  
  // when requiring it from node server script the global 'navigator is not defined'
  if(typeof(navigator) ==="undefined"){
    this.exports = "firefox";
    return;
  }
  var n = navigator.userAgent.toLowerCase();
  if (n.indexOf("ipad") !== -1) UA = "ipad";
  else if (n.indexOf('iphone') !== -1) UA = 'ipad';
  else if (n.indexOf('android') !== -1) UA = 'ipad';
  else if (navigator.platform && /iphone|ipad|ipod/i.exec(navigator.platform)) UA = 'ipad';
  else if (n.indexOf("chrome") !== -1 || n.indexOf("safari") !== -1) UA = "chrome"; // webkit
  else if (n.indexOf("firefox") !== -1) UA = "firefox";
  else if (n.indexOf("opera") !== -1) UA = "opera";
  else UA = "ie";
  
  //magictouch
  // if (Array.prototype.slice.call(navigator.plugins).map(function(o){return o.name;}).where(function(n){return n.match(/npTuioClient/)}).length > 0){
  //   UA = 'ipad';
  // }
  
  if (typeof(__UA) !== 'undefined') {
    console.log('FORCING UA');
    UA = __UA;
  }

  if (window.location.href.search('touch') !== -1) {
    UA = 'ipad';
  }

  //MCB
  /*var touch = 'ontouchstart' in document.documentElement;
  if (touch) {
    UA = 'ipad';
  }*/

  window.requestAnimationFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
              window.setTimeout(callback, 1000 / 60);
            };
  })();
  
  //innokoreturn 'ipad';
  return UA;
  
});
sand.define('DOM/caretAtEnd', [
], function() {

  return function(el) {
    el.focus();
    if (typeof window.getSelection != "undefined"
            && typeof document.createRange != "undefined") {
      var range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      var sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    } else if (typeof document.body.createTextRange != "undefined") {
      var textRange = document.body.createTextRange();
      textRange.moveToElementText(el);
      textRange.collapse(false);
      textRange.select();
    }
  }

});sand.define('DOM/clearSelection', function(r) {
	
	return function() {
		if (window.getSelection) {
		  if (window.getSelection().empty) {  // Chrome
		    window.getSelection().empty();
		  } else if (window.getSelection().removeAllRanges) {  // Firefox
		    window.getSelection().removeAllRanges();
		  }
		} else if (document.selection) {  // IE?
		  document.selection.empty();
		}
	};

});//TODO test compatibility with browsers

sand.define("DOM/createClass", function() {

  return function(selector, o) {
    var style = document.createElement('style');
    var content = '';
    content += selector + '{';
    for (var i in o) content += i + ':' + o[i] + ';';
    style.innerHTML = content + '}';
    document.head.appendChild(style);
  };

});
sand.define("DOM/ctrlaable", ["DOM/handle"], function(r) {

  var handle = r.handle;

  this.exports = function(el) { // Makes a HTMLInput get selected when you press "cmd+a" (Mac OS)
    var h = handle(el);
    h.keydown(function(e) {
      if (e.keyIdentifier && e.keyIdentifier === "Meta") {
        this._cmd = true;
      }
      if (this._cmd && e.keyCode === 65) { // cmd+a
        el.select();
      }
    }.bind(this));

    h.keyup(function(e) {
      if (e.keyIdentifier && e.keyIdentifier === "Meta") {
        this._cmd = false;
      }
    }.bind(this));
  };
    
});sand.define("DOM/devices/Chrome", [
    "DOM/devices/Firefox"
  ],
  function(r) {

  var Chrome = r.Firefox.extend({

    attachScroll : function() {
      this.node.addEventListener("mousewheel", function(e) {
        e = this.wrap(e);
        e.scale = (e.wheelDelta < 0) ? 2 : 0.5;
        this.fire("scroll", [e]);
      }.bind(this))
    }
  });
 
  return Chrome;
 
});sand.define('DOM/devices/Firefox', [
  'Seed'
],
  function(r) {

  var drag = null, detach = null;
  var mousemove;
  var id = 0, evtId = 0;

  var Firefox = r.Seed.extend({
    
    cancelDrag : function() {
      //console.log('cancelDrag', this.id);
      this.detach("mouseup");
      this.detach("mousemove");
      $(document).unbind('mousemove', mousemove);
      //document.onmousemove = null;
      document.onmouseup = null;
      drag = null;
      //console.log('cancelDrag end');
    },
    
    detachAll : function() {
      for (var i in this.attached) this.detach(i);
    },
      
    init : function(o) {
      this.id = ++id;
      var svg = o.svg, node = o.node;
      this.node = node;
      
      this.attached = {};
      
      if (svg) {
        this.attach = function(evt, f) {
          if (node.each) {
            node.each(function(n) {
              if (!n.attach) {
                n[evt](f);
              }
              else n.attach(evt, f);
            });
          }
          else {
            if (node.attach) node.attach(evt, f);
            else node[evt](f);
          }
          this[evt] = f;
        }.bind(this);

        this.detach = function(evt) {
          if (node.each) {
            node.each(function(n) {
              if (!n.detach) {
                //n[evt](function() {});
                n['un' + evt](this[evt]);
              }
              else n.detach(evt);
            }.bind(this));
          }
          else {
            if (node.detach) {
              node.detach(evt);
            }
            else node["un"+evt](this[evt]);
          }
        };
        this.svg = true;
      }
      else
      {
        this.attach = function(evt, f) {
          //nde["on"+evt] = f;
          
          this.attached[evt] = true;
          if(false && node["on"+evt]) {
            console.log('please dont happen!');
            var oldF = node["on"+evt];
            node["on"+evt] = (function() {
                var evt2 = evt;
                return function() {
                  var a = oldF.apply(this,arguments);
                  // respect return false convention
                  if(a !== false){
                    f.apply(this,arguments);
                  }
                }
            })();
          } else {
            if (node.each) {
              node.each(function(n) {
                n["on"+evt] = f;
              })
            }
            else node["on"+evt] = f;
          }
          
          this.attached[evt] = true;
        }.bind(this);

        this.detach = function(evt) {
          if (node.each) {
            node.each(function(n) {
              n["on"+evt] = null;
            });
          }
          else node["on"+evt] = null;
          
          this.attached[evt] = false;
        };
      }
      this.preventSelect = !!o.preventSelect;
      this.$listeners = {};
      this.$observers = [];
    },
    
    changeDraged : function(e, newHandle) {
      this.undrag(e);
      newHandle.draged(e);
    },

    wrapKey : function(e) {
    
      e = this.wrap(e);
      e.shift = (e.keyCode === 16);
      e.enter = (e.keyCode === 13);
      e.escape = (e.keyCode === 27);
      e.backspace = (e.keyCode === 8);
      return (e);
      
    },

    wrap : function(e) {
    
      e.halt = function() {
        e.stopPropagation();
        e.preventDefault();
      }.bind(this);
      e.xy = [e.clientX,e.clientY];
      //e.x = e.clientX; MCB
      //e.y = e.clientY;
      e.rightClick = ((e.which && e.which === 3) || (e.button && e.button == 2));

      return e;
    },

    scroll : {name : "DOMMouseScroll"},

    scrollWrap : function(f, scope) {
     var self = this;
     return function(e){
        f.call(scope, {scale : (e.deltaY > 0) ? 2 : 0.5, xy : [e.clientX, e.clientY], e : self.wrap(e)});
      };
    },

    attachScroll : function() {
      this.node.addEventListener("wheel", function(e) {
        e = this.wrap(e);
        e.scale = (e.deltaY > 0) ? 2 : 0.5;
        this.fire("scroll", [e]);
      }.bind(this) ,true);
    },

    undrag : function(e, o) {
      ++evtId;
      
      //console.log('undrag', this.id);
      
      e = this.wrap(e);
      if (!this.right) this.fire("drag:end", e);
      if (!this.moved && !this.right) {
        this.fire("click", e);
      }

      this.detach("mousemove");
      this.detach("mouseup");
      
      $(document).unbind('mousemove', mousemove);
      //document.onmousemove = null;
      document.onmouseup = null;

      drag = false;
      detach = false;
      
      if (this.right) return;
      o && o.end && o.end(e);
    },

    draged : function(e, o) {
      if (!o) o = {};
      o.force = true;
      this._drag(e, o);
      this.moved = true;
    },

    _drag : function(e, o) {
      if (drag) return; // && (!o || !o.force)
      
      console.log('DRAAAG', this.node);
      //console.log('drag', this.id);
      if (this.preventSelect) {
        // cursor text on Chrome (see http://stackoverflow.com/questions/2745028/chrome-sets-cursor-to-text-while-dragging-why)
        e.preventDefault();
      }
      
      drag = this.node;
      e = this.wrap(e);
      this.moved = false;

      var f1 = function(e) {
        if (this.right) return;
        e = this.wrap(e);
        this.moved = true;
        this.fire("drag:drag", e);

        e.halt();
      }.bind(this);
      
      mousemove = f1;
      
      $(document).bind('mousemove', mousemove);
      this.attach("mousemove", f1);

      document.onmouseup = function(e) {
        this.undrag(e, o);
      }.bind(this);
      
      this.attach("mouseup", function(e) {
        document.onmouseup(e);
        // world's worst hack
        // sometimes drags are overriden (see vertice & multipleSelect),
        // so the mouseup of the first attachment must be the one of the lastest, which is always document.onmouseup
        // most of the times this function is the same as this.undrag.bind(this)
      }.bind(this));
      
      if (e.which === 3 || e.rightClick) {
        this.right = true;
        this.fire('rightclick', e); // right click
      }
      else {
        this.right = false;
        this.fire("drag:start", e, o);
      }
      //MCB
      //e.halt();
    },


    //tomove
    isDescendantOf : function(parent) {
      var node = this.node;
      while (node !== null) {
        if (node == parent){
          return true;
        }
        node = node.parentNode;
      }
    },

    isAncestorOf : function(child) {
      var rec = function(node) {
        var childs = node.childNodes;
        for (var i = childs.length;i--;) {
          if (childs[i] === child || rec(childs[i])) {
            return true;
          }
        }
        return false;
      };
      return rec(this.node);
    },

    on : function(evtName, f, scope) {
      var group;

      if (evtName === "drag:start"||evtName === "drag:drag"||evtName==="drag:end") group = "drag";
      else group = evtName;

      if (!this["isListeningTo"+group.capitalize()]) {
        if (group === "drag") {
          this.attach("mousedown", this._drag.bind(this));
        }
        else if (evtName === "click") {
          if (typeof(this.isListeningToDrag) === "undefined") {
            this.attach("click", function(e) {
              e = this.wrap(e);
              this.fire("click", [e]);
            }.bind(this));
          }
        }
        else if (evtName === "dblclick") {
          if (typeof(this.isListeningToDrag) === "undefined") {
            this.attach("click", function(e) {
              e = this.wrap(e);
              var d = new Date();

              if (this._lastClickDate && d - this._lastClickDate < 250) { // dblclick
                if (this._clickTimeout) clearTimeout(this._clickTimeout);
                this.fire("dblclick", [e]);
                this._lastClickDate = null;
              }
              else {
                this._clickTimeout = setTimeout(function() {
                  this.fire("click", [e]);
                }.bind(this), 250);

                this._lastClickDate = new Date();

                this.fire('click?', [e]); // cbs will be called if click truly happens (& its not a double-clic)
              }
              e.halt();
            }.bind(this));
          }
          else {
            this.on("click", function(args) {

              var e = args[0];
              var d = new Date();

              if (this._lastClickDate && d - this._lastClickDate < 250) { // dblclick
                if (this._clickTimeout) clearTimeout(this._clickTimeout);
                this.fire("dblclick", [e]);
                this._lastClickDate = null;
              }

              this._lastClickDate = new Date();

            }.bind(this));
          }
        }
        else if (evtName === "over") {
          this.attach("mouseover", function(e) {
            e = this.wrap(e);
            this.fire("over", [e]);
          }.bind(this));
        } else if (evtName === "out") {
          this.attach("mouseout", function(e) {
            e = this.wrap(e);
            this.fire("out", [e]);
          }.bind(this));
        }
        else if (evtName === "keyDown") {
          this.attach("keydown", function(e) {
            e = this.wrapKey(e);
            this.fire("keyDown", [e]);
          }.bind(this));
        }
        else if (evtName === "keyUp") {
          this.attach("keyup", function(e) {
            e = this.wrapKey(e);
            this.fire("keyUp", [e]);
          }.bind(this));
        }
        else if (evtName === "scroll"){
          this.attachScroll();
        }
        else if (evtName === "contextmenu") {
          this.attach("contextmenu", function(e){
            e = this.wrap(e);
            this.fire("contextmenu", [e]);
          }.bind(this));
        } else if (evtName === "mousedown") {//mousedown can halt() parent drag
          this.attach("mousedown", function(e){
            e = this.wrap(e);
            this.fire("mousedown", [e]);
          }.bind(this));
        } else if (evtName === "mouseup") {//mouseup can halt() parent drag
          this.attach("mouseup", function(e){
            e = this.wrap(e);
            this.fire("mouseup", [e]);
          }.bind(this));
        }

        this["isListeningTo"+group.capitalize()] = true;
      }

      return (r.Seed.prototype.on.call(this, evtName, f, this));
    }

  });
  
  return Firefox;

});
sand.define('DOM/devices/Ipad',[
    'Seed',
    "core/clone",
    "core/hardClone",
    //"core/Array/minus",
    "core/Function/bind",
    "DOM/devices/Firefox",
    'touch/Gesture'
  ], function(r) {

  Array.prototype.dist = function() {
    return Math.sqrt(this[0] * this[0] + this[1] * this[1]);
  };

  var tolerance = 0;
  //temporary

  var touches = 0,
      number = 0,
      draggedEl = false,
      //TOMATURE:debug
      debug = this.debug&&this.debug.d,
      onTouchesMove = null,
      draggingEvts,
      onTouchesOff = null,
      drag = null;

  
  var Ipad = r.Seed.extend({
        
    '+init' : function(o) {
      this.number = number++;
      //console.log("building this.number", this.number);
      this.moved = false;
      
      var svg = o.svg, node = o.node;
      this.node = node;
      
      this.initEvents(svg,node);

      this.resetAttrs();
    },
  
    initEvents : function(svg,node) {
      if (svg) {
        this.attach = function(evt, f) {
          if (!node.attach) {
            node.attach(evt, f);
          }
          else node.attach(evt, f);
          this[evt] = f;
        }.bind(this);

        this.detach = function(evt) {
          if (!node.detach) {
            if (node['un' + evt]) node['un' + evt](this[evt]);
          }
          else node[evt](function() {});          
        }
      } else {
        this.attach = function(evt, f) {
          //node.addEventListener(evt, f, false);
          node['on' + evt] = f;
        };

        this.detach = function(evt) {
          node['on' + evt] = null; //node.removeEventListener(evt, f);
        }
      }

      //MCB every handle (the one used for keydown of document included) will have these events attached
      this.attach("touchstart", this._touchstart.bind(this));
      this.attach("touchmove", this._touchmove.bind(this));
      this.attach("touchend", this._touchend.bind(this));
      this.attach("touchcancel", this._touchend.bind(this));

      try {
        this.attach('change', function(e) {
          this.fire('change', [e]);
        }.bind(this));
      } catch(e) {
        //not onchange attachable
      }

      if (!svg) {
        this.attach('keydown', function(e) {
          this.fire('keydown', [e]);
        }.bind(this));

        this.attach('focus', function(e) {
          this.fire('focus', [e]);
        }.bind(this));
      }
    },
    
    baseDraggingAttrs : {
      dragOn : false,
      nTouches : 0,
      touches : [],
      distance : false,
      scale : 1,
      start : { // where do we start
        center : false,
        distance : false,
        centerPos : false
      },
      tr : [0,0],
      center : false
    },
    
    detachAll : function() {
      
    },
    
    
    // here, in this.params, the only real thing is touches we update other attr from 
    setAttrsFromTouches : function(touches){
      var n = touches.length,oldN = this.attrs.nTouches;
      if(n == 0) {
        this.resetAttrs();
        return;
      }
      
      var ts = touches[0] ? (touches[1] ? [touches[0],touches[1]] : [touches[0]]) : [];

      if(n == oldN) {
        
        this.setAttrsGeo(ts);
        return;
      } else {// a touche has been removed or added
       // console.log("before touch transfer : "+ts.length+"   n : "+n+ "   old N : "+oldN+" center "+this.attrs.start.center+"  tr :"+this.attrs.tr);
        
        this.touchesTransfer(ts);
        this.setAttrsGeo(ts);
        
       // console.log("after touch transfer : "+ts.length+"   n : "+n+ "   old N : "+oldN+" center "+this.attrs.start.center+"  tr :"+this.attrs.tr);
        return;
      }
      
    },
    
    resetAttrs : function() {
      this.attrs = r.hardClone(this.baseDraggingAttrs);
    },
    
    changeDraged : function(e, newHandle) {
      this._undrag(e);
      //console.log("chgDrag 1"+newHandle+newHandle.device);
      debug = true;
      newHandle.device.manageEvent(e,true);
      this.toDrag = newHandle.device;
    },
    
    // touchesTransfer is the main function of the touch device.
    //
    // when a user use 3 fingers (finger-a,finger-b,finger-c), we just consider the 2 first fingers,
    // if he removed finger-b of the two first fingers, we need to transfer the content of this.attrs, to fake that it had been created by finger-a and finger-c, we transfer the touches from [finger-a,finger-b] to [finger-a,finger-c],
    // it may also works for 4 fingers
    
    
    touchesTransfer : function(touchesAfter) {

      if(touchesAfter.length > 1){
      
        // keep the same scale by faking start distance :
        var distBefore = this.attrs.distance;
        
        var distAfter = this.getDistance(touchesAfter[0].pageX,touchesAfter[0].pageY,touchesAfter[1].pageX,touchesAfter[1].pageY);
        
        // 1/scale == start.distance/distance
        if(distBefore) {
          this.attrs.start.distance = this.attrs.start.distance/distBefore * distAfter;
        } else {
          //console.log("new distance is : "+distAfter);
          this.attrs.start.distance = distAfter;
        }
        
        var centerAfter = this.getCenter(touchesAfter[0].pageX,touchesAfter[0].pageY,touchesAfter[1].pageX,touchesAfter[1].pageY);
        
      } else {
        var centerAfter = [touchesAfter[0].pageX,touchesAfter[0].pageY];
        
      }
      
      // keep the same translation by faking start center
      var centerBefore = this.attrs.center;
     // console.log(centerBefore);
      if (centerBefore) {

        //  trBefore === trAfter
        // C1 - SC1 + (SC1 - SCP)*(1-S) === C2 - SC2 +(SC2-SCP)*(1-S)
        // SC2*(-1+(1-S)) === C1-C2 -SC1 + SC1*(-1+1-S)
        // S*SC2 === C2-C1 + S*SC1
        // SC2 = SC1 + (C2-C1)/S
        
        this.attrs.start.center = this.attrs.start.center.add(centerAfter.minus(centerBefore).multiply(1/(this.attrs.scale||1)));
        
      } else {
        this.attrs.dragOn = true;
        this.attrs.start.center = centerAfter;
        var jEl = r.jQ(this.node);
        //console.log(jEl+this.node+this.number);
        var off = jEl.offset()||[0,0];//[0,0] is for HTML Document
        
        try { //jEl svg bug
          this.attrs.start.centerPos = [(jEl.width()/2+off.left)||0,(jEl.height()/2+off.top)||0];
        } catch (e) {
          this.attrs.start.centerPos = [0,0];
        }

        

      }
      
    },
    
    
    // tches is a n-array with n>0
    setAttrsGeo : function (touches){
    
      // if there is more than 2 touches, we just consider the 2-first ones
      if(touches.length == 2){
      
        this.setDistanceAverageTranslationAndScale(touches);
        
      } else {// touches.length ==1
        //console.log("one touche"+this.attrs.scale);
        this.setTrAndCenter([touches[0].pageX,touches[0].pageY]);
        
      }

    },
    
    
    getDistance : function(x1,y1,x2,y2) {
      return Math.sqrt((x1-x2)*(x1-x2)+(y1-y2)*(y1-y2));
    },
    
    getCenter : function(x1,y1,x2,y2) {
      return [(x1+x2)/2,(y1+y2)/2]
    },
    
    // here touches is a 2-array
    setDistanceAverageTranslationAndScale : function(touches) {

      this.attrs.distance = this.getDistance(touches[0].pageX,touches[0].pageY,touches[1].pageX,touches[1].pageY);
      
      this.setTrAndCenter(this.getCenter(touches[0].pageX,touches[0].pageY,touches[1].pageX,touches[1].pageY));
      
      //console.log("chg this.attrs.scale  "+this.attrs.distance/this.attrs.start.distance);
      this.attrs.scale = this.attrs.distance/this.attrs.start.distance;

    },
    
    setTrAndCenter : function(point) {
    
      this.attrs.center = point;
      var st = this.attrs.start;
      this.attrs.tr = point.minus(st.center).add(st.center.minus(st.centerPos).multiply(1-(this.attrs.scale||1))).multiply(1/this.attrs.scale);
     // console.log("tr : "+this.attrs.tr+" scale : "+this.attrs.scale+"  centerPos : "+st.centerPos);
    },
    
    _undrag : function(e){
      draggedEl = false;
      draggingEvts && draggingEvts.un();
      draggingEvts = null;
      
      if(this._bounds && this._bounds["iScroll:end"]){
        this.fire("iScroll:end", [e]);
      } else {
        this.fire("drag:end", [e]);
      }
      
      this.resetAttrs();
      if(!this.moved) {
        this.fire("click",[e]);
        return;
      }

      this.moved = false;
    },
    
    _drag : function(e, o) {
      this._touchstart(e);
    },

    
    wrapTouches : function(e) {
    
      var res = e;

      res.touches = e.touches || [];
      
      res.x = this.attrs.center[0];
      res.y = this.attrs.center[1];
      res.xy = this.attrs.center;
      res.halt = function() {
          e.stopPropagation();
          e.preventDefault();
      };
      
      res.target = this.node;
      // Note : we used scaling instead of scale because of a weird bug on IPad
      res.scaling = this.attrs.scale;
      res.translate = this.attrs.tr;
      
      return res;
    },
    
    manageEvent : function(e, o) {
      var res = e;

      res.touches = e.touches || [];

      var n = res.touches.length ,oldN = this.attrs.nTouches;

      this.setAttrsFromTouches(res.touches||[]);
      this.attrs.nTouches = n;

      var evt = this.wrapTouches(e);
      
      //console.log(oldN, n, this.number);
      
      if(oldN == 0 && n > 0) {
        this._drag(evt, o);
      }

      if(oldN > 0 && n == 0) {
        this.onOff(evt, o);
      }
      
      if(oldN == n && n !== 0) {
        this.onChange(evt, o);
      }
      return evt;
    },
    
    //call in the draged device 
    onChange : function(e) {
        //console.log("onChange", this.number, this.toDrag._bounds && this.toDrag._bounds["iScroll:change"]);
        if(this.toDrag._bounds && this.toDrag._bounds["iScroll:change"]){
          //debug&&console.log("fire scroll change"+evt.scale+"  : "+this.attrs.scale);
          this.toDrag.fire("iScroll:change", [e]);
        } else {
          this.toDrag.fire("drag:drag", [e]);
        }
    },

    addTouches : function() {

    },
    
    _touchstart : function(e, o) {
      e.halt = e.halt || function() {
        e.stopPropagation();
        e.preventDefault();
      };

      this.fire('mousedown', [e, o]);
      
      if (this.noDrag) return;

      if (['INPUT', 'TEXTAREA'].include(e.target.tagName)) {
        e.stopPropagation();
        return;
      }

      if (drag) {
        return;
      }

      drag = this;
      e.xy = [e.changedTouches[0].clientX || e.changedTouches[0].pageX, e.changedTouches[0].clientY || e.changedTouches[0].pageY];

      this.gesture = new r.Gesture({ touches : e.changedTouches, e : e, noRightClick : this.noRightClick });

      this._sc = e.xy;
      /*this._timeout = setTimeout(function() { //rightclick
        this.fire('rightclick', [e]);
        this._cancel = true;
        document.ontouchmove = null;
        document.ontouchend = null;
        drag = null;
      }.bind(this), 500);*/

      this._cancel = false;

      var touchstart = function(e) {
        if (e.target !== document.getElementById('shift-button')) { //hardcode
          this.gesture.touchstart(e.changedTouches);
        }
        e.stopPropagation(); //MCB, used to be in if
      }.bind(this);

      var touchmove = function(e) {
        this.gesture.touchmove(e.changedTouches, e);
        e.stopPropagation();
      }.bind(this);

      var touchend = function(e) {
        this.gesture.touchend(e.changedTouches, e);
        e.stopPropagation();
      }.bind(this);

      document.addEventListener('touchstart', touchstart, true);
      document.addEventListener('touchmove', touchmove, true);
      document.addEventListener('touchend', touchend, true);
      document.addEventListener('touchcancel', touchend, true);

      //e.preventDefault(); //MCB //

      this.gesture.on('translate', function(tr, e) {
        var evt = {}; // we clone it because scale uses the same event & it will trigger 2 translation if we use a reference
        for (var i in e) {
          evt[i] = e[i];
        }
        evt.translation = tr;
        evt.scale = 1;
        evt.xy = [e.touches[0].clientX || e.touches[0].pageX, e.touches[0].clientY || e.touches[0].pageY];
        evt.center = this.gesture.center;

        evt.stopPropagation = function() {
        	e.stopPropagation();
        }
        evt.preventDefault = function() {
        	e.preventDefault();
        }

        evt.isTouchEvent = true;

        this.fire('drag:drag', [evt])
      }.bind(this), this);

      this.gesture.on('scale', function(scale, e) {
        var clone = {};
        for (var i in e) clone[i] = e[i];
        clone.scale = scale;
        clone.center = this.gesture.center;
        clone.xy = [e.touches[0].clientX || e.touches[0].pageX, e.touches[0].clientY || e.touches[0].pageY];

        clone.stopPropagation = function() {
        	e.stopPropagation();
        }
        clone.preventDefault = function() {
        	e.preventDefault();
        }

        clone.isTouchEvent = true

        this.fire('drag:drag', [clone]);
      }.bind(this), this);

      this.gesture.on('longtap', function() {
        this.fire('rightclick', [e]);
      }.bind(this), this);

      this.gesture.on('tap', function() {
        this.fire('click', [e]);
      }.bind(this), this);

      this.gesture.on('destroy', function(e) {
        drag = null;
        document.removeEventListener('touchstart', touchstart, true);
        document.removeEventListener('touchmove', touchmove, true);
        document.removeEventListener('touchend', touchend, true);
        document.removeEventListener('touchcancel', touchend, true);

        e.xy = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
        this.fire('drag:end', [e]);
      }.bind(this), this);

      this.fire('drag:start', [e, o]);
    },
    
    _touchmove : function(e) {
      if (this._cancel || (drag !== this)) return;
      //console.log('GO' + this.number);
      e.xy = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];

      if (e.touches.length > 1) {

      }

      if (this._timeout) {
        if (this._sc.minus(e.xy).dist() > tolerance) { 
          clearTimeout(this._timeout);
          this._timeout = null;
          this.fire('drag:drag', [e]);
        }
      }
      else {
        this.fire('drag:drag', [e]);
      }

      e.preventDefault();
    },

    preventRightClick : function() {
      this.gesture.preventRightClick();
    },

    preventRightClick : function() {
      this.gesture.preventRightClick();
    },
    
    _touchend : function(e) {
      if (this._cancel || (drag !== this)) return;
      document.ontouchmove = null;
      document.ontouchend = null;
      e.xy = [e.changedTouches[0].clientX, e.changedTouches[0].clientY];

      drag = null;
      //console.log('drag to null touchend');

      if (this._timeout) { //no move
        clearTimeout(this._timeout);
        this._timeout = null;

        this.fire('click', [e]);
      }
      this.fire('drag:end', [e]);

      //e.preventDefault(); //MCB //

      /*
      e.preventDefault();
      e.stopPropagation();*/
    },

    wrapKey : function(e) {
    
      e = this.wrap(e);
      e.shift = (e.keyCode === 16);
      e.enter = (e.keyCode === 13);
      console.log(e.keyCode);
      return (e);
      
    },

    wrap : function(e) {
      e.halt = function() {
        e.stopPropagation();
        e.preventDefault();
      };

      if (e.changedTouches) { // not happening for a keyboard input
        e.xy = e.xy || [e.changedTouches[0].clientX, e.changedTouches[0].clientY];
      }

      return e;
    },
    
    cancelDrag : function(e, cancel) {
      if (this._timeout) {
        clearTimeout(this._timeout);
        this._timeout = null;
      }

      drag = null;
      //console.log('canceDrag?to:' + cancel.to);
      if (cancel && cancel.to) {
        cancel.to.draged(e);
      }
    },
    
    draged : function(e, o) {
      if (!o) o = {};
      o.force = true;
      if (drag) {
        drag.cancelDrag();
        drag = null;
      }

      this._touchstart(e, o);
    }
  });

  return Ipad;

});sand.define("DOM/devices/Opera", function(devices, app) {
  
  // TO DO recode me
  return;
  var l = app;
  
  l.devices.opera = l.devices.firefox.extend({

    wrap : function(e) {
      var d = {};
      d.halt = function() {
        e.stopPropagation();
        e.preventDefault();
      }.bind(this)
      d.xy = [e.clientX,e.clientY];
      d.x = e.clientX;
      d.y = e.clientY;
      d.rightClick = ((e.which && e.which === 3) || (e.button && e.button == 2));

      return d;
    },
  
    attachScroll : function() {
      this.node.addEventListener("mousewheel", function(e) { // hack, Opera does not allow e to be modified
        var d = this.wrap(e);
        d.scale = (e.wheelDelta < 0) ? 2 : 0.5;
        this.fire("scroll", [d]);
      }.bind(this))
    }
  });
    
}, { requires : "devices.firefox" });sand.define("DOM/devices/ie", function(devices, app){
  
  //TO DO recode me
  return;
  
  var l = app;
  
  l.devices.ie = l.devices.firefox.extend({

    attachScroll : function()
    {
      this.node.attachEvent("onmousewheel", function(e) {
        e = this.wrap(e);
        e.scale = (e.wheelDelta < 0) ? 2 : 0.5;
        this.fire("scroll", [e]);
      }.bind(this))
    },

    wrap : function(e)
    {
      e = e || window.event;
      e.halt = function() {
        e.returnValue = false;
        e.cancelBubble = true;
      }.bind(this)
      e.xy = [e.clientX,e.clientY];

      return e;
    }

  });
    
}, { requires : "devices.firefox" });sand.define("DOM/devices/tuio", function(devices, app){
  
  //TO DO => recode me
  return;
  
  var l = app;
  
  app.number = 0;
  app.registeredTouches = [];
  
  if (l.UA === "ipad" || l.UA === "tuio") { //hack
    document.addEventListener("touchstart", function() {
       //e.preventDefault();
    });
    document.addEventListener("touchmove", function(e) { //MCB
      e.preventDefault();
      // cancels scroll & zoom default behavior
    });
  }
  
  l.devices.tuio = l.MVC.Controller.extend({
    
    binds : ["_touchstart", "_touchmove", "_touchend", "_drag"],
    
    "+init" : function(o) {
      console.log("new tuio device");
      
      this.id = o.id;
      this.number = app.number++;
      
      var svg = o.svg, node = o.node;
      //this._bounds = this._bounds || {};
      if (svg) {
        this.attach = function(evt, f) {
          node[evt](f);
        }
      }
      else {
        this.attach = function(evt, f) {
          node.addEventListener(evt, f);
        }
        this.detach = function(evt, f) {
          node.removeEventListener(evt, f);
        }
      }
        
      this.attach("touchstart", this._touchstart);
      this.attach("touchmove", this._touchmove);
      this.attach("touchend", this._touchend);
      this.attach("touchcancel", this._touchend);
    },
    
    changeDraged : function(e, newHandle) {
      this.fire("drag:end", [e]);
      newHandle.device._touchstart(e); // simulates touchstart
      this.toDrag = newHandle.device;
    },
    
    _drag : function(e) {
      if (l.drag) return;
      l.drag = this;
      this.toDrag = this;
      this.moved = true;
    },
    
    _touchstart : function(e) {
      console.log("touchstart"+this.id);
      e = this.wrap(e);
      
      if (!this.intouch) { // NOTE first touch (can have first touch with touches.length > 1)
        this.intouch = true;
        this.moved = false;
        this._drag(e);
        
        this._tmpScale = 1;
        this._tmpTr = [0, 0];

        this._sp = e.xy; // starting pos
        
        this.fire("down", [e]);
        this.fire("drag:start", [e]);
      }
      
      else {
        this._tmpScale = this._tmpScale || 1;
        this._sd = e.dist;

      //if (this._lastTr) {
        this._tmpTr = this._lastTr || [0, 0];
        this._sp = e.xy;
      //}
      }
      
      //MCB
      //e.halt();
    },
    
    _touchmove : function(e) {
      console.log("touchmove"+this.id);
      if (l.drag !== this) return;
      e = this.wrap(e);
      
      this.moved = true;

      if (e.dist) { // 2 fingers
        if (this._sd) {
          e.scale = this._tmpScale*e.dist/this._sd;
          this._lastScale = e.scale;
        }
        else {
          this._sd = e.dist;
        }
      }
      else {
        e.scale = this._tmpScale;
      }

      if (this._sp && this._tmpTr) {
        e.translate = this._tmpTr.add(e.xy.minus(this._sp));
      }
      this._lastTr = e.translate;
      
      console.log("sd"+this._sd);
      console.log("e.dist"+e.dist);
      console.log("tmpScale"+this._tmpScale);
      console.log("lastScale"+this._lastScale);
      console.log("startingpos"+JSON.stringify(this._sp));
      console.log("xy"+JSON.stringify(e.xy));
      console.log("tmptr"+JSON.stringify(this._tmpTr));
      console.log("translate"+JSON.stringify(e.translate));

      this.toDrag.fire("iScroll:change", [e]);
      //MCBthis.toDrag.fire("drag:drag", [e]);

      e.halt();
    },
    
    _touchend : function(e) {
      console.log("touchend"+this.id+",moved?"+this.moved);
      e = this.wrap(e);
      
      if (this.moved) {
        if (e.touches.length) { // new scroll
          this._sp = e.xy;
          this._sd = e.dist;
          this._tmpScale = this._lastScale;
          this._tmpTr = this._lastTr;
        }
        else { // end of scroll
          this.intouch = false;
          e.end = true;
          this._sp = false;
          this._sd = false;
          this._tmpTr = null;
          this._tmpScale = null;
          this._lastScale = null;
          this._lastTr = null;
          this.moved = false;
          this.fire("drag:end", [e]);
          this.fire("iScroll:end", [e]);
          
          l.drag = false;
        }
      }
      
      else {
        e.xy = this._sp;
        this.intouch = false;
        this._sp = false;
        this._sd = false;
        this._tmpTr = null;
        this._tmpScale = null;
        this._lastScale = null;
        this._lastTr = null;
        this.moved = false;
      }
      
      // bit ugly but seems necessary, change with caution
      this.onOver(e);
    },
    
    draged : function(e) {
      this._drag(e);
      this.moved = true;
    },
      
    onOver : function(e) {
      try {  
      console.log(this.id);
      console.log("bounds over?"+JSON.stringify(this._bounds));
      if (this._bounds.over) {
        if (this._overed) {
          this._overed = false;
          this.fire('out', [e]);
          //this.fire("click", [e]);
          this._clicked = true;
        }
        else if (this._clicked) {
          this._clicked = false;
          this.fire("out", [e]);
        }
        else {
          this._overed = true;
          this.fire("over", [e]);
        }
      }
      else {
        this.fire("click", [e]);
      }
      } catch (e) { console.log(e); }
    },
    
    wrapKey : function(e) {
      
      var keyCode = e.keyCode;
      e = this.wrap(e);
      e.shift = (keyCode === 16);
      e.enter = (keyCode === 13);

      return (e);
    },
      
    wrap : function(e) {
      var res = {};

      res.touches = e.touches || [];

      if (e.touches)
      {
        var n, x = 0, y = 0;

        if (n = e.touches.length) 
        {
          for (var i = n; i--; )
          {
            x += e.touches[i].pageX;
            y += e.touches[i].pageY;
          }

          res.x = x/n;
          res.y = y/n;
          res.xy = [res.x, res.y];

          if (e.touches.length > 1)
          {
            res.dist = Math.sqrt(Math.pow(e.touches[0].pageX-e.touches[1].pageX, 2)+Math.pow(e.touches[0].pageY-e.touches[1].pageY, 2));
          }
          //else e.falsh = true;
        }
      }

      res.halt = function() {
          e.stopPropagation();
          e.preventDefault();
        };

      return (res);
    }
 
  });
    
}, { requires : ["devices"] });
sand.define("DOM/document", ["DOM/handle", "DOM/state", "Seed"], function(r) {

  var handle = r.handle,
    h = handle(document);

  return new (r.Seed.extend({
    
    _downs : [],
    _ups : [],

    on : function(evt, f, scope){
      return h.on(evt, f, scope);
    },
    
    keyup : function(f) {
      this._ups.push(f);
    },
    
    keydown : function(f) {
      this._downs.push(f);
    },
    
    clear : function() {
      this._downs = [];
      this._ups = [];
      /*h = handle(document); // we clear the bindings
      
      [
        'onmousemove',
        'onmouseup',
        'onmousedown',
        'onmouseover',
        'onkeyup',
        'onkeydown',
        'onkeypress'
      ].each(function(e) { document[e] = null; }); // and also the previous event attachments*/
    },
    
    "+init" : function() {
      this.state = r.state;
      // We replace old state module for retrocompatibility
      try {
        h.keydown(function(e) {
          if (e.shift) {
            r.state.shifted = true;
          }
          else if (e.keyCode === 91 || e.keyCode === 17) { // cmd, ctrl
            r.state.ctrled = true;
          }
          else if (e.keyCode === 32) { // space
            r.state.space = true;
          }
          else if (e.keyCode === 8) { // backspace
            e.backspace = true;
          }
          else if (e.keyCode > 47 && e.keyCode < 106) e.char = true;
          else if (e.keyCode === 37) e.fleche = 'left';
          else if (e.keyCode === 38) e.fleche = 'top';
          else if (e.keyCode === 39) e.fleche = 'right';
          else if (e.keyCode === 40) e.fleche = 'bottom';
          else if (e.keyCode === 27) e.escape = true;
          
          this._downs.each(function(f) {
            f(e);
          });
        }.bind(this));

        h.keyup(function(e) {
          if (e.shift) {
            r.state.shifted = false;
          }
          else if (1 || e.keyCode === 91) {
            r.state.ctrled = false;
          }
          
          if (e.keyCode === 32) {
            r.state.space = false;
          }
          
          this._ups.each(function(f) {
            f(e);
          });
        }.bind(this));
      } catch(e) {
      }
    }
  }));
  
});sand.define('DOM/fake', function() {
  
  var fake = document.createElement("div");
  fake.style.visibility = "hidden";
  fake.style.position = 'absolute';
  return document.body.appendChild(fake);

});sand.define("DOM/getImageSize", [
  "DOM/handle",
  // "DOM/fake",
  ], function(r) {
    
  this.exports = function(src, cb) {
    var fake = document.createElement("div");
    fake.style.visibility = "hidden";
    fake.style.position = 'absolute';
    document.body.appendChild(fake);

    if (typeof(src) === 'string') {
      var img = document.createElement("img");
      img.setAttribute("src", src);
      fake.appendChild(img);
    }
    else {
      var img = src;
      var faked = true;
    }
    if (img.complete) {
      cb(img.offsetWidth, img.offsetHeight);
      faked || fake.removeChild(img);
      $(fake).remove();
    }
    else {
      img.onload = function() {
        cb(img.offsetWidth, img.offsetHeight);
        faked || fake.removeChild(img);

        $(fake).remove();
      }
    }
  } 
    
});
sand.define("DOM/getPos", function(r) {

  // it's important that everyone is "at least in position : relative"

  return function(el, parent) { // Gets the [x, y] offset of an element to the specified parent, or body if none defined
    var offset = [el.offsetLeft, el.offsetTop];
    if (el.parentNode === parent) return offset;
    while ((el = el.parentNode) && typeof(el.offsetLeft) !== "undefined") {
      offset = [offset[0]+el.offsetLeft, offset[1]+el.offsetTop];
      if (el.parentNode === parent) {
        break;
      }
    }
    return offset;
  }
    
});sand.define('DOM/getTextSize', function() {

  return function(str, size, family, cb) {
    var div = document.body.appendChild(document.createElement('div'));
    div.style.visibility = 'hidden';
    div.style.zIndex = -1;
    div.style.fontFamily = family;
    div.style.cssFloat = 'left';
    div.style['float'] = 'left';
    div.style.fontSize = (typeof(size) === 'number' ? size + 'px' : size);

    div.innerHTML = str;
    cb(div.offsetWidth);
    document.body.removeChild(div);
  };

});sand.define("DOM/handle", [
    "core/extend",
    "DOM/UA",
    "DOM/devices/*",
    "core/String/capitalize"
  ],
  function(r) {
  
  var extend = r.extend,
    UA = r.UA;

  var device = r.devices.Pointer;//UA.capitalize()];
  //r.devices[UA.capitalize()];
  var handles = [];

  extend(Function.prototype, {
    wrap : function(scope) {
      var self = scope ? this.bind(scope) : this;
      return (function(e) {
        return self(device.prototype.wrap(e));
      });
    },
      
    wrapKey : function(scope) {
      var self = scope ? this.bind(scope) : this;
      return (function(e) {
        return self(device.prototype.wrapKey(e));
      });
    }
  });
  
  var handle = function(node,o) {
    if (node.node && node.node.toString() === '[object HTMLDivElement]') { //MCB //WCB if toString does not return this value
      node = node.node;
    }
    this.node = node;
    this.device = new (device)(extend(o || {}, { node : this.node }));
  };

  var handler = function(node, o) {
    // prevent conflict between handles
    for (var i = handles.length; i--; ) {
      if (handles[i].node === node) {
        return handles[i];
      }
    }

    var _h = new handle(node, o);
    handles.push(_h);
    return _h;
  };

  handle.prototype = {

    changeDraged : function(e, newHandle) {
      this.device.changeDraged(e, newHandle);
    },

    draged : function(e, o) { // simulates an already initialized drag
      this.device.draged(e, o);
    },

    undrag : function(e) {
      this.device.undrag(e, { canceled : true });
    },

    drag : function(o,t) {
      if (typeof(o) !== "object") return;
      if (o.start) {
        if (this._start) this._start.un();
        this._start = this.device.on("drag:start", function(e, opts) {
          var ret = o.start(e, opts);
          if (ret && ret.cancel) {
            this.device.cancelDrag(e, ret.cancel);
            if (typeof(ret.cancel) === 'function') ret.cancel();
          }
        }.bind(this), this);
      }
      if (o.drag) {
        if (this._drag) this._drag.un();
        this._drag = this.device.on("drag:drag", function(e) {
          o.drag(e);
        }.bind(this), this);
      }
      if (o.end) {
        if (this._end) this._end.un();
        this._end = this.device.on("drag:end", function(e) { o.end(e); }.bind(this), this);
      }
      if (o.right) {
        this._right = this.device.on('rightclick', function(e) {
          o.right(e);
        }, this);
      }
      
      //caution
      return {
        un : function() {
          this._start.un();
          this._drag.un();
          this._end.un();
          this._right.un();
          this._start = this._drag = this._end = null;
        }.bind(this)
      };
    },

    over : function(f) {
      if (this._over) this._over.un();
      this._over = this.device.on("over", function(e) { f(e); }.bind(this));
    },

    out : function(f) {
      if (this._out) this._out.un();
      this._out = this.device.on("out", function(e) { f(e); }.bind(this));
    },

    down : function(f) {

    },

    up : function(f) {

    },

    click : function(f) {
      return (this.device.on('click', function(e) { f(e); }.bind(this)));
      //this.attach(this.config.click, this.config.dragWrap(f, this), false, "click");
    },

    dblclick : function(f) {
      if (UA == 'ipad') {
        console.log('[ERROR] you should not try to bind a double-click on the ipad');
        return;
      }
      this.device.$listeners.dblclick = [];
      return (this.device.on("dblclick", function(e) { f(e); }.bind(this)));
    },

    iScroll : function(o) {
      var subs = [this.device.on("iScroll:change", function(args) {
        o.change(args[0]);
        args[0].halt();
      }.bind(this)),
      this.device.on("iScroll:end", function(args) {
        o.end(args[0]);
        args[0].halt();
      }.bind(this))];

      return ({
        un : function() {
          subs[0].un();
          subs[1].un();
        }.bind(this)
      });
    },

    scroll : function(f) { // f({ scale : , xy })
      this.device.$listeners.scroll = [];
      this.device.on("scroll", function(args) { f(args[0]); }.bind(this));
    },

    keydown : function(f) {
      return this.device.on("keydown", function(e) { f(e); }.bind(this));
    },

    keyup : function(f) {
      return this.device.on("keyup", function(e) { f(e); }.bind(this));
    },

    on : function(evtName, f, scope) {
      return this.device.on(evtName, function() { f.apply(this, arguments); }.bind(this), scope);
    }

  };
  
  return handler;
    
});
sand.define("DOM/hexToRgb", function(r) {

  this.exports = function(hex) {
    return ([(hex & 0xff0000) >> 16,
      (hex & 0x00ff00) >> 8,
      hex & 0x0000ff]);
  }
    
});(sand.define("DOM/hsvToRgb", function(r) {

  this.exports = function(h,s,v) {

            var s = s / 100,
                 v = v / 100;

            var hi = Math.floor((h/60) % 6);
            var f = (h / 60) - hi;
            var p = v * (1 - s);
            var q = v * (1 - f * s);
            var t = v * (1 - (1 - f) * s);

            var rgb = [];

            switch (hi) {
                case 0: rgb = [v,t,p];break;
                case 1: rgb = [q,v,p];break;
                case 2: rgb = [p,v,t];break;
                case 3: rgb = [p,q,v];break;
                case 4: rgb = [t,p,v];break;
                case 5: rgb = [v,p,q];break;
            }

            var r = Math.min(255, Math.round(rgb[0]*256)),
                g = Math.min(255, Math.round(rgb[1]*256)),
                b = Math.min(255, Math.round(rgb[2]*256));

            return [r,g,b];

        }
    
}));
sand.define("DOM/lighten", ["DOM/rgbToHsv", "DOM/hexToRgb", "DOM/rgbToHex", "DOM/hsvToRgb"], function(r) {
  
  var hexToRgb = r.hexToRgb,
    rgbToHex = r.rgbToHex,
    rgbToHsv = r.rgbToHsv,
    hsvToRgb = r.hsvToRgb;

  this.exports = function(hex, v) {
    if (hex.search('rgb') === -1) {
      hex = parseInt("0x"+hex.substr(1, hex.length - 1), 16);
      var rgb = hexToRgb(hex);
    }
    else {
      var reg = /\((.*)\)/.exec(hex)[1];
      rgb = reg.split(',').map(function(str) {
        return parseInt(str.trim())
      });
    }
    //var hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
    //rgb = hsvToRgb(hsv[0], hsv[1]+v, hsv[2]+v);
    
    //--- from http://stackoverflow.com/questions/141855/programmatically-lighten-a-color
    var redistribute_rgb = function(rgb) {
      var r = rgb[0], g = rgb[1], b = rgb[2];
      var threshold = 255.999
      var m = rgb.max();
      if (m <= threshold) return [r, g, b];
      var total = r + g + b;
      if (total >= 3 * threshold) return [255, 255, 255];
      var x = (3 * threshold - total) / (3 * m - total)
      var gray = threshold - x * m;
      return [gray + x * r, gray + x * g, gray + x * b];
    }
    //---
    
    rgb = redistribute_rgb(rgb.multiply((100 + v) / 100));

    return ("#"+rgbToHex(rgb[0], rgb[1], rgb[2]));
    
    /*def redistribute_rgb(r, g, b):
    threshold = 255.999
    m = max(r, g, b)
    if m <= threshold:
        return int(r), int(g), int(b)
    total = r + g + b
    if total >= 3 * threshold:
        return int(threshold), int(threshold), int(threshold)
    x = (3 * threshold - total) / (3 * m - total)
    gray = threshold - x * m
    return int(gray + x * r), int(gray + x * g), int(gray + x * b)*/
  }
    
});sand.define('DOM/onclickout', ['DOM/parents', 'DOM/UA'], function(r) {

	return function(target, cb, additionalConditon) {
		var _stop = function(e) {
			var ret = cb(e);
			if (ret !== false) {
				document.body.removeEventListener('pointerdown', _f, true);
			}
		};

		var _f = function(e) {
			if (e.target !== target && !r.parents(target, e.target)) {
				if (typeof(additionalConditon) === 'function') {
					if (!additionalConditon(e)) return;
				}
				_stop(e);
			}
		};

		document.body.addEventListener('pointerdown', _f, true);

		return {
			un : function() {
				document.body.removeEventListener('pointerdown', _f, true);
			}
		}
	};

});sand.define('DOM/onfontsloaded', function() {

	var loaded = {};

	return function(fonts, callback) {
    var loadedFonts = 0;

		var check = function() {
			if (loadedFonts === fonts.length) {
				callback();
			}
		};

		var load = function(font, callback) {
	    var node = document.createElement('span');
	    // Characters that vary significantly among different fonts
	    node.innerHTML = 'giItT1WQy@!-/#';
	    // Visible - so we can measure it - but not on the screen
	    node.style.position      = 'absolute';
	    node.style.left          = '-10000px';
	    node.style.top           = '-10000px';
	    // Large font size makes even subtle changes obvious
	    node.style.fontSize      = '300px';
	    // Reset any font properties
	    node.style.fontFamily    = 'sans-serif';
	    node.style.fontVariant   = 'normal';
	    node.style.fontStyle     = 'normal';
	    node.style.fontWeight    = 'normal';
	    node.style.letterSpacing = '0';
	    document.body.appendChild(node);

	    // Remember width with no applied web font
	    var width = node.offsetWidth;

	    //if (font === 'proxima-light') console.log('referenceW', width);

	    node.style.fontFamily = font;

	    var interval;
	    function checkFont() {
	        // Compare current width with original width
	        //if (font === 'proxima-light') console.log('newW?', node.offsetWidth);
	        if (node && node.offsetWidth != width) {
	            ++loadedFonts;
	            loaded[font] = true;
	            node.parentNode.removeChild(node);
	            clearInterval(interval);
	            setTimeout(
	            	callback,
	            1000);
	        }
	    };

	    interval = setInterval(checkFont, 50);
		};

    for (var i = 0, l = fonts.length; i < l; ++i) {
    	if (loaded[fonts[i]]) loadedFonts++;
    	else load(fonts[i], check);
    }

    if (loadedFonts === fonts.length) callback(true);
	};


});sand.define('DOM/parents', function() {
  return function(el, e) {
    while (e) {
      if (e.parentNode === el) return true;
      e = e.parentNode;
    }
    return false;
  };
});sand.define("DOM/rgbToHex", function(r) {

  this.exports = function(r,g,b) {
      var hexVal = function(n) {
              var data = "0123456789ABCDEF";
              if (n==null) return "00";
              n=parseInt(n); 
              if (n==0 || isNaN(n)) return "00";
              n=Math.round(Math.min(Math.max(0,n),255));
              return data.charAt((n-n%16)/16) + data.charAt(n%16);
      }
      return hexVal(r)+hexVal(g)+hexVal(b);
  }
    
});sand.define("DOM/rgbToHsv", function(r) {

  this.exports = function(r, g, b) {

            var r = (r / 255),
                 g = (g / 255),
                 b = (b / 255);	

            var min = Math.min(Math.min(r, g), b),
                max = Math.max(Math.max(r, g), b),
                delta = max - min;

            var value = max,
                saturation,
                hue;

            // Hue
            if (max == min) {
                hue = 0;
            } else if (max == r) {
                hue = (60 * ((g-b) / (max-min))) % 360;
            } else if (max == g) {
                hue = 60 * ((b-r) / (max-min)) + 120;
            } else if (max == b) {
                hue = 60 * ((r-g) / (max-min)) + 240;
            }

            if (hue < 0) {
                hue += 360;
            }

            // Saturation
            if (max == 0) {
                saturation = 0;
            } else {
                saturation = 1 - (min/max);
            }

            return [Math.round(hue), Math.round(saturation * 100), Math.round(value * 100)];
        }
    
});sand.define('DOM/select', function() {
  
  var off = function() {
    document.onselectstart = function(e) {
      e.halt();
      return false;
    }.wrap();
  };
  
  return {
    on : function() {
      document.onselectstart = null;
    },
    off : off
  }
  
});
// from http://stackoverflow.com/questions/3286595/update-textarea-value-but-keep-cursor-position

sand.define('DOM/selection', function() {
  
  var offsetToRangeCharacterMove = function(el, offset) {
    return offset - (el.value.slice(0, offset).split("\r\n").length - 1);
  };
  
  return {
    getInputSelection : function(el) {
      var start = 0, end = 0, normalizedValue, range,
          textInputRange, len, endRange;

      if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
          start = el.selectionStart;
          end = el.selectionEnd;
      } else {
          range = document.selection.createRange();

          if (range && range.parentElement() == el) {
              len = el.value.length;
              normalizedValue = el.value.replace(/\r\n/g, "\n");

              // Create a working TextRange that lives only in the input
              textInputRange = el.createTextRange();
              textInputRange.moveToBookmark(range.getBookmark());

              // Check if the start and end of the selection are at the very end
              // of the input, since moveStart/moveEnd doesn't return what we want
              // in those cases
              endRange = el.createTextRange();
              endRange.collapse(false);

              if (textInputRange.compareEndPoints("StartToEnd", endRange) > -1) {
                  start = end = len;
              } else {
                  start = -textInputRange.moveStart("character", -len);
                  start += normalizedValue.slice(0, start).split("\n").length - 1;

                  if (textInputRange.compareEndPoints("EndToEnd", endRange) > -1) {
                      end = len;
                  } else {
                      end = -textInputRange.moveEnd("character", -len);
                      end += normalizedValue.slice(0, end).split("\n").length - 1;
                  }
              }
          }
      }

      return {
          start: start,
          end: end
      };
    },

    setInputSelection : function(el, startOffset, endOffset) {
        if (typeof el.selectionStart == "number" && typeof el.selectionEnd == "number") {
            el.selectionStart = startOffset;
            el.selectionEnd = endOffset;
        } else {
            var range = el.createTextRange();
            var startCharMove = offsetToRangeCharacterMove(el, startOffset);
            range.collapse(true);
            if (startOffset == endOffset) {
                range.move("character", startCharMove);
            } else {
                range.moveEnd("character", offsetToRangeCharacterMove(el, endOffset));
                range.moveStart("character", startCharMove);
            }
            range.select();
        }
      },

      saveSelection : function(containerEl) {
          var charIndex = 0, start = 0, end = 0, foundStart = false, stop = {};
          var sel = rangy.getSelection(), range;

          function traverseTextNodes(node, range) {
              if (node.nodeType == 3) {
                  if (!foundStart && node == range.startContainer) {
                      start = charIndex + range.startOffset;
                      foundStart = true;
                  }
                  if (foundStart && node == range.endContainer) {
                      end = charIndex + range.endOffset;
                      throw stop;
                  }
                  charIndex += node.length;
              } else {
                  for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                      traverseTextNodes(node.childNodes[i], range);
                  }
              }
          }

          if (sel.rangeCount) {
              try {
                  traverseTextNodes(containerEl, sel.getRangeAt(0));
              } catch (ex) {
                  if (ex != stop) {
                      throw ex;
                  }
              }
          }

          return {
              start: start,
              end: end
          };
      },
  restoreSelection : function(containerEl, savedSel) {
    var charIndex = 0, range = rangy.createRange(), foundStart = false, stop = {};
    range.collapseToPoint(containerEl, 0);

    function traverseTextNodes(node) {
        if (node.nodeType == 3) {
            var nextCharIndex = charIndex + node.length;
            if (!foundStart && savedSel.start >= charIndex && savedSel.start <= nextCharIndex) {
                range.setStart(node, savedSel.start - charIndex);
                foundStart = true;
            }
            if (foundStart && savedSel.end >= charIndex && savedSel.end <= nextCharIndex) {
                range.setEnd(node, savedSel.end - charIndex);
                throw stop;
            }
            charIndex = nextCharIndex;
        } else {
            for (var i = 0, len = node.childNodes.length; i < len; ++i) {
                traverseTextNodes(node.childNodes[i]);
            }
        }
    }

    try {
        traverseTextNodes(containerEl);
    } catch (ex) {
        if (ex == stop) {
            rangy.getSelection().setSingleRange(range);
        } else {
            throw ex;
        }
    }
},

  clear : function() {
    if (window.getSelection) {
      if (window.getSelection().empty) {  // Chrome
        window.getSelection().empty();
      } else if (window.getSelection().removeAllRanges) {  // Firefox
        window.getSelection().removeAllRanges();
      }
    } else if (document.selection) {  // IE?
      document.selection.empty();
    }
  }
  };
  
});sand.define("DOM/state", ["DOM/handle"], function(r) {
  
  return {};
  var handle = r.handle;

  var h = handle(document), s = {};
  return s;
  h.keydown(function(e) {
    if (e.shift) {
      s.shifted = true;
    }
    else if (e.keyCode === 91) { // ctrl
      s.ctrled = true;
    }
  });

  h.keyup(function(e) {
    if (e.shift) {
      s.shifted = false;
    }
    else if (1 || e.keyCode === 91) {
      s.ctrled = false;
    }
  });
  
  
  this.exports = s;
    
});sand.define('DOM/toDOM', [
], function(r, module) {
  
  var toDOM = function(obj, scope, force) {
    if (!obj) return null;

    if (obj.nodeName) return obj; // it is already a DOM element

    if (typeof(obj) === 'string') return toDOM({ tag : obj }, scope, force);
    if (obj.length) return toDOM({ tag : obj[0], children : obj[1] }, scope, force); // it is an array, like ['table', [['tr']]], we format the array to a JSON

    // at this point (hopefully :-) we have a formated JSON
    // we parse the implicit declarations ({ tag : '#some-id.some-class.some-other-class' } -> { tag : 'div', attr : { id : 'some-id' ...}})
    var parse = {}, cl;
    if (!obj.tag) parse.tag = 'div'; // defaults to div
    else {
      // we search for innerHTML
      var split  = obj.tag.split(/ /);
      var firstPart = split.shift();
      if (split.length) parse.innerHTML = split.join(' ');

      if (obj.innerHTML) parse.innerHTML = obj.innerHTML;
      
      split = firstPart.split(/\.|#/);

      parse.tag = split.shift() || 'div'; // defaults to div
      if (split.length) {
        parse.attr = obj.attr || {};

        // we search for classes
        var cls = '',
          reg = /\.([^\.$#]*)/g;
        while (cl = reg.exec(firstPart)) cls += cl[1] + ' ';
        if (cls) parse.attr['class'] = cls.slice(0, cls.length - 1);

        // we search for id
        var id = /#([^\.$]*)/.exec(firstPart);
        if (id) parse.attr.id = id[1];
      }
    }

    parse.attr = parse.attr || obj.attr;
    parse.innerHTML = parse.innerHTML || obj.innerHTML;

    // at this point we have an almost explicit format
    var el = document.createElement(parse.tag);
    obj.as = obj.as || obj.label;

    if (parse.attr) for (var attr in parse.attr) el.setAttribute(attr, parse.attr[attr]);
    if (obj.as) scope[obj.as] = el; // we reference the element in the scope
      
    if (!obj.as && scope && (parse.attr && typeof(parse.attr['class']) === 'string') && ((force && (cl = parse.attr['class'].split(' ')[0])) || !scope[cl = parse.attr['class'].split(' ')[0]])) scope[cl] = el; // implicit declaration of label

    if (typeof(parse.innerHTML) !== 'undefined') el.innerHTML = parse.innerHTML;

    if (obj.events) {
      var handle = module.require('DOM/handle');
      if (typeof(handle) === 'function') {
        handle = handle(el);
        for (var evt in obj.events) handle.on(evt, obj.events[evt]);
      }
      else sand.require('DOM/handle', function(_r) {
        handle = _r.handle(el);
        for (var evt in obj.events) handle.on(evt, obj.events[evt]);
      });
    }
    else if (obj.events) {
      for (var evt in obj.events) el['on' + evt] = obj.events[evt];
    }

    if (obj.style) {
      if (typeof(obj.style) === 'string') el.setAttribute('style', obj.style);
      else for (var style in obj.style) el.style[style] = obj.style[style];
    }

    if (obj.children) for (var k = -1, l = obj.children.length; ++k < l; ) if (cl = toDOM(obj.children[k], scope, force)) el.appendChild(cl);

    return el;
  };

  return toDOM;
    
});
// Generated by CoffeeScript 1.9.2
(function() {
  sand.define('DOM/devices/Pointer', ['Seed', 'touch/Gesture', 'DOM/devices/Firefox', 'DOM/devices/Chrome', 'DOM/devices/Opera'], function(r) {
    window.drag = null;
    return r.Seed.extend({
      '+options': {
        node: null,
        svg: false
      },
      wrapKey: function(e) {
        e = this.wrap(e);
        e.shift = e.keyCode === 16;
        e.enter = e.keyCode === 13;
        e.escape = e.keyCode === 27;
        e.backspace = e.keyCode === 8;
        return e;
      },
      attach: function() {
        if (!this.svg) {
          return this.node.addEventListener.apply(this.node, arguments);
        } else {
          return this.node.node.addEventListener.apply(this.node.node, arguments);
        }
      },
      getDevice: function() {
        var n;
        n = navigator.userAgent.toLowerCase();
        if (n.indexOf('chrome') !== -1 || n.indexOf('safari') !== -1) {
          return r.Chrome;
        }
        if (n.indexOf("opera") !== -1) {
          return r.Opera;
        }
        return r.Firefox;
      },
      attachScroll: function() {
        var f;
        f = (function(_this) {
          return function(e, delta, deltaX, deltaY) {
            e.preventDefault();
            if (deltaY) {
              e = _this.wrap(e);
              e.scale = deltaY < 0 ? 2 : 0.5;
              return _this.fire('scroll', [e]);
            }
          };
        })(this);
        return $(this.node).bind('mousewheel', f);
      },
      on: function(evt) {
        if (evt === 'scroll') {
          this.attachScroll();
        }
        return r.Seed.prototype.on.apply(this, arguments);
      },
      '+init': function() {
        this.dragPointermove = this.dragPointermove.bind(this);
        this.dragPointerup = this.dragPointerup.bind(this);
        // $(this.node).attr('touch-action', 'none');
        this.attach('keydown', (function(_this) {
          return function(e) {
            e = _this.wrapKey(e);
            return _this.fire('keydown', e);
          };
        })(this));
        this.attach('keyup', (function(_this) {
          return function(e) {
            e = _this.wrapKey(e);
            return _this.fire('keyup', e);
          };
        })(this));
        this.attach('focus', (function(_this) {
          return function(e) {
            return _this.fire('focus', e);
          };
        })(this));
        this.attach('blur', (function(_this) {
          return function(e) {
            return _this.fire('blur', e);
          };
        })(this));
        this.attach('dragover', (function(_this) {
          return function(e) {
            e = _this.wrap(e);
            return _this.fire('dragover', e);
          };
        })(this));
        this.attach('dragenter', (function(_this) {
          return function(e) {
            e = _this.wrap(e);
            return _this.fire('dragenter', e);
          };
        })(this));
        this.attach('dragleave', (function(_this) {
          return function(e) {
            e = _this.wrap(e);
            return _this.fire('dragleave', e);
          };
        })(this));
        this.attach('pointerup', (function(_this) {
          return function(e) {
            e = _this.wrap(e);
            _this.fire('pointerup', e);
            return _this.fire('mouseup', e);
          };
        })(this), false);
        return this.attach('pointerdown', (function(_this) {
          return function(e) {
            var clear, move, moved, now;
            e = _this.wrap(e);
            if (e.rightClick) {
              _this.fire('rightclick', e);
              return;
            }
            if (_this.$listeners['drag:start'] || _this.$listeners['drag:drag'] || _this.$listeners['drag:end']) {
              return _this._drag(e);
            } else {
              _this.fire('mousedown', e);
              now = new Date().getTime();
              moved = false;
              move = function() {
                return moved = true;
              };
              clear = function() {
                return document.removeEventListener('pointermove', move, true);
              };
              if (now - _this._lastClickDate < 250) {
                clear();
                clearTimeout(_this._clickTimeout);
                _this.fire('dblclick', e);
                return _this._lastClickDate = null;
              } else {
                document.addEventListener('pointermove', move, true);
                _this._clickTimeout = setTimeout(function() {
                  clear();
                  if (!moved) {
                    return _this.fire('click', e);
                  }
                }, 250);
                _this._lastClickDate = new Date().getTime();
                return _this.fire('click?', e);
              }
            }
          };
        })(this), false);
      },
      wrap: function(e) {
        e.halt = function() {
          e.stopPropagation();
          return e.preventDefault();
        };
        e.rightClick = e.which === 3 || e.button === 2;
        if (typeof e.clientX === 'number') {
          e.xy = [e.clientX, e.clientY];
        } else {
          e.xy = [e.pageX, e.pageY];
        }
        return e;
      },
      cancelDrag: function(e, cancel) {
        this.undrag(e, {
          canceled: true
        });
        if (cancel != null ? cancel.to : void 0) {
          return cancel.to.draged(e);
        }
      },
      preventRightClick: function() {
        return true;
      },
      dragPointermove: function(e) {
        if (this.right) {
          return;
        }
        e = this.wrap(e);
        this.moved = true;
        this.fire('drag:drag', e);
        return e.halt();
      },
      dragPointerup: function(e) {
        return this.undrag(e);
      },
      undrag: function(e, o) {
        var now, ref;
        e = this.wrap(e);
        this.fire('drag:end', e);
        e.stopPropagation();
        this.gesture = null;
        document.body.removeEventListener('pointerdown', this.pointerdown, true);
        document.body.removeEventListener('pointermove', this.pointermove, true);
        document.body.removeEventListener('pointerup', this.pointerend, true);
        document.body.removeEventListener('pointercancel', this.pointerend, true);
        if (!(o != null ? o.canceled : void 0)) {
          if (!this.moved || ((ref = this.fullTr) != null ? ref.dist() : void 0) < 20) {
            now = new Date().getTime();
            if (now - this._lastClickDate < 250) {
              if (this._clickTimeout) {
                clearTimeout(this._clickTimeout);
              }
              this.fire('dblclick', e);
              this._lastClickDate = null;
            } else {
              this._clickTimeout = setTimeout((function(_this) {
                return function() {
                  return _this.fire('click', e);
                };
              })(this), 250);
              this._lastClickDate = new Date().getTime();
              this.fire('click?', e);
            }
          }
        }
        window.drag = null;
        return;
        if (!this.right) {
          this.fire('drag:end', e);
        }
        if (!this.moved && !this.right) {
          now = new Date().getTime();
          if (now - this._lastClickDate < 250) {
            if (this._clickTimeout) {
              clearTimeout(this._clickTimeout);
            }
            this.fire('dblclick', e);
            this._lastClickDate = null;
          } else {
            this._clickTimeout = setTimeout((function(_this) {
              return function() {
                return _this.fire('click', e);
              };
            })(this), 250);
            this._lastClickDate = new Date().getTime();
            this.fire('click?', e);
          }
        }
        document.body.removeEventListener('pointermove', this.dragPointermove, false);
        document.body.removeEventListener('pointerup', this.dragPointerup, false);
        return window.drag = null;
      },
      _drag: function(e, o) {
        var fullRotation, fullScale, xy;
        if (window.drag) {
          return;
        }
        fullScale = 1;
        this.fullTr = [0, 0];
        fullRotation = 0;
        this.gesture = new r.Gesture({
          touches: [
            {
              clientX: e.clientX,
              clientY: e.clientY,
              identifier: e.pointerId
            }
          ]
        });
        xy = this.gesture.center;
        e.xy = xy;
        this.moved = false;
        window.drag = this;
        this.gesture.on('translate', (function(_this) {
          return function(tr, e) {
            _this.fullTr = _this.fullTr.add(tr);
            xy = xy.add(tr);
            e.xy = xy;
            e.halt = function() {
              e.stopPropagation();
              return e.preventDefault();
            };
            _this.fire('drag:drag', e);
            return _this.fire('translate', tr, _this.fullTr);
          };
        })(this), this);
        this.gesture.on('scale', (function(_this) {
          return function(scale, e) {
            fullScale *= scale;
            return _this.fire('scale', scale, fullScale, e);
          };
        })(this), this);
        this.gesture.on('rotate', (function(_this) {
          return function(rotation) {
            fullRotation += rotation;
            return _this.fire('rotate', rotation, fullRotation);
          };
        })(this), this);
        this.gesture.on('destroy', (function(_this) {
          return function(e, o) {
            return _this.undrag(e, o);
          };
        })(this), this);
        this.pointerdown = (function(_this) {
          return function(e) {
            _this.fire('touchadd', _this.gesture.touches.last, _this.gesture.touches);
            _this.gesture.touchstart([
              {
                clientX: e.clientX,
                clientY: e.clientY,
                identifier: e.pointerId
              }
            ], e);
            return e.stopPropagation();
          };
        })(this);
        this.pointermove = (function(_this) {
          return function(e) {
            _this.moved = true;
            _this.gesture.touchmove([
              {
                clientX: e.clientX,
                clientY: e.clientY,
                identifier: e.pointerId
              }
            ], e);
            return e.stopPropagation();
          };
        })(this);
        this.pointerend = (function(_this) {
          return function(e) {
            _this.gesture.touchend([
              {
                clientX: e.clientX,
                clientY: e.clientY,
                identifier: e.pointerId
              }
            ], e);
            return e.stopPropagation();
          };
        })(this);
        document.body.addEventListener('pointerdown', this.pointerdown, true);
        document.body.addEventListener('pointermove', this.pointermove, true);
        document.body.addEventListener('pointerup', this.pointerend, true);
        document.body.addEventListener('pointercancel', this.pointerend, true);
        this.fire('drag:start', e, o);
        this.fire('mousedown', e);
        return e.stopPropagation();
      },
      draged: function(e, o) {
        if (drag === this) {
          return;
        }
        o || (o = {});
        o.force = true;
        if (typeof drag !== "undefined" && drag !== null ? drag.gesture : void 0) {
          drag.gesture.fire('destroy', e, {
            canceled: true
          });
        }
        window.drag = null;
        this._drag(e, o);
        return this.moved = true;
      }
    });
  });

}).call(this);
