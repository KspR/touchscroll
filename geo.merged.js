sand.define('Geo/Point', [
  'core/isArray',
  'Geo/Ref'
], function(r) {
  
  var Point = function(options, ref) {
    if (typeof(options.x) !== "undefined") {
      this.x = options.x;
      this.y = options.y;
    }
    else if (options.position) {
      this.x = options.position[0];
      this.y = options.position[1];
    }
    else {
      this.x = options[0];
      this.y = options[1];

      this.ref = ref;
    }
    
    if (options.ref) {
      this.ref = options.ref || ref;
    }
    
    if (options.refName) {
      console.log('%c [ERROR] Point.js, options.refName is revoked', 'background: #222; color: #bada55');
    }
    
    if (!this.ref) this.ref = r.Ref.db;
  };
            
  Point.prototype = {
    
    isPoint : true,
    
    getValue : function() {
      return ([this.x, this.y]); 
    },
    
    inRef : function(ref) {
      if (!ref || !ref.isRef) {
        console.log('%c [ERROR] Illegal parameter to inRef', 'background: #222; color: #bada55');
      }
      
      // we assume at this point we always have two different refs
      // if its not the case we are gonna do some useless additional operations, but it might be less costly than a ref check test
      var oRef = this.ref;
      var nRef = ref;

      var newO = nRef.origin;
      var oldO = oRef.origin;

      var dO = oldO.minus(newO);

      return (new Point({ x : (dO[0] + this.x/oRef.factor) * nRef.factor, y : (dO[1] + this.y/oRef.factor) * nRef.factor, ref : nRef }));
    },
    
    multiply : function(f) {
      return (new Point({ x : this.x * f, y : this.y * f, ref : this.ref }));
    },
    
    add : function(p2){
      var p2Bis;
      if(r.isArray(p2)){
        //global
        p2Bis = (new Point({x : p2[0], y : p2[1], ref : this.ref }));
      } else {
        p2Bis = p2.inRef(this.ref);
      }
      return (new Point({ x : this.x + p2Bis.x, y : this.y +p2Bis.y, ref : this.ref }));
    },
    
    minus : function(p2){
      var p2Bis;
      if(r.isArray(p2)){
        p2Bis = (new Point({x : p2[0], y : p2[1], ref : this.ref }));
      } else {
        p2Bis = p2.inRef(this.ref);
      }
      return (new Point({ x : this.x - p2Bis.x, y : this.y - p2Bis.y, ref : this.ref }));
    },
    
    clone : function() {
      return (new Point({ x : this.x, y : this.y, ref : this.ref }));
    },
    
    round : function(){
      return (new Point({ x : Math.round(this.x), y : Math.round(this.y), ref : this.ref }));
    }
  }
  
  return Point;
  
});
sand.define('Geo/R4', [
  'Geo/Point',
  'Geo/Seg'
], function(r) {

  var Seg = r.Seg;

  var R4 = function(options) {
    var a = options;
    if (a.segX) { // 2 segs
      this.segX = a.segX;
      this.segY = a.segY;
    }
    else if (a.isRect) { // a rect
      this.segX = new Seg(a.segX.c1, a.segX.c2);
      this.segY = new Seg(a.segY.c1, a.segY.c2);
    }
    else if (a.p1) {// 2 points
      this.segX = new Seg(a.p1[0], a.p2[0]);
      this.segY = new Seg(a.p1[1], a.p2[1]);
    }
    else {
      if (a.center) { // center and size
        var c = a.center; var s = a.size;
        var halfW = s[0]/2;
        var halfH = s[1]/2;
        this.segX = new Seg(c[0] - halfW, c[0] + halfW);
        this.segY = new Seg(c[1] - halfH, c[1] + halfH);
      }
      else if (a.width) { // left, top, width, height
        this.segX = new Seg(a.left, a.left + a.width);
        this.segY = new Seg(a.top, a.top + a.height);
      }
      else { // [[][]]  
        this.segX = new Seg(a[0][0], a[0][0]+a[1][0]);
        this.segY = new Seg(a[0][1], a[0][1]+a[1][1]);
      }
    }
    this.value = this.getValue();
  };
    
  R4.prototype = {
    
    isR4: true,
    
    points : function() {
      // in direct sens
      return [
        new r.Point({ x: this.segX.c1, y: this.segY.c1 }),
        new r.Point({ x: this.segX.c1, y: this.segY.c2 }),
        new r.Point({ x: this.segX.c2, y: this.segY.c2 }),
        new r.Point({ x: this.segX.c2, y: this.segY.c1 })
      ];
    },

    minus : function(v) {
      var res = this.clone();
      res.segX.c1 += v;
      res.segY.c1 += v;
      res.segX.c2 -= v;
      res.segY.c2 -= v;
      return res;
    },
    
    setWidth : function(w, o) {
      this.segX.setSize(w, o);
    },
    
    setHeight : function(h, o) {
      this.segY.setSize(h, o);
    },
    
    merge : function(r, margin) {
      var res = this.clone();
      margin = margin || 0;
      if (res.segX.c1 > r.segX.c1) res.segX.c1 = r.segX.c1 - margin;
      if (res.segX.c2 < r.segX.c2) res.segX.c2 = r.segX.c2 + margin;
      if (res.segY.c1 > r.segY.c1) res.segY.c1 = r.segY.c1 - margin;
      if (res.segY.c2 < r.segY.c2) res.segY.c2 = r.segY.c2 + margin;
      return res;
    },
    
    translate : function(v) {
      var res = this.clone();
      res.segX.c1 += v[0];
      res.segX.c2 += v[0];
      res.segY.c1 += v[1];
      res.segY.c2 += v[1];
      return res;
    },
    
    expand : function(v) {
      var res = this.clone();
      if (typeof(v) === 'number') {
        res.segX.c1 -= v;
        res.segX.c2 += v;
        res.segY.c1 -= v;
        res.segY.c2 += v;
      }
      else {
        res.segX.c1 -= v[0];
        res.segX.c2 += v[0];
        res.segY.c1 -= v[1];
        res.segY.c2 += v[1];
      }
      return res;
    },
    
    isIn : function(r) { // should and can be optimised
      return ((this.segX.c1 > r.segX.c1) &&
        (this.segX.c1 < r.segX.c2) &&
        (this.segX.c2 > r.segX.c1) &&
        (this.segX.c2 < r.segX.c2) &&
        (this.segY.c1 > r.segY.c1) &&
        (this.segY.c1 < r.segY.c2) &&
        (this.segY.c2 > r.segY.c1) &&
        (this.segY.c2 < r.segY.c2));

      return (r.contains.bind(r).for(this.getPoints()));
    },
    
    forcedIn : function(r) {
      var res = this.clone();
      if (res.segX.c1 < r.segX.c1) {
        res.segX.translate(r.segX.c1 - res.segX.c1);
      }
      if (res.segX.c2 > r.segX.c2) {
        res.segX.translate(r.segX.c2 - res.segX.c2);
      }
      if (res.segY.c1 < r.segY.c1) {
        res.segY.translate(r.segY.c1 - res.segY.c1);
      }
      if (res.segY.c2 > r.segY.c2) {
        res.segY.translate(r.segY.c2 - res.segY.c2);
      }
      return res;
    },
    
    getPoints : function() {
      var v = this.getValue();
      return ([v[0], v[0].add(v[1])]);
    },
    
    setCenter : function(p) {
      this.segX.setMiddle(p[0]);
      this.segY.setMiddle(p[1]);

      return this;
    },
        
    contains : function(p) {
      return (this.segX.contains(p[0]) && this.segY.contains(p[1]));
    },
        
    add : function(p) {
      if(p.isPoint) {
        p[0] = p.x;
        p[1] = p.y;
      }
      return (this.move({vector : [-p[0],-p[1]]})) 
    },
        
    equals : function(r) {
      if(r.isR4) {
        return (r.segX.equals(this.segX) && r.segY.equals(this.segY));
      }
      return (r[0][0] === this.segX.c1 && r[0][1] === this.segY.c1 && r[1][0] === this.segX.getLength() && r[1][1] === this.segY.getLength());
    },

    getSize : function() {
      return this.getValue()[1];
    },
            
    getCenter : function() {
      return ([this.segX.getMiddle(), this.segY.getMiddle()]) 
    },
            
    getIntersectionWith : function(r)  {
      return (( this.segX.c2 <= r.segX.c1 || this.segX.c1 >= r.segX.c2 || this.segY.c2 <= r.segY.c1 || this.segY.c1 >= r.segY.c2 ) ? [0,0] : new R4({ segX : new Seg( (this.segX.c1 > r.segX.c1) ? this.segX.c1 : r.segX.c1, (this.segX.c2 < r.segX.c2) ? this.segX.c2 : r.segX.c2 ), segY : new Seg( (this.segY.c1 > r.segY.c1) ? this.segY.c1 : r.segY.c1, (this.segY.c2 < r.segY.c2) ? this.segY.c2 : r.segY.c2) })); 
    },
        
        scale : function(factor, add) // scale function should not be called by move({scale:}), MNS
        {
          if (factor) {
            this.segX.scale(factor);
            this.segY.scale(factor);
          }
          else {
            this.segX.c1 -= add;
            this.segX.c2 += add;
            this.segY.c1 -= add;
            this.segY.c2 += add;
          }
          
          return this;
        },
            
        withSize : function(size)
        {
            return (new R4({ centeredRect : [this.getCenter(), size]}));
        },
          
        getValue : function()
        {
            return ([[this.segX.c1, this.segY.c1],[this.segX.getLength(), this.segY.getLength()]])
        },

        clone : function()
        {
            return (new R4({ segX : new Seg(this.segX.c1, this.segX.c2), segY : new Seg(this.segY.c1, this.segY.c2) }));
        },
        
         setPosition : function(p)
        {
           var l = this.segX.length();
           this.segX.c1 = p[0];
           this.segX.c2 = p[0] + l;
           
           l = this.segY.length();
           this.segY.c1 = p[1];
           this.segY.c2 = p[1] + l;
        },
        
        setSize : function(s)
        {
           this.segX.c2 = this.segX.c1 + s[0];
           this.segY.c2 = this.segY.c1 + s[1];
           
           return (this);
        },
        
        setRect : function(r)
        {
           this.segX.c1 = r.segX.c1;
           this.segX.c2 = r.segX.c2;
           this.segY.c1 = r.segY.c1;
           this.segY.c2 = r.segY.c2;
           
           return (this);
        },
        
        round: function(options)
        {
            var sX = this.segX.round(), sY = this.segY.round();
            if (options && options.override)
            {
                this.segX = sX;
                this.segY = sY;
                return (this);
            }
            return (new (this.constructor)(this.getValue()));
        },
        
        squared : function()
        {
            var minL = Math.min(this.segX.length(), this.segY.length());
            return (new t.R4({ centeredRect : [this.getCenter(), [minL, minL]]}));
        }
        
    };
    
    return R4;
    
});sand.define('Geo/Rect', [
  'Geo/R4',
  'core/extend',
  'Geo/Seg',
  'Geo/Point',
  'Geo/Ref'
], function(r) {

  var R4 = r.R4,
    extend = r.extend,
    Seg = r.Seg;

  var Rect = function(options, ref) {
    R4.call(this, options);

    if (options.refName || (ref && !ref.isRef)) {
      console.log('%c [ERROR] Rect.js, options.refName is revoked', 'background: #222; color: #bada55');
    }
    
    ref = ref || options.ref;

    if (!ref) {
      ref = r.Ref.db; // defaults to db ref, shared between modules
    }
    
    this.ref = ref;
  };


  extend(Rect.prototype, R4.prototype,{

    isRect : true,

    inRef : function(ref, options) {
      options = options || {};
      
      if (!ref.isRef) {
        console.log('%c [ERROR] Rect.js, Illegal call of inRef', 'background: #222; color: #bada55');
      }

      var oRef = this.ref;
      var nRef = ref;

      var nOrigin = nRef.origin;
      var nFactor = nRef.factor;

      //var rounded = options.rounded || true;

      var nSegX, nSegY;

      var oFactor = oRef.factor;
      var oOrigin = oRef.origin;

      if(typeof(oFactor) === 'number')
      {
          oFactor = [oFactor, oFactor];
      }
       if(typeof(nFactor) === 'number')
       {
           nFactor = [nFactor, nFactor];
       }

      var dFactor = [nFactor[0]/oFactor[0], nFactor[1]/oFactor[1]];

      var dOrigin = [oFactor[0]*(nOrigin[0]-oOrigin[0]), oFactor[1]*(nOrigin[1]-oOrigin[1])]; // new origin

      if (options.override) {
        this.segX.add(-dOrigin[0]);
        this.segY.add(-dOrigin[1]);
        this.segX.multiply(dFactor[0]);
        this.segY.multiply(dFactor[1]);
        this.ref = ref;
      }
      else {
        nSegX = new Seg(this.segX.c1 - dOrigin[0], this.segX.c2 - dOrigin[0]); nSegX.multiply(dFactor[0]);
        nSegY = new Seg(this.segY.c1 - dOrigin[1], this.segY.c2 - dOrigin[1]); nSegY.multiply(dFactor[1]);
        return new Rect({ segX : nSegX, segY : nSegY }, ref)
      }
    },

    withSize : function(size) {
      return new Rect({ center : this.getCenter(), size : size });
    },

    move: function(options) {
      var nRect = this.clone();

      var vector = options.vector; var center = options.center; var scale = options.scale; var staticPoint = ( options.staticPoint ) ? options.staticPoint.clone() : false;
      
      if (staticPoint && scale) {
        if (staticPoint.isPoint) staticPoint = staticPoint.inRef(this.ref).getValue();
        center = staticPoint.minus(staticPoint.minus(nRect.getCenter()).multiply(scale));
      }
      
      if (vector) {
        if (vector.isVector) vector = vector.inRef(this.ref).getValue();
        nRect.segX.add(vector[0]);
        nRect.segY.add(vector[1]);
      }

      if (center) {
        nRect.segX.setMiddle(center[0]);
        nRect.segY.setMiddle(center[1]);
      }

      if (scale) {
        var f = scale; // factor

        var nL = f*(nRect.segX.length());
        var m = nRect.segX.getMiddle();
        nRect.segX =  (new Seg(m-nL/2, m+nL/2));

        nL = f*(nRect.segY.length());
        m = nRect.segY.getMiddle();
        nRect.segY = (new Seg(m-nL/2, m+nL/2));   
      }
      
      if (options.override) {
        this.segX = nRect.segX;
        this.segY = nRect.segY;

        return this;
      }
      return nRect;

    },

    position : function(){
      return new r.Point({ x: this.segX.c1, y: this.segY.c1, ref : this.ref });
    },

    points : function(){
      // in direct sens
      return [
        new r.Point({ x: this.segX.c1, y: this.segY.c1, ref : this.ref}),
        new r.Point({ x: this.segX.c1, y: this.segY.c2, ref : this.ref}),
        new r.Point({ x: this.segX.c2, y: this.segY.c2, ref : this.ref}),
        new r.Point({ x: this.segX.c2, y: this.segY.c1, ref : this.ref})
      ];
    },

    clone : function() {
      return new Rect(R4.prototype.clone.call(this), this.ref);
    }

  });

  return Rect;

});
sand.define('Geo/Ref', function(r) {
    
  var Ref = function(options) {
    this.origin = options.origin;
    this.factor = options.factor;
  };

  Ref.prototype = {
    isRef : true,

    scale : function(o, df) {
      this.origin = o;

      if(typeof(this.factor) === 'number') {
        this.factor *= df;
      }
      else {
        this.factor[0] *= df;
        this.factor[1] *= df;
      }
    },
    
    equals : function(ref) { // we use this cause sometimes 2 refs are different objects but still equal, see Ref.db
      return this.origin.equals(ref.origin) && ((typeof(this.factor) === 'number') ? this.factor === ref.factor : this.factor.equals(ref.factor))
    }
  }
  
  //WCB
  Ref.db = new Ref({
    origin : [0, 0],
    factor : 1
  });
  
  return Ref;
     
});
(sand.define("Geo/RefRect", ["core/extend", "Geo/getFromRefToRef", "Geo/Rect", "Geo/Ref", "Geo/Point"], function(r) {
    
    var extend = r.extend,
      getFromRefToRef = r.getFromRefToRef,
      Rect = r.Rect,
      Ref = r.Ref;

  var RefRect = function(options) // rect : , ref :
    {
      Rect.call(this, options.rect);

      if (!options.ref.origin) options.ref.origin = this.getValue()[0];

      this.attachedRef = options.ref;
    }

    extend(RefRect.prototype, Rect.prototype,
    {
      reset : function(options) {
        Rect.call(this, options);
        this.attachedRef.origin = this.getValue()[0]; // we refresh the ref origin
      },

        isRefRect : true,

        move : function(options)
        {
            if(options.override)
            {
                Rect.prototype.move.call(this, options);

                if(options.scale)
                {
                   this.attachedRef.factor = this.attachedRef.factor/options.scale;
                }

                this.attachedRef.origin = this.getValue()[0]; // we refresh the ref origin

                return (this);
            }
            
            return (Rect.prototype.move.call(this, options));
        },
        
         setPosition : function(p)
         {
             Rect.prototype.setPosition.call(this, p);
             this.attachedRef.origin = p;
         },
             
         getCenterInOwnRef : function()
         {
             return (new r.Point({position:getFromRefToRef(this.getValue()[1].divide(2), this.refName, this.ref.name),refName:this.ref.name}));
         },
             
         clone : function()
         {
             return (new Rect(this.getValue(), this.refName));
         }
         
    });
        
  this.exports = RefRect;
        
}));
(sand.define("Geo/Seg", function(r) {
    
  var m = Math;
    
  var Seg = function(c1, c2) {
    this.c1 = c1;
    this.c2 = c2;
  }
    
  Seg.prototype = {
    
    set : function(c1, c2) {
      this.c1 = c1;
      this.c2 = c2;
      return this;
    },

    clone : function() {
      return new Seg(this.c1, this.c2);
    },
    
    setStart : function(c) {
      var l = this.length();
      this.c1 = c;
      this.c2 = c + l;

      return this;
    },

    setEnd : function(c) {
      var l = this.length();
      this.c2 = c;
      this.c1 = c - l;

      return this;
    },

    expand : function(v) {
      this.c1 -= v;
      this.c2 += v;
      return this;
    },
    
    setSize : function(size, o) {
      if (!o || !o.fromMiddle) this.c2 = this.c1 + size;
      else {
        var m = (this.c1 + this.c2) / 2;
        this.c1 = m - size / 2;
        this.c2 = m + size / 2;
      }
      return this;
    },
    
    round : function() {
      this.c1 = this.c1.round();
      this.c2 = this.c2.round();
    },
        isSeg : true,

         getIntersectionWith : function(seg) //WARNING : at the moment inter doesn't return a Point
         {
             return ( (this.c2 <= seg.c1 || this.c1 >= seg.c2) ? null : new Seg( ( this.c1 > seg.c1 ) ? this.c1 : seg.c1 , ( this.c2 < seg.c2 ) ? this.c2 : seg.c2 ) );
         },

         translate : function(d) {
           this.c1 += d;
           this.c2 += d;

           return this;
         },

        contains : function(p)
        {
            return ((this.c1 < p) && (p < this.c2));
        },
        
        equals : function(seg)
        {
            return (seg.c1 === this.c1 && seg.c2 === this.c2);
        },
                    
        add : function(c)
        {
            this.c1 += c;
            this.c2 += c;
        },
                    
        getMiddle : function()
        {
            return ((this.c2 + this.c1)*0.5);
        },

        length : function()
        {
            return (this.getLength());
        },
        
        getLength : function()
        {
            return (this.c2 - this.c1);
        },
                   
        scale : function(f) // factor
        {
            var nL = f*(this.length());
            this.c1 = f*this.c1;
            this.c2 = this.c1 + nL;
        },
                  
        multiply : function(f)
        {
            this.c1 = f*this.c1;
            this.c2 = f*this.c2;
        },
                 
        round : function()
        {
          console.log('ROUND');
            return (new Seg(m.round(this.c1), m.round(this.c2)));
        },
                    
        setMiddle : function(value)
        {
             var halfL = this.length()/2;
             this.c1 = value-halfL;
             this.c2 = value+halfL;
             return this;
        }
        
    }
    
    return Seg;
    
}));
sand.define('Geo/TwoPointsR4', ['Geo/R4'], function(r) {
  
  var TwoPointsR4 = function(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  };
  
  TwoPointsR4.prototype = {
    getValue : function() {
      var x1, x2, y1, y2, p1 = this.p1, p2 = this.p2;
      if (p1[0] < p2[0]) {
        x1 = p1[0]; x2 = p2[0]; 
      }
      else {
        x1 = p2[0]; x2 = p1[0];
      }
      if (p1[1] < p2[1]) {
        y1 = p1[1]; y2 = p2[1];
      }
      else {
        y1 = p2[1]; y2 = p1[1];
      }
      
      return (new r.R4({ p1 : [x1, y1], p2 : [x2, y2] })).getValue();
    }
  };
  
  return TwoPointsR4;
  
});
(sand.define("Geo/Vector", ["core/extend", "Geo/Point", "Geo/refs"], function(r) {

  var extend = r.extend,
    Point = r.Point,
    refs = r.refs;
    
  var Vector = function(options) {
    Point.call(this, options)
  };
    
  extend(Vector.prototype, Point.prototype, {    
    isPoint : undefined,
    isVector : true,
    
    inRef : function(refName) {
      if(this.refName !== refName) {
        return (new Vector({ x : this.x * refs  [refName].factor/refs[this.refName].factor, y : this.y * refs[refName].factor/refs[this.refName].factor, refName : refName, refsPath : refs }));
      }
      else {
        return this.clone();
      }
    },
    
        clone : function()
        {
            return (new Vector({ x : this.x, y : this.y,  refName : this.refName, refsPath : this.refsPath }));
        }
    });
            
    AbsVector = function(options)
    {
        this.refName = options.refsName || 'db';
        if(options.p1)
        {
            if (!options.p1.isPoint)
            {
               this.p1 = options.p1;
               this.p2 = options.p2;
            }
            else
            {
                this.p1 = options.p1.getValue();
                this.p2 = options.p2.getValue();
            }

        }
        if (this.p2[1] === this.p1[1]) // vertical vector
        {
            this.mode = "h";
            this.cst = this.p2[1];
        }
        else if (this.p2[0] === this.p1[0]) // horizontal vector
        {
            this.mode = "v";
            this.cst = this.p2[0];
        }   
        else
        {
            this.mode = "o";
            this.linea = (this.p2[1] - this.p1[1]) / (this.p2[0] - this.p1[0]);
            this.lineb = this.p1[1] - this.p1[0] * this.linea;
        }
    },
    
    AbsVector.prototype = 
    {
        getIntersectionWith : function(absVector)
        {
            var p = [];
            if (this.mode === "o" && absVector.mode === "o")
            {
                if (this.linea !== absVector.linea)
                {
                    p[0] = (absVector.lineb - this.lineb) / (this.linea - absVector.linea);
                    p[1] = absVector.linea * p[0] + absVector.lineb;
                }
            }
            else
            {
                if (this.mode === absVector.mode)
                {
                }
                else
                {
                    if (this.mode === "h")
                    {
                        p[1] = this.cst;

                        if (absVector.mode === "v")
                        {
                            p[0] = absVector.cst;
                        }
                        else // absVector.mode = "o"
                        {
                            p[0] = (p[1] - absVector.lineb) / absVector.linea;
                        }
                    }
                    else if (this.mode === "v")
                    {
                        p[0] = this.cst;

                        if (absVector.mode === "h")
                        {
                            p[1] = absVector.cst;
                        }
                        else
                        {
                            p[1] = absVector.linea * p[0] + absVector.lineb;
                        }
                    }
                    else // this.mode = "o"
                    {
                        if (absVector.mode === "v")
                        {
                            p[0] = absVector.cst;
                            p[1] = this.linea * p[0] + this.lineb;
                        }
                        else
                        {
                            p[1] = absVector.cst;
                            p[0] = (p[1] - this.lineb) / this.linea;
                        }
                    }
                }
            }

            if (p[0] !== null && p[1] !== null)
            {
                return (
                (p[0] >= max(min(this.p1[0], this.p2[0]), min(absVector.p1[0], absVector.p2[0])) && p[0] <= min(max(this.p1[0], this.p2[0]), max(absVector.p1[0], absVector.p2[0])))
                && (p[1] >= max(min(this.p1[1], this.p2[1]),min(absVector.p1[1], absVector.p2[1])) && p[1] <= min(max(this.p1[1], this.p2[1]), max(absVector.p1[1], absVector.p2[1])))
                ? p : null
                );
            }
        }
    }
    
  this.exports = Vector;
    
}));
(sand.define("Geo/Circle", function(r) {
  
  var Circle = function(options){
    this.setOptions(options);
  };
  
  Circle.prototype = {
    setOptions: function(options){
      this.center = options.center;
      this.id = options.id;
      this.r = options.r;
    },
    pointOnCircle: function(angle){
      return {
        point : this.getPosFromAngle(angle),
        circle : this,
        angle : angle
      }
    },
    getPosFromAngle: function(angle){
      return [this.center[0]+this.r*Math.cos(angle),this.center[1]+this.r*Math.sin(angle)]
    },
    getArcToCircle: function(c){
      //we get the arc from self to c, clockwise
      
      //ne circle is inside the other
      //console.log("==>", this.center.minus(c.center).norm(), [this.r,c.r].max() , [this.r,c.r].min());
      if (this.center.minus(c.center).norm() <= ([this.r,c.r].max()) - [this.r,c.r].min()){
        var circle = (this.r > c.r) ? this : c ;
        return [false,{ circle : circle}]
      } 
      
      var diff = c.center.minus(this.center);
      
      //same radius
      if (this.r == c.r){
        var angle = diff.orth().getAngleFromAxis();
        return [this.pointOnCircle(angle),c.pointOnCircle(angle)];
      }

      //Pi is the center of i
      //ri the radius
      //Ti the points on the arc
      //in the triangle where arc is hypothenus (P P1 T1), P P1 P2 on a straight line and P T1 T2 one straight line, we use Thales
      // (vectors equality) : P1P = P2P1*r2/(r2-r1)
      
      var pPoint = diff.multiply(c.r/(this.r-c.r)).add(c.center)
      
      var beta =  Math.asin(this.r/this.center.minus(pPoint).norm())
      
      // when r > c.r, the P1P2 vector is not on the same side of the angle, we need to add a case 
      var alpha = (this.r > c.r ? Math.PI/2 - beta : Math.PI/2 + beta)
      var angle = diff.getAngleFromAxis() + alpha
      return [this.pointOnCircle(angle),c.pointOnCircle(angle)]
    },
    minX: function(){
      return this.center[0]-this.r;
    }
  };
  
  this.exports = Circle;
  
}));
(sand.define("Geo/ConvexHull", function(r) {

  var ConvexHull = function(options){
    this.posts = options.posts;
    this.ref = options.ref || refs.db;
    this.hull = this.getCirclesHull();
  };
  
  ConvexHull.prototype = {
    getCirclesHull: function(){
      return this.jarvisCircles(this.getCircles());
    },
    getCircles : function(){
      var f = function(p){
        return new Geo.Circle({
          id : p.id,
          center : p.getRenderRectInDB().inRef(this.ref).getCenter(),
          r : p.getRadius(this.ref)})
      }.bind(this);
      return this.posts.collect(f);
    },
    jarvisCircles: function(circles){
      var l = circles.length;
      circles.sort(function(a ,b) { return ((a.id > b.id ? 1 : -1)) } );
      if (l < 1){
        return [] ;
      }
      var minX = circles[0].minX(), 
          firstCircle = circles[0],
          currentArc = null,
          i = 0,
          hull = [],
          boolWhile = true,
          endArc = null,
          arc = null,
          uniqueCircle = null;

      if (circles.collect(function(c){return c.id}).uniq().length !== circles.length) {
        return []
      }
      var minX = circles[0].minX(), firstCircle = circles[0];
      for (var i = 1; i < l ; i++){
        if (circles[i].minX() < minX ){
          firstCircle = circles[i];
          minX = circles[i].minX();
        }
      }
      var currentCircle = firstCircle;
      //console.log("FIRSTCIRCLE ------------------------>", firstCircle.id);
      var currentPointOnCircle = currentCircle.pointOnCircle(-1*Math.PI);

     // console.log(circles.collect(function(c) { return (c.id) }).join(","));
      while (boolWhile && i< 1000) {
        //  console.log("---> passage de boucle : "+i);
        endArc = null;
        for (var j = 0; j< l; j++){
          //  console.log("--------> small boucle : " +circles[j].id);
          arc = currentCircle.getArcToCircle(circles[j])
          if(arc[0] == false){// circles[j] is in current_circle
            //  console.log("arc[0] == false");
            if (endArc === null){
            //    console.log("endArc == null");
              uniqueCircle = arc[1]
            }
          } else if(endArc !== null){
            //    console.log("endArc !== null");
                a = arc[0].angle-currentPointOnCircle.angle;
                b = endArc[0].angle - currentPointOnCircle.angle;
           //     console.log(a+", "+b);

                a = (a > 0) ? a%(2*Math.PI) : (4*Math.PI+a)%(2*Math.PI);

                b = (b > 0) ? b%(2*Math.PI) : (4*Math.PI+b)%(2*Math.PI);
            //    console.log(a+", "+b);
            if (// test if the arc on circle is smaller
                a >
                b
              ){
             //         console.log("tricot angle")
              endArc = arc;
            }
          } else {
        //      console.log("arc[0] != false");
            endArc = arc;
          }
      //    console.log("<--------");
        }
        if (endArc === null){//the convex hull is a circle
        //    console.log("endArc == null");
          hull.push(uniqueCircle);
          boolWhile = false;
        } else{
       //     console.log("endArc != null");
          currentArc = endArc;
          currentPointOnCircle = currentArc[1];
          currentCircle = currentPointOnCircle.circle;
          //console.log(!(typeof(hull[0]) == "undefined", hull[0]  === null, [hull[0][0].circle.id, hull[0][1].circle.id].toString(), [currentArc[0].circle.id, currentArc[1].circle.id].toString()));
         // if (!(typeof(hull[0]) == "undefined" || hull[0]  === null) && ([hull[0][0].circle.id, hull[0][1].circle.id].toString() === [currentArc[0].circle.id, currentArc[1].circle.id].toString())){


          if (!(typeof(hull[0]) == "undefined" || hull[0]  === null) && (hull[0][0].circle.id === currentArc[0].circle.id && hull[0][1].circle.id === currentArc[1].circle.id)) {
         //     console.log("gros tricot egalite, boolWhile = false");
            boolWhile = false; 
          } else {

        //      console.log("pas gros tricot");
              //console.log(currentArc[0].angle);
            hull.push(currentArc);
          }
        }
        i = i+1;
      }
      return hull;
    }

  }
  
  this.exports = ConvexHull;
  
}));
sand.define("Geo/extremities",["Geo/Rect","Geo/Point","core/isArray"],function(r){
  var d = this.debug;
  return function(points, ref) {
    if(!points || points.length < 2){
      //STT not necessarily, I use this for Client d.e && console.log("[ERROR] extremities take at least 2 points");
      return new r.Rect([[0, 0], [0, 0]]);
    }
    
    if (!ref) ref = points[0].ref;
    if (!ref.isRef) {
      console.log('%c [ERROR] extremities.js, Illegal call', 'background: #222; color: #bada55');
    }
  
    var xMin,yMin,xMax,yMax,a;
    
    for (var i = -1, n = points.length; ++i < n; ) {
      if (r.isArray(points[i])) {
        points[i] = new r.Point({ position:points[i], ref : ref });
      } else {
        (points[i].ref.equals(ref)) && (points[i] = points[i].inRef(ref));
      }
      
      a = points[i].x;
      (typeof(xMin) === 'undefined' || a < xMin) && (xMin = a);
      (typeof(xMax) === 'undefined'|| a > xMax) && (xMax = a);
      
      a = points[i].y;
      (typeof(yMin) === 'undefined' || a < yMin) && (yMin = a);
      (typeof(yMax) === 'undefined' || a > yMax) && (yMax = a);
    }
    
    return new r.Rect({ ref : ref, p1 : [xMin,yMin], p2 : [xMax,yMax]});
  };
});
(sand.define("Geo/getFromRefToRef", "Geo/refs", function(r) {
    
  var refs = r.refs;
    
  this.exports = function(value, oRef, nRef) {
    if (!oRef.isRef) { // name
      oRef = refs[oRef];
      nRef = refs[nRef];
    }
    var f = nRef.factor/oRef.factor;
    if (typeof(value) === 'number') {
      return (value*f);
    }
    else { // array
      var res = [];
      for (var i = value.length; i--; ) {
        res[i] = value[i]*f;
      }
      return res;
    }
  };

}));
(sand.define("Geo/prototypes", ["core/extend"], function(r) {
  
  var extend = r.extend;
  
  extend(Array.prototype, {
    equals : function(a) {
      for (var i = this.length; i--; ) if (a[i] !== this[i]) return false;
      for (var i = a.length; i--; ) if (a[i] !== this[i]) return false;
      return true;
    },
    multiply : function(a) {
      var ret = [];
      if (typeof(a) === 'number') {
        for (var i = this.length; i--; ) {
          ret[i] = this[i] * a;
        }
            }
            else
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] * a[i];
                }
            }
            return (ret);
        },

        divide : function(a)
        {
            var ret = [];
            if(typeof(a) === 'number')
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i]/a;
                }
            }
            else
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] / a[i];
                }
            }
            return (ret);
        },

        minus : function(a)
        {
            var ret = [];
            if(typeof(a) === 'number')
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] - a;
                }
            }
            else
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] - a[i];        
                }
            }
            return (ret);
        },

        add : function(a)
        {
            var ret = [];
            if(typeof(a) === 'number')
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] + a;
                }
            }
            else
            {
                for(var i = this.length; i--; )
                {
                    ret[i] = this[i] + a[i];
                }
            }
            return (ret);
        },

        round : function()
        {
            for(var i = this.length; i--; )
            {
                this[i] = Math.round(this[i]);
            }
            return (this);
        },

        orth : function(){
          if (this.length != 2){
            throw Error
          }
          return [-this[1],this[0]]
        },

        norm : function(){
          return Math.sqrt(this.sum(function(i){return i*i}));
        },
        
        sum : function(f){
          var s = 0;
          if(typeof(f) === "function"){
            for(var i = 0; i < this.length; i++){
              s = s+f(this[i]);
            }
          } else {
            for(var i = 0; i < this.length; i++){
              s = s+this[i];
            }
          }
 
          return s;
        }, 

        getAngleFromAxis: function(){
          return (this[0] < 0 ? 
                  Math.PI : 
                  0
              ) + (
              this[0] == 0 ? 
                  (this[1] < 0 ? -1 : 1 )*Math.PI/2 : 
                  Math.atan(this[1]/this[0])
              )
        }
    });
}));
(sand.define("Geo/refs", function(r) {

  this.exports = {};

}));

