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
var ffc = ff / 75;
/**
 * @var object 2d canvas context (if any)
 */
var context = undefined;
/**
 * @var function code to execute when finished drawing a shape
 */
var finished = function() {};
/**
 * @var bool whether begun drawing a shape
 */
var begun = false;

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
        bindTo(C.context);
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
 * @param lib root object to hook in to
 * @param path method to draw svg paths (optional)
 * @return void
 */
var bindTo = function(lib, pathFn) {
    /**
     * hand draw an ellipse
     * 
     * @param x x center
     * @param y y center
     * @param rh horizontal radius
     * @param rv vertical radius
     * @return native library object
     */
    lib.cEllipse = function(x, y, rh, rv) {
        // number of steps
        var steps = Math.ceil(Math.pow(rh * rv, 0.25) * 3);
        // fuzzyness dependent on radius
        var fh = C.ffc * rh;
        var fv = C.ffc * rv;
        // distortion of the ellipse
        var xs = 0.95 + Math.random() * 0.1;
        var ys = 0.95 + Math.random() * 0.1;
        var rxs = rh * xs;
        var rys = rv * ys;
        // lenght of one segment
        var segLength = Math.PI * 2 / steps;

        var x1 = x + rxs; // initial values for i = 0
        var y1 = y;           // initial values for i = 0
        var t1 = 0; var t0, x0, y0;
        for(var i = 1; i <= steps; i++)
        {
            t1 = t1 + segLength;
            t0 = t1 - segLength;
            var x0 = x1;
            var y0 = y1;
            var x1 = x + Math.cos(t1) * rxs;
            var y1 = y + Math.sin(t1) * rys;

            path.call(this, x0, y0, fuzz(x0, fh), fuzz(y0, fv), x1, y1);
        }
        
        finished.call(this);
        return this;
    }
    
    /**
     * hand draw a circle
     * 
     * @param x x center
     * @param y y center
     * @param r radius
     * @return native library object
     */
    lib.cCircle = function(x, y, r) {
        // number of steps
        var steps = Math.ceil(Math.sqrt(r) * 3);
        // fuzzyness dependent on radius
        var f = C.ffc * r;
        // distortion of the circle
        var xs = 0.95 + Math.random() * 0.1;
        var rxs = r * xs;
        var rys = r * (2.0 - xs);
        // lenght of one segment
        var segLength = Math.PI * 2 / steps;

        var x1 = x + rxs; // initial values for i = 0
        var y1 = y;           // initial values for i = 0
        var t1 = 0; var t0, x0, y0;
        for(var i = 1; i <= steps; i++)
        {
            t1 = t1 + segLength;
            t0 = t1 - segLength;
            x0 = x1;
            y0 = y1;
            x1 = x + Math.cos(t1) * rxs;
            y1 = y + Math.sin(t1) * rys;

            path.call(this, x0, y0, fuzz(x0, f), fuzz(y0, f), x1, y1);
        }
        
        finished.call(this);
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
        cLine.call(this, x0, y0, x1, y1);
        cLine.call(this, x1, y1, x2, y2);
        cLine.call(this, x2, y2, x0, y0);
        
        finished.call(this);
        return this;
    }

    /**
     * Draw a rectangle using line function
     * 
     * @param x0 x upper left corcer
     * @param y0 y upper left corner
     * @param width width of the rectangle
     * @param height height of the rectangle
     * @return native library object
     */
    lib.cRect = function(x0, y0, width, height) {
        var x1 = x0 + width;
        var y1 = y0 + height;
        cLine.call(this, x0, y0, x1, y0);
        cLine.call(this, x1, y0, x1, y1);
        cLine.call(this, x1, y1, x0, y1);
        cLine.call(this, x0, y1, x0, y0);
        
        finished.call(this);
        return this;
    }
    
    /**
     * WRAPPER for real, interal "cLine"
     * Draw a comic style / hand drawn line
     * 
     * @param x0 x start
     * @param y0 y start
     * @param x1 x end
     * @param y1 y end
     * @return native library object
     */
    lib.cLine = function(x0, y0, x1, y1) {
        cLine.call(this, x0, y0, x1, y1);
        
        finished.call(this);
        return this;
    }
    
    /**
     * INTERNAL version that does not call "finished"
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
        this.moveTo(x0, y0);
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
        var dx = x1 - x0;
        var dy = y1 - y0;
        var d = Math.sqrt(dx * dx + dy * dy);
        var steps = d / C.fsteps;
        if(steps < C.msteps) {
            steps = C.msteps;
        }
        // draw line step by step using quadratic Bézier path
        var xt1 = handMovement(x0, x1, 0); // bezier control point
        var yt1 = handMovement(y0, y1); // bezier control point (reuse t0)
        for(var i = 1; i <= steps; i++) {
            t1 = i / steps;
            var xt0 = xt1; // bezier control point
            var yt0 = yt1; // bezier control point
            var xt1 = handMovement(x0, x1, t1); // bezier end point
            var yt1 = handMovement(y0, y1); // bezier end point (reuse t1)
            
            path.call(this, xt0, yt0, fuzz(xt0, C.ff), fuzz(yt0, C.ff), xt1, yt1);
        }
        
        return this;
    }
    
    /**
     * Shift given value randomly by fuzzyness factor f
     * @param val value to shift randomly
     * @param f fuzzyness factor
     * @return number
     */
    var fuzz = function(val, f) {
        return val + f * (Math.random() - 0.5);
    }
    
    // ----------------------set drawing method-------------------------
    // if no "path" method given, try calling "path" on "this"
    var callPath = function(x0, y0, cx, cy, x1, y1) {
        this.path(
            ["M", x0, y0, "Q", cx, cy, x1, y1].join(' ')
        );
    }
    // if 2d canvas context given, use context method
    var ctxPath = function(x0, y0, cx, cy, x1, y1) {
        if(!begun) {
            begun = true;
            this.beginPath();
        }
        this.moveTo(x0, y0);
        this.quadraticCurveTo(cx, cy, x1, y1);
    }
    // if no 2d canvas context given, but "path" method given
    var svgPath = function(x0, y0, cx, cy, x1, y1) {
        path.call(this,
            ["M", x0, y0, "Q", cx, cy, x1, y1].join(' ')
        );
    }
    // set the right method
    if(typeof C.context != "undefined") {
        path = ctxPath;
        finished = function() {
            this.stroke();
            begun = false;
        };
    }
    else {
        path = (typeof pathFn == "undefined") ? callPath : svgPath;
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
    bindTo(Raphael.fn,       // root object to hook in to
           Raphael.fn.path); // method to draw svg paths
}

// SVG.js
if(typeof SVG != "undefined") {
    var dummy = {};
    bindTo(dummy);
    SVG.extend(SVG.Set, dummy);
    SVG.extend(SVG.Group, dummy);
    SVG.extend(SVG.Element, dummy);
}

// D3.js
// wrapper for creating paths with d3
var d3path = function(pathStr) {
    this.append('path').attr('d', pathStr);
}
if(typeof d3 != "undefined") {
    bindTo(d3.selection.prototype, d3path);
    bindTo(d3.selection.enter.prototype, d3path);
}

})();
