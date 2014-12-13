comic.js
=======

Javascript library that acts as plugin for [Raphael.js](http://raphaeljs.com/), [D3.js](http://d3js.org/), [SVG.js](http://svgjs.com/) and provides functions for cartoon style SVG drawing. Currently it supports only SVG (no canvas), but if someone needs canvas support I might implement it (let me know).

Credits:
Inspired by and based on [Jonas Wagner's work](http://29a.ch/2010/2/10/hand-drawn-lines-algorithm-javascript-canvas-html5)
which is based on this [paper](http://iwi.eldoc.ub.rug.nl/FILES/root/2008/ProcCAGVIMeraj/2008ProcCAGVIMeraj.pdf)

Usage
-----
Simply include `comic.min.js` _after_ including one of the support libraries ([Raphael.js](http://raphaeljs.com/), [D3.js](http://d3js.org/), [SVG.js](http://svgjs.com/)). Then it can be used as follows, assuming that you have a container `div` with id `paper`:

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
and then
```
stuff.cLine(x1, y1, x2, y2)         // starting point to end point
    .cTrian(x1, y1, x2, y2, x3, y3) // three corner points
    .cRect(x1, y1, width, height)   // upper left point and width & height
    .cCircle(x1, y1, r)             // center point and radius
    .cEllipse(x1, y1, r1, r2)       // center point and two radiuses
    ;
stuff.attr({
    "stroke":"#E0AE9F",
    "stroke-width": 2
});
```

All further things should work the default way of your chosen library. I have done little experiments though and errors are probable - please let me know if you encounter any. Examples with all three libraries can be found here:

[Raphael.js](http://www.morvai.de/comicjs/index1.html)
[D3.js](http://www.morvai.de/comicjs/index2.html)
[SVG.js](http://www.morvai.de/comicjs/index3.html)
