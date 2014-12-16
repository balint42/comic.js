comic.js
=======

Javascript library that acts as plugin for [Raphael.js](http://raphaeljs.com/), [D3.js](http://d3js.org/), [SVG.js](http://svgjs.com/) or as lib for the [HTML5 Canvas](http://www.w3schools.com/html/html5_canvas.asp), providing functions for cartoon style drawing.
Thus the current version support canvas drawing too!

![screenshot](doc/screenshot.png)

Examples
--------
[Raphael.js](http://www.morvai.de/comicjs/index1.html)
[D3.js](http://www.morvai.de/comicjs/index2.html)
[SVG.js](http://www.morvai.de/comicjs/index3.html)
[Canvas](http://www.morvai.de/comicjs/index4.html)

Usage
-----
Simply include `comic.min.js` _after_ including one of the supported libraries ([Raphael.js](http://raphaeljs.com/), [D3.js](http://d3js.org/), [SVG.js](http://svgjs.com/)) - or none of them if you are using a [HTML5 Canvas](http://www.w3schools.com/html/html5_canvas.asp). Then it can be used as follows, assuming that you have a container `div` with id `paper`:

```
// Raphael.js
paper = Raphael("paper", width, height);
stuff = paper.set();
```
or
```
// D3.js
paper = d3.select("#paper").append('svg');
stuff = paper.append("g");
```
or
```
// SVG.js
paper = SVG('paper').size(width, height);
stuff = paper.group();
```
or
```
// canvas
paper = document.getElementById("paper");
ctx = paper.getContext("2d");
// IMPORTANT: here we bind comic.js to the canvas context
COMIC.ctx(ctx);
```
and then for the SVG libraries:
```
// these are the default values if you do not call "init"
COMIC.init({
    ff: 8,      // fuzz factor for line drawing: bigger -> fuzzier
    ffc: 0.1,   // fuzz factor for curve drawing: bigger -> fuzzier
    fsteps: 50, // number of pixels per step: smaller -> fuzzier
    msteps: 4,  // min number of steps: bigger -> fuzzier
});
// lets draw!
stuff.cLine(x1, y1, x2, y2)         // LINE from starting point to end point
    .cTrian(x1, y1, x2, y2, x3, y3) // TRIANGLE over three corner points
    .cRect(x1, y1, width, height)   // RECTANGLE at upper left point with width & height
    .cCircle(x1, y1, r)             // CIRCLE at center point with radius
    .cEllipse(x1, y1, r1, r2)       // ELLIPSE at center point with two radiuses
    ;
// changing the look
stuff.attr({
    "stroke":"#E0AE9F",
    "stroke-width": 2
});
```
or for the canvas:
```
// these are the default values if you do not call "init"
COMIC.init({
    ff: 8,      // fuzz factor for line drawing: bigger -> fuzzier
    ffc: 0.1,   // fuzz factor for curve drawing: bigger -> fuzzier
    fsteps: 50, // number of pixels per step: smaller -> fuzzier
    msteps: 4,  // min number of steps: bigger -> fuzzier
});
// changing the look
ctx.strokeStyle = "#FDD1BD";
ctx.lineWidth = 3;
ctx.globalCompositeOperation = 'destination-over';
// lets draw!
stuff.cLine(x1, y1, x2, y2)         // LINE from starting point to end point
    .cTrian(x1, y1, x2, y2, x3, y3) // TRIANGLE over three corner points
    .cRect(x1, y1, width, height)   // RECTANGLE at upper left point with width & height
    .cCircle(x1, y1, r)             // CIRCLE at center point with radius
    .cEllipse(x1, y1, r1, r2)       // ELLIPSE at center point with two radiuses
    ;
```

All further things should work the default way of your chosen library. I have done little experiments though and errors are probable - please let me know if you encounter any. 

Credits
-------
Inspired by and based on [Jonas Wagner's work](http://29a.ch/2010/2/10/hand-drawn-lines-algorithm-javascript-canvas-html5)
which is based on this [paper](http://iwi.eldoc.ub.rug.nl/FILES/root/2008/ProcCAGVIMeraj/2008ProcCAGVIMeraj.pdf)
