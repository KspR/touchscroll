sand.define('touch/Gesture', [
  'Seed',
  'Geo/prototypes',
  'core/Array/*',
], function(r) {

  return r.Seed.extend({

    '+init' : function(o) {
      this.touches = [];

      this.noRightClick = o.noRightClick;

      for (var i = -1, n = o.touches.length; ++i < n; ) this.touches.push({
        clientX : o.touches[i].clientX,
        clientY : o.touches[i].clientY,
        identifier : o.touches[i].identifier
      });

      this.center = this.getCenter();

      if (this.touches.length > 1) {
        this.dist = this.getDist(this.center);
        this.v = this.getV();
      }
      else {
        this._sc = this.center;
        //todo
        // if (!this.noRightClick) {
        //   this._timeout = setTimeout(function() { //rightclick
        //     this.fire('longtap', [o.e]);
        //     drag = null;
        //     this._timeout = null;
        //     this.fire('destroy', o.e);
        //   }.bind(this), 500);
        // }
      }
    },

    getV : function() {
      var res = [];
      for (var i = -1, n = this.touches.length; ++i < n; ) {
        res.push(this.center.minus([this.touches[i].clientX, this.touches[i].clientY]));
      }
      return res;
    },

    getCenter : function() {
      if (this.touches.length === 1) {
        return [this.touches[0].clientX, this.touches[0].clientY];
      }

      var center = [0, 0];
      for (var i = this.touches.length; i--; ) {
        var touch = this.touches[i];
        center = center.add([touch.clientX, touch.clientY]);
      }
      return center.divide(this.touches.length);
    },

    getDist : function(center) {
      var dist = 0;
      for (var i = this.touches.length; i--; ) {
        var touch = this.touches[i];
        dist += Math.sqrt(Math.pow(center[0] - touch.clientX, 2) + Math.pow(center[1] - touch.clientY, 2));
      }
      return dist / this.touches.length;
    },

    touchstart : function(touches) {
      console.log('touchstart gesture');
      for (var i = -1, n = touches.length; ++i < n; ) {
        if (!this.touches.one('identifier', touches[i].identifier)) { // strange behavior double fire with svg vertices ?
          if (typeof(touches[i].clientY) !== 'number') {
            console.log('CAUGHT2');
          }
          this.touches.push({
            clientX : touches[i].clientX,
            clientY : touches[i].clientY,
            identifier : touches[i].identifier
          });
        }
      }

      if (this._timeout && this.touches.length > 1) {
        clearTimeout(this._timeout);
        this._timeout = false;
      }

      this.v = this.getV();
      this.center = this.getCenter();
      
      if (this.touches.length > 1) this.dist = this.getDist(this.center);
      else this.dist = null;
    },

    touchmove : function(touches, e) {
      /*
      for (var i = -1, n = touches.length; ++i < n; ) {
        if (!this.touches.one('identifier', touches[i].identifier)) { // strange behavior double fire with svg vertices ?
          this.touches.push({
            clientX : touches[i].clientX || touches[i].pageX,
            clientY : touches[i].clientY || touches[i].pageY,
            identifier : touches[i].identifier
          });
        }
      }*/

      if (e.pointerType === 'pen' && e.pressure === 0) {
        // console.log('canceling pen move with 0 pressure');
        var touch = this.touches.one('identifier', touches[0].identifier);
        if (touch) {
          // console.log('canceling touch currently down');
          this.touchend(touches, e);
        }
        return;
      }

      for (var i = -1, n = touches.length; ++i < n; ) {
        var touch = this.touches.one('identifier', touches[i].identifier);

        // if (typeof(touches[i].clientY) !== 'number') {
        //   console.log('CAUGHT3');
        // }

        if (touch) {
          touch.clientX =touches[i].clientX;
          touch.clientY = touches[i].clientY;
        }
      }

      // var center = this.getCenter();
      if (this.touches.length === 1 && this._timeout) { // && this_timeout prevents the rightclick in case of a come and go (~ aller retour :))
        if (true) {//center.minus(this._sc).dist() > 40) {
          clearTimeout(this._timeout);
          this._timeout = null;
          this.refresh(e);
        }
      }
      else {
        this.refresh(e);
      }
    },

    preventRightClick : function() {
      return;
      if (this._timeout) {
        clearTimeout(this._timeout);
        this._timeout = null;
      }
    },

    touchend : function(touches, e) {
      for (var i = touches.length; i--; ) {
        for (var j = this.touches.length; j--; ) {
          if (this.touches[j].identifier === touches[i].identifier) this.touches.splice(j, 1);
        }
      }

      if (!this.touches.length) {
        if (this._timeout) { // this means we haven't move enough to trigger a drag
          clearTimeout(this._timeout);
          this._timeout = null;
          this.fire('tap');
        }

        // console.log('destroying gesture (trigger pointerup');
        this.fire('destroy', e);
        return;
      }

      this.center = this.getCenter();
      
      if (this.touches.length > 1) this.dist = this.getDist(this.center);
      else this.dist = null;
    },

    refresh : function(e) {
      var newCenter = this.getCenter();
      if (!newCenter.equals(this.center)) {
        var oldCenter = this.center;
        this.center = newCenter;
        this.fire('translate', newCenter.minus(oldCenter), e);
      }

      if (this.touches.length > 1) {
        var dist = this.getDist(newCenter);

        if (dist !== this.dist) {
          if (this.dist) { // exclude case where the distance just starts (bridge from 1 touch to 2 touches)
            this.fire('scale', dist / this.dist, e);
          }

          this.dist = dist;
        }

        var v = this.getV();
        if (this.v) {
          var rotation = 0;
          v.each(function(v, i) {
            rotation += (v[1]/v[0] > this.v[i][1]/this.v[i][0] ? 1 : -1) * Math.acos((this.v[i][0] * v[0] + this.v[i][1] * v[1]) / (Math.sqrt(Math.pow(this.v[i][0], 2) + Math.pow(this.v[i][1], 2)) * Math.sqrt(Math.pow(v[0], 2) + Math.pow(v[1], 2))));
          }.bind(this));
          rotation = rotation / this.touches.length;
          if (isNaN(rotation)) {
            rotation = 0;
          }

          this.fire('rotate', rotation); //(v[1]/v[0] > this.v[1]/v[0] ? 1 : -1) * 
        }
        this.v = v;
      }
      else {
        this.v = null;
        this.dist = null;
      }
    }

  });

});