/**
 * @brief Comic style version of common drawing functions.
 * 
 * Comic style version of common drawing functions, that is
 * implemented as library agnostic JS extension. Only assuming
 * that given "lib" can be extended the JS way (setting properties)
 * and that "path" is a drawing method which understands standard
 * SVG path format strings.
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
(function() {
/**
 * Binds comic drawing functions to the given library using the
 * given method to draw svg paths.
 *
 * @param lib root object to hook in to
 * @param path method to draw svg paths
 * @return void
 */
var bindTo = function(lib, path) {
    /**
     * @var int for each amount of below units make one step
     */
    var unitsPerStep = 50;
    /**
     * @var int min number of steps
     */
    var minSteps = 4;
    /**
     * @var float fuzzyness factor
     */
    var ff = 8.0;
    /**
     * @var float fuzzyness factor for circle & ellipse
     */
    var ffc = ff / 75;
    
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
        var fh = ffc * rh;
        var fv = ffc * rv;
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

            path.call(this,
                ["M", x0, y0, "Q", fuzz(x0, fh), fuzz(y0, fv), x1, y1].join(" ")
            );
        }
        
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
        var f = ffc * r;
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

            path.call(this,
                ["M", x0, y0, "Q", fuzz(x0, f), fuzz(y0, f), x1, y1].join(" ")
            );
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
        lib.cLine.call(this, x0, y0, x1, y1);
        lib.cLine.call(this, x1, y1, x2, y2);
        lib.cLine.call(this, x2, y2, x0, y0);
        
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
        lib.cLine.call(this, x0, y0, x1, y0);
        lib.cLine.call(this, x1, y0, x1, y1);
        lib.cLine.call(this, x1, y1, x0, y1);
        lib.cLine.call(this, x0, y1, x0, y0);
        
        return this;
    }
    
    /**
     * Draw a comic style / hand drawn line
     * 
     * @param x0 x start
     * @param y0 y start
     * @param x1 x end
     * @param y1 y end
     * @return native library object
     */
    lib.cLine = function(x0, y0, x1, y1) {
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
        var dx = x1 - x0;
        var dy = y1 - y0;
        var d = Math.sqrt(dx * dx + dy * dy);
        var steps = d / unitsPerStep;
        if(steps < minSteps) {
            steps = minSteps;
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
            path.call(this,
                ["M", xt0, yt0, "Q", fuzz(xt0, ff), fuzz(yt0, ff), xt1, yt1].join(' ')
            );
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
    
    // -----------------------hack for SVG.JS---------------------------
    // if no "path" method given, try calling "path" on "this"
    var callPath = function(pathStr) {
        this.path(pathStr)
    }
    path = (typeof path == "undefined") ?
        callPath : path;
}


// Raphael.js
if(typeof Raphael != "undefined") {
    bindTo(Raphael.fn,          // root object to hook in to
           Raphael.fn.path); // method to draw svg paths
}

// SVG.js
if(typeof SVG != "undefined") {
    var dummy = {};
    bindTo(dummy);
    SVG.extend(SVG.Group, dummy);
    bindTo(dummy);
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
