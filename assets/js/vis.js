// svg namespace uri
const svguri = "http://www.w3.org/2000/svg";

const testpiedata = [
    {per:12.5, text:"testing one", color:"#00aa00"},
    {per:12.5, text:"testing two", color:"#aa0000"},
    {per:25, text:"testing three", color:"#aa00aa"},
    {per:50, text:"testing four", color:"#0000aa"},
];

const testbardata = [
    {count:200, text:"testing data", color:"#00aa00"},
    {count:15, text:"data", color:"#aa0000"},
    {count:15, text:"testing data", color:"#aa00aa"},
];

const testformatbardata = {
    "testing one":25,
    "testing two":25,
    "testing three":50,
    "testing four":100,
};

class Vector {
    constructor (x, y) {
        x = (x===undefined?0:x);
        y = (y===undefined?x:y);
        this.x = x;
        this.y = y;
    }
    add (vec) {
        return new Vector(this.x+vec.x, this.y+vec.y);
    }
    sub (vec) {
        return new Vector(this.x-vec.x, this.y-vec.y);
    }
    mul (scal) {
        return new Vector(this.x*scal, this.y*scal);
    }
    div (scal) {
        return new Vector(this.x/scal, this.y/scal);
    }
    mag () {
        return Math.sqrt(Math.pow(this.x, 2)+Math.pow(this.y, 2));
    }
    norm () {
        return this.div(this.mag());
    }
    limit (n) {
        if (this.mag() <= n) {
            return;
        }
        v = this.norm().mul(n);
        this.x = v.x;
        this.y = v.y;
    }
    rot (n) {
        n = (Math.PI / 180) * n
        return new Vector(this.x * Math.cos(n) - this.y * Math.sin(n), this.x * Math.sin(n) + this.y * Math.cos(n));
    }
}

class Color {
    constructor (r, g, b) {
        this.r = r===undefined?randrange(0, 255):r;
        this.g = g===undefined?randrange(0, 255):g;
        this.b = b===undefined?randrange(0, 255):b;
        this.limit(0, 255);
    }
    low (v) {
        this.r = Math.max(this.r, v);
        this.g = Math.max(this.g, v);
        this.b = Math.max(this.g, v);
    }
    high (v) {
        this.r = Math.min(this.r, v);
        this.g = Math.min(this.g, v);
        this.b = Math.min(this.b, v);
    }
    limit (l, h) {
        this.low(l);
        this.high(h);
    }
    hex (compind) {
        const conv = "0123456789abcdef";
        let x = "";
        switch (compind) {
            case 0:
                x = conv[(this.r-this.r%16)/16]+conv[this.r%16];
                break;
            case 1:
                x = conv[(this.g-this.g%16)/16]+conv[this.g%16];
                break;
            case 2:
                x = conv[(this.b-this.b%16)/16]+conv[this.b%16];
                break;
            default:
                break;
        }
        return x;
    }
    toString () {
        return "#"+this.hex(0)+this.hex(1)+this.hex(2);
    }
}

// svg element
const svg = document.getElementById("out");

const globalwidth = window.innerWidth - 20;

// sets svg dimensions
svg.setAttribute("width", globalwidth);
svg.setAttribute("viewBox", "0 0 "+globalwidth+" 100");

// backing group
const backings = svg.children[0];

for (let i = 0; i < backings.children.length; i ++) {
    backings.children[i].setAttribute("width", globalwidth);
}

// pie chart group
const piechart = svg.children[1];

// bar chart group
const barchart = svg.children[2];

// some constants
const dulltext = "#999999";

// makes a circle
function circle (cx, cy, r, fill) {
    const c = document.createElementNS(svguri, "circle");
    c.setAttribute("transform", "translate("+cx+" "+cy+")");
    c.setAttribute("cx", 0);
    c.setAttribute("cy", 0);
    c.setAttribute("r", r);
    c.setAttribute("fill", fill===undefined?"#000000":fill);
    return c;
}

// makes a rect
function rect (x, y, w, h, fill) {
    const r = document.createElementNS(svguri, "rect");
    r.setAttribute("transform", "translate("+x+" "+y+")");
    r.setAttribute("width", w);
    r.setAttribute("height", h);
    r.setAttribute("fill", fill===undefined?"#000000":fill);
    return r;
}

// makes text
function text (text, x, y, fill, s, hf) {
    const t = document.createElementNS(svguri, "text");
    t.innerHTML = text;
    t.setAttribute("transform", "translate("+x+" "+y+")");
    if (s !== undefined) {
        t.setAttribute(hf?"textLength":"height", s);
    }
    t.setAttribute("fill", fill);
    return t;
}

// makes polyline
function lpoly (fill, points) {
    const p = document.createElementNS(svguri, "polyline");
    p.setAttribute("points", points.join(" "));
    p.setAttribute("stroke", fill);
    p.setAttribute("fill", "none");
    return p;
}

// very helpful code found on stack overflow
function polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

    return {
        x: centerX + (radius * Math.cos(angleInRadians)),
        y: centerY + (radius * Math.sin(angleInRadians))
    };
}

// more code from stack overflow, bit of fixing was done to it
function describeArc(x, y, radius, startAngle, endAngle){

    var start = polarToCartesian(x, y, radius, endAngle);
    var end = polarToCartesian(x, y, radius, startAngle);

    var largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    var d = [
        "M", start.x, start.y,
        "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
    ].join(" ");

    d += " L 50 50";

    return d;       
}

