/**
 * @brief Comic style version of common drawing functions.
 *
 * Comic style version of common drawing functions, that is
 * implemented as library agnostic JS extension. Only assuming
 * that given "lib" can be extended the JS way (setting properties)
 * and that if a "path" method is given, it is a drawing method
 * which understands standard SVG path format strings.
 * If no "path" is given, it will check if "lib" is a 2d canvas context
 * and use context drawing functions. If "lib" is not a 2d canvas
 * context, as last guess it will try to call an SVG "path" method
 * directly on the "lib" object.
 *
 * Credits:
 * Inspired by and based on Jonas Wagner's work
 * http://29a.ch/2010/2/10/hand-drawn-lines-algorithm-javascript-canvas-html5
 * which is based on this paper
 * http://iwi.eldoc.ub.rug.nl/FILES/root/2008/ProcCAGVIMeraj/2008ProcCAGVIMeraj.pdf
 *
 * @author Balint Morvai <balint@morvai.de>
 * @license http://en.wikipedia.org/wiki/MIT_License MIT License
 */
// global object
COMIC = { version: 0.8 };

(function() {
/**
 * @var object global "C" object
 */
var C = COMIC;
/**
 * @var int length of one step - each step means new "hand jitter"
 */
var fsteps = 50;
/**
 * @var int min number of steps
 */
var msteps = 4;
/**
 * @var float fuzzyness factor
 */
var ff = 8.0;
/**
 * @var float fuzzyness factor for circle & ellipse
 */
var ffc = ff / 20;
/**
 * @var object 2d canvas context (if any)
 */
var context = undefined;
/**
 * @var function code to execute when starting drawing a shape
 */
var begin = function() {};
/**
 * @var function code to execute when finished drawing a shape
 */
var finish = function() {};
/**
 * @var string path string built upon subsequent calls of "path" function
 */
var pathStr = "";

/**
 * Public function to allow user defined options, also
 * setting a 2d canvas context for drawing.
 *
 * @param options object with options
 * @return C object
 */
C.init = function(options) {
    // no need to deep copy & no need to drop unknown options
    for(var prop in options) {
        if(options.hasOwnProperty(prop)) {
            C[prop] = options[prop];
        }
    }
    
    if(typeof options["context"] == "object") {
        bindTo("canvas", C.context);
    }
    
    return C;
}

/**
 * Public function to init drawing functions on the given
 * 2d canvas context.
 *
 * @param context 2d canvas context
 * @return C object
 */
C.ctx = function(context) {
    C.init({ "context": context });

    return C;
}

/**
 * Binds comic drawing functions to the given library using the
 * given method to draw svg paths. If no method is given (2nd param),
 * it tries to call "path" directly on lib.
 *
 * @param libName root object to hook in to
 * @param lib root object to hook in to
 * @return void
 */
var bindTo = function(libName, lib) {
    /**
     * hand draw a cubic Bezier curve
     *
     * @param x0 x starting point
     * @param y0 y starting point
     * @param cx0 x 1st control point
     * @param cy0 y 1st control point
     * @param cx1 x 2nd control point
     * @param cy1 y 2nd control point
     * @param x1 x end point
     * @param y1 y end point
     * @return native library object
     */
    lib.cBezier3 = function(x0, y0, cx0, cy0, cx1, cy1, x1, y1) {
        begin.call(this);
        // number of steps - this is a very primitive approach to
        // estimate the Bezier arc length
        var d = dist2(x0, y0, x1, y1) * 3;
        var steps = Math.floor(Math.pow(d / C.fsteps, 0.9));
        // fuzzyness
        var f = C.ff * 0.8;
        
        var p0 = [x0, y0];
        var pc0 = [cx0, cy0];
        var pc1 = [cx1, cy1];
        var p1 = [x1, y1];
        var curve2 = [p0, pc0, pc1, p1];
        for(var i = steps; i > 0; i--) {
            // split curve2
            var points = bsplit(curve2, 1/i);
            var curve1 = points[0];
            var curve2 = points[1];
            // set points for drawing from curve1
            p0 = curve1[0]; pc0 = curve1[1];  pc1 = curve1[2]; p1 = curve1[3];
            
            path.call(this, p0[0], p0[1],
                fuzz((pc0[0]+pc1[0])/2, f), // just make one control point
                fuzz((pc0[1]+pc1[1])/2, f),
                p1[0], p1[1]);
        }
        
        return finish.call(this);
    }
    
    /**
     * hand draw a quadratic Bezier curve
     *
     * @param x0 x starting point
     * @param y0 y starting point
     * @param cx x control point
     * @param cy y control point
     * @param x1 x end point
     * @param y1 y end point
     * @return native library object
     */
    lib.cBezier2 = function(x0, y0, cx, cy, x1, y1) {
        begin.call(this);
        // number of steps - this is a very primitive approach to
        // estimate the Bezier arc length
        var d = dist2(x0, y0, x1, y1) * 3;
        var steps = Math.floor(Math.pow(d / C.fsteps, 0.9));
        // fuzzyness
        var f = C.ff * 0.8;
        
        var p0 = [x0, y0];
        var pc = [cx, cy];
        var p1 = [x1, y1];
        var curve2 = [p0, pc, p1];
        for(var i = steps; i > 0; i--) {
            // split curve2
            var points = bsplit(curve2, 1/i);
            var curve1 = points[0];
            var curve2 = points[1];
            // set points for drawing from curve1
            p0 = curve1[0]; pc = curve1[1]; p1 = curve1[2];
            
            path.call(this, p0[0], p0[1], fuzz(pc[0], f), fuzz(pc[1], f), p1[0], p1[1]);
        }
        
        return finish.call(this);
    }

    /**
     * WRAPPER for real, private "cEllipse"
     * Draw a comic style / hand drawn cEllipse
     *
     * @param x x center
     * @param y y center
     * @param rh horizontal radius
     * @param rv vertical radius
     * @param rot rotation in radians (< 2*PI)
     * @param start start in radians (< 2*PI) for drawing an arc only (optional)
     * @param end end in radians (< 2*PI) for drawing an arc only (optional)
     * @return native library object
     */
    lib.cEllipse = function(x, y, rh, rv, rot, start, end) {
        begin.call(this);
        cEllipse.call(this, x, y, rh, rv, rot, start, end);
        return finish.call(this);
    }
    
    /**
     * Private version that does not call "begin" or "finish".
     * Wrapped by "cEllipse" public.
     * hand draw an ellipse
     *
     * @param x x center
     * @param y y center
     * @param rh horizontal radius
     * @param rv vertical radius
     * @param rot rotation in radians (< 2*PI)
     * @param start start in radians (< 2*PI) for drawing an arc only (optional)
     * @param end end in radians (< 2*PI) for drawing an arc only (optional)
     * @return native library object
     */
    var cEllipse = function(x, y, rh, rv, rot, start, end) {
        var PI2 = Math.PI * 2;
        // sanitize input
        start = (typeof start == "undefined") ? 0 : Math.min(PI2-0.005*PI2, start);
        end = (typeof end == "undefined") ? PI2 : Math.min(PI2, end);
        rot = (typeof rot == "undefined") ? 0 : Math.min(PI2, rot);
        // rotation
        var cosRot = Math.cos(rot);
        var sinRot = Math.sin(rot);
        // number of steps
        var steps = Math.ceil(Math.pow(rh * rv, 0.25) * 3);
        // fuzzyness dependent on radius
        var fh = C.ffc * Math.pow(rh * 3, 0.5)
                * Math.sqrt((rh < 25) ? 25 / rh : 1); // boost fuzz for small ellipses
        var fv = C.ffc * Math.pow(rv * 3, 0.5) 
                * Math.sqrt((rv < 25) ? 25 / rv : 1);
        // distortion of the ellipse
        var xs = 0.95 + Math.random() * 0.1;
        var ys = 0.95 + Math.random() * 0.1;
        var rxs = rh * xs;
        var rys = rv * ys;
        // lenght of one segment
        var arcLength = end - start;
        var segLength = arcLength / steps;

        // initial values for i = 0
        var t1 = start; var t0, x0, y0;
        var cosT1rxs = rxs * Math.cos(t1);
        var sinT1rys = rys * Math.sin(t1);
        var x1 = x + cosT1rxs * cosRot - sinT1rys * sinRot;
        var y1 = y + cosT1rxs * sinRot + sinT1rys * cosRot;
        for(var i = 1; i <= steps; i++) {
            t1 = t1 + segLength;
            t0 = t1 - segLength;
            var x0 = x1;
            var y0 = y1;
            var cosT1rxs = rxs * Math.cos(t1);
            var sinT1rys = rys * Math.sin(t1);
            var x1 = x + cosT1rxs * cosRot - sinT1rys * sinRot;
            var y1 = y + cosT1rxs * sinRot + sinT1rys * cosRot;

            path.call(this, x0, y0, fuzz(x0, fh), fuzz(y0, fv), x1, y1);
        }
        
        return this;
    }
    
    /**
     * WRAPPER for real, private "cCircle"
     * Draw a comic style / hand drawn circle
     *
     * @param x x center
     * @param y y center
     * @param r radius
     * @param start start in radians (< 2*PI) for drawing an arc only (optional)
     * @param end end in radians (< 2*PI) for drawing an arc only (optional)
     * @return native library object
     */
    lib.cCircle = function(x, y, r, start, end) {
        begin.call(this);
        cCircle.call(this, x, y, r, start, end);
        return finish.call(this);
    }
    
    /**
     * Private version that does not call "begin" or "finish".
     * Wrapped by "cCircle" public.
     * hand draw a circle
     *
     * @param x x center
     * @param y y center
     * @param r radius
     * @param start start in radians (< 2*PI) for drawing an arc only (optional)
     * @param end end in radians (< 2*PI) for drawing an arc only (optional)
     * @return native library object
     */
    var cCircle = function(x, y, r, start, end) {
        var PI2 = Math.PI * 2;
        // sanitize input
        start = (typeof start == "undefined") ? 0 : Math.min(PI2-0.005*PI2, start);
        end = (typeof end == "undefined") ? PI2 : Math.min(PI2, end);
        // number of steps
        var steps = Math.ceil(Math.sqrt(r) * 3);
        // fuzzyness dependent on on radius
        var f = C.ffc * Math.pow(steps, 0.75) 
                * Math.sqrt((r < 25) ? 25 / r : 1); // boost fuzz for small circles
        // distortion of the circle
        var xs = 0.95 + Math.random() * 0.1;
        var rxs = r * xs;
        var rys = r * (2.0 - xs);
        // lenght of one segment
        var arcLength = end - start;
        var segLength = arcLength / steps;

        var t1 = start; var t0, x0, y0;
        var x1 = x + Math.cos(t1) * rxs; // initial values for i = 0
        var y1 = y + Math.sin(t1) * rys; // initial values for i = 0
        for(var i = 1; i <= steps; i++) {
            t1 = t1 + segLength;
            t0 = t1 - segLength;
            x0 = x1;
            y0 = y1;
            x1 = x + Math.cos(t1) * rxs;
            y1 = y + Math.sin(t1) * rys;

            path.call(this, x0, y0, fuzz(x0, f), fuzz(y0, f), x1, y1);
        }
        
        return this;
    }

    /**
     * Draw a triangle using line function
     *
     * @param x0 x first point
     * @param y0 y first point
     * @param x1 x second point
     * @param y1 y second point
     * @param x2 x third point
     * @param y2 y third point
     * @return native library object
     */
    lib.cTrian = function(x0, y0, x1, y1, x2, y2) {
        begin.call(this);
        cLine.call(this, x0, y0, x1, y1);
        cLine.call(this, x1, y1, x2, y2);
        cLine.call(this, x2, y2, x0, y0);
        return finish.call(this);
    }

    /**
     * Draw a rectangle using line function
     *
     * @param x0 x upper left corcer
     * @param y0 y upper left corner
     * @param width width of the rectangle
     * @param height height of the rectangle
     * @param rh horizontal radius of rounded corners
     * @param rv vertical radius of rounded corners
     * @return native library object
     */
    lib.cRect = function(x0, y0, width, height, rh, rv) {
        begin.call(this);
        // sanitize input
        rh = (typeof rh == "undefined") ? 0 : Math.min(rh, width/2);
        rv = (typeof rv == "undefined") ? rh : Math.min(rv, height/2);
        // calculate lower left corner
        var x1 = x0 + width;
        var y1 = y0 + height;
        
        cLine.call(this, x0+rh, y0, x1-rh, y0);
        cLine.call(this, x1, y0+rv, x1, y1-rv);
        cLine.call(this, x1-rh, y1, x0+rh, y1);
        cLine.call(this, x0, y1-rv, x0, y0+rv);
        if(rh > 0) {
            var halfPI = Math.PI / 2;
            cEllipse.call(this, x0+rh, y0+rv, rh, rv, 0, Math.PI, halfPI*3);
            cEllipse.call(this, x1-rh, y0+rv, rh, rv, 0, halfPI*3, Math.PI*2);
            cEllipse.call(this, x1-rh, y1-rv, rh, rv, 0, 0, halfPI);
            cEllipse.call(this, x0+rh, y1-rv, rh, rv, 0, halfPI, Math.PI);
        }
        
        return finish.call(this);
    }
    
    /**
     * WRAPPER for real, private "cLine"
     * Draw a comic style / hand drawn line
     *
     * @param x0 x start
     * @param y0 y start
     * @param x1 x end
     * @param y1 y end
     * @return native library object
     */
    lib.cLine = function(x0, y0, x1, y1) {
        begin.call(this);
        cLine.call(this, x0, y0, x1, y1);
        return finish.call(this);
    }

    /**
     * Private version that does not call "begin" or "finish".
     * Wrapped by "cLine" public.
     * Draw a comic style / hand drawn line
     *
     * @param x0 x start
     * @param y0 y start
     * @param x1 x end
     * @param y1 y end
     * @return native library object
     */
    var cLine = function(x0, y0, x1, y1) {
        /**
         * Estimate the movement of the arm
         * Reuses 3rd param from last call if omitted
         *
         * @param x0 x start
         * @param x1 x end
         * @param t step from 0 to 1
         * @return number
         */
        var ft; // store this outside function to preserve
        var handMovement = function(x0, x1, t) {
            // calculate ft or use old value if no "t" given
            if(typeof t != "undefined") {
                var pow3 = Math.pow(t, 3);
                var pow4 = pow3 * t;
                var pow5 = pow4 * t;
                ft = (15 * pow4 -
                      6 * pow5 -
                      10 * pow3);
            }
            
            return x0 + (x0 - x1) * ft;
        }
        
        // calculate number of steps
        var d = dist2(x0, y0, x1, y1);
        var steps = d / C.fsteps;
        if(steps < C.msteps) {
            steps = C.msteps;
        }
        // fuzz factor
        f = C.ff / ((steps == C.msteps) ? 1.4 : 1); // reduce for small lines
        // draw line step by step using quadratic Bézier path
        var xt1 = handMovement(x0, x1, 0); // bezier control point
        var yt1 = handMovement(y0, y1); // bezier control point (reuse t0)
        for(var i = 1; i <= steps; i++) {
            t1 = i / steps;
            var xt0 = xt1; // bezier control point
            var yt0 = yt1; // bezier control point
            var xt1 = handMovement(x0, x1, t1); // bezier end point
            var yt1 = handMovement(y0, y1); // bezier end point (reuse t1)
            
            path.call(this, xt0, yt0, fuzz(xt0, f), fuzz(yt0, f), xt1, yt1);
        }
        
        return this;
    }
    
    /**
     * @brief De Casteljau's algorithm splitting n-th degree Bezier curve
     *
     * Given n+1 control points for an n-th degree Bezier curve and
     * a number t between 0 and 1, it will return two arrays, each
     * with n+1 new control points. The returned control points define
     * two Bezier curves that together form the original Bezier curve
     * in two peaces, split at the t-th point.
     *
     * @author Balint Morvai <balint@morvai.de>
     * @license http://en.wikipedia.org/wiki/MIT_License MIT License
     */
    var bsplit = function(points, t0) {
        var n = points.length - 1; // number of control points
        var b = [];                  // coefficients as in De Casteljau's algorithm
        var res1 = [];           // first curve resulting control points
        var res2 = [];           // second curve resulting control points
        var t1 = 1 - t0;
            
        // multiply point with scalar factor
        var pf = function(p, f) {
            var res = [];
            for(var i = 0; i < p.length; i++) {
                res.push(f * p[i]);
            }
            return res;
        };
        // add points as vectors
        var pp = function(p1, p2) {
            var res = [];
            for(var i = 0; i < Math.min(p1.length, p2.length); i++) {
                res.push(p1[i] + p2[i]);
            }
            return res;
        };
            
        // set original coefficients: b[i][0] = points[i]
        for(var i = 0; i <= n; i++) {
            points[i] = (typeof points[i] == "object") ? points[i] : [points[i]];
            b.push([ points[i] ]);
        }
        // get all coefficients
        for(var j = 1; j <= n; j++) {
            for(var i = 0; i <= (n-j); i++) {
                b[i].push( pp(
                        pf(b[i][j-1], t1),
                        pf(b[i+1][j-1], t0)
                ));
            }
        }
        // set result: res1 & res2
        for(var j = 0; j <= n; j++) {
            res1.push(b[0][j]);
            res2.push(b[j][n-j]);
        }
            
        return [res1, res2];
    };
    
    /**
     * Shift given value randomly by fuzzyness factor f
     * @param val value to shift randomly
     * @param f fuzzyness factor
     * @return number
     */
    var fuzz = function(val, f) {
        return val + f * (Math.random() - 0.5);
    }
    
    /**
     * Distance between 2 numbers in 2 dim space
     * @param x0 1st point x
     * @param y0 1st point y
     * @param x1 2nd point x
     * @param y1 2nd point y
     * @return number
     */
    var dist2 = function(x0, y0, x1, y1) {
        var dx = x1 - x0;
        var dy = y1 - y0;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    // ----------------------set drawing method-------------------------
    // HTML5 Canvas context
    if(libName == "canvas") {
        path = function(x0, y0, cx, cy, x1, y1) {
            this.moveTo(x0, y0);
            this.quadraticCurveTo(cx, cy, x1, y1);
        }
        finish = function() {
            this.stroke();
            return this;
        };
        begin = function() {
            this.beginPath();
            return this;
        };
    }
    else {
        // for all svg libs let "path" & "begin" be as below
        path = function(x0, y0, cx, cy, x1, y1) {
            pathStr = pathStr + ["M", x0, y0, "Q", cx, cy, x1, y1].join(' ');
        };
        begin = function() {
            pathStr = "";
            return this;
        };
    }
    // Raphael.js
    if(libName == "raphael") {
        finish = function() {
            return this.path(pathStr);
        };
    }
    // D3.js
    if(libName == "d3") {
        finish = function() {
            return this.append("svg:path").attr("d", pathStr);
        };
    }
    // SVG.js
    if(libName == "svg") {
        finish = function() {
            return this.path(pathStr);
        };
    }
}

// set options
C.init({
    fsteps: fsteps,
    msteps: msteps,
    ff: ff,
    ffc: ffc,
    context: context
});

// Raphael.js
if(typeof Raphael != "undefined") {
    bindTo("raphael",  // library name
           Raphael.fn) // root object to hook in to
}

// SVG.js
if(typeof SVG != "undefined") {
    var dummy = {};
    bindTo("svg", dummy);
    SVG.extend(SVG.Set, dummy);
    SVG.extend(SVG.Group, dummy);
    SVG.extend(SVG.Element, dummy);
}

// D3.js
if(typeof d3 != "undefined") {
    bindTo("d3", d3.selection.prototype);
    bindTo("d3", d3.selection.enter.prototype);
}

})();