// gets pie chart clip-path property
function getpieclip (per) {
    const rot = per*360/100;
    return "path('"+describeArc(50, 50, 50, 0, rot)+"')";
}

// makes the pie chart
function makepie (data) {
    piechart.replaceChildren();
    let start = 0;
    let y = 15;
    let lines = [];
    for (let i = 0; i < data.length; i ++) {
        const section = data[i];
        const c = circle(50, 50, 50, section.color);
        c.setAttribute("style", "clip-path:"+getpieclip(section.per)+";z-index:-1;");
        c.setAttribute("transform", c.getAttribute("transform")+" rotate("+start+")");
        const rv = start+(section.per*3.6)/2;
        let v = new Vector(0, 1).rot(rv-180).mul(25);
        v.x += 50;
        v.y += 50;
        start += section.per * 3.6;
        piechart.appendChild(c);
        const t = document.createElementNS(svguri, "text");
        t.innerHTML = section.text + " - " + section.per + "%";
        t.setAttribute("transform", "translate(110 "+y+")");
        t.setAttribute("fill", section.color);
        t.setAttribute("height", 10);
        y += 15;
        piechart.appendChild(t);
        const points = [v.x, v.y, v.x+25, y-20, 105, y-20];
        const p = lpoly(dulltext, points);
        p.setAttribute("style", "z-index:1;");
        lines.push(p);
    }
    for (const i in lines) {
        piechart.appendChild(lines[i]);
    }
}

// makes a bar chart
function makebar (data) {
    barchart.replaceChildren();
    const w = 50;
    let x = 5;
    for (let i = 0; i < data.length; i ++) {
        const section = data[i];
        const tpl = section.text.length*15/4;
        const cl = section.value.toString().length;
        // console.log(tpl, tpl-w/2, section.text.length, x, cl, cl*15/2);
        const r = rect(x+tpl-w/2, 100-section.count, w, section.count, section.color);
        barchart.appendChild(r);
        let t = text(section.text, x, 115, /*section.color*/dulltext, tpl*2, true);
        barchart.appendChild(t);
        t = text(section.value, x+tpl-(cl*7.5/2), 95-section.count, dulltext, cl*7.5, true);
        barchart.appendChild(t);
        x += Math.max(section.text.length*15/1.5, w)+5;
    }
}

// some mdn code
function randrange (min, max) {
	min = Math.ceil(min);
	max = Math.floor(max);
	return Math.floor(Math.random() * (max - min) + min);
}

// gets a random hex value
function arr2hex (arr) {
    const cd = {0:"0", 1:"1", 2:"2", 3:"3", 4:"4", 5:"5", 6:"6", 7:"7", 8:"8", 9:"9", 10:"a", 11:"b", 12:"c", 13:"d", 14:"e", 15:"f"};
    let f = "";
    for (let i = 0; i < arr.length; i ++) {
        let v = arr[i];
        r = v % 16;
        v -= r;
        v /= 16;
        f += cd[v]+cd[r];
    }
    return f;
}

// gets random hex color code
function getrandcolor () {
    let c = new Color();
    c.limit(100, 200);
    return c.toString();
}

// gets random color that is very bright
function getrandcolorbright () {
    let comp = [];
    let on = 0;
    for (let i = 0; i < 3; i ++) {
        if (Math.random() >= 0.5 || (i === 2 && on === 0)) {
            on += 1;
            comp.push(255);
        } else {
            comp.push(0);
        }
        if (on === 2 && i < 2) {
            comp.push(0);
            break;
        }
    }
    return "#" + arr2hex(comp);
}

// formats data for the pie chart
function formatpie (data) {
    let output = [];
    let other = 0;
    for (let i = 0; i < data.length; i ++) {
        const dat = data[i];
        console.log(dat.count, "dc");
        // checks if there is space for the slice
        if (dat.count < 15 && output.length >= 5) {
            other += dat.count;
            continue;
        }
        output.push({per:dat.count, text:dat.name, color:getrandcolor()});
    }
    // adds other slice
    if (other > 0) {
        output.push({per:other, text:"other", color:"#aa8800"});
    }
    return output;
}

// converts dictionary to sorted list
function sortjsdata (data) {
    let output = [];
    for (const key in data) {
        output.push({name:key, count:data[key]});
    }
    output.sort((a, b) => {return b.count-a.count});
    return output;
}

// formats data for bar chart
function formatbar (data) {
    data = sortjsdata(data);
    let output = [];
    let other = 0;
    let maxv = data[0].count;
    for (let i = 0; i < data.length; i ++) {
        const dat = data[i];
        if (data.count < 15 && output.length >= 5) {
            other += dat.count;
            continue;
        }
        output.push({count:dat.count, value:dat.count, text:dat.name, color:getrandcolor()});
    }
    // adds other bar
    if (other > 0) {
        output.push({count:other, text:"other", color:"#aa8800"});
        if (other > maxv) {
            maxv = other;
        }
    }
    for (let i = 0; i < output.length; i ++) {
        let v = output[i].count;
        output[i].count = v*100/maxv;
    }
    return output;
}

// renders visualization
function render (jsdata, jsordered) {
    makepie(testpiedata);
    // renders the pie chart
    // makepie(formatpie(jsordered));
    // makebar(testbardata);
    makebar(formatbar(testformatbardata));
    // renders the bar chart
    // makebar(formatbar(jsdata));
}