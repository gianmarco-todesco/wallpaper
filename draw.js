"use strict";
let currentColor = chroma.hsv(0,1,0.6);
let currentThickness = 5;
let strokes = [];
let undoneStrokes = [];
let currentBgColor = chroma.hsv(0,1,0);

class Stroke {
    constructor(color, thickness) {
        let frgb = color.rgb();    
        this.rgba =  [frgb[0]/255,frgb[1]/255,frgb[2]/255,1];
        this.thickness = thickness;
        this.pts = []; //  x,y,m
    }
    // add a control point; call f(x,y) with all the points actually added
    addPoint(x,y,f) {
        let n = this.pts.length;
        let m = 0;
        if(n > 0) {
            let oldx = this.pts[n-3], oldy = this.pts[n-2];
            let dx = x-oldx;
            let dy = y-oldy;
            let d = Math.sqrt(dx*dx+dy*dy);
            if(d<0.001) return;
            if(d>3) {
                m = Math.ceil(d/3);
                for(let i=0; i<m; i++) {
                    let t = i/m;
                    let xi = oldx + dx * t; 
                    let yi = oldy + dy * t;
                    f(xi,yi); 
                }
            }
        }
        this.pts.push(x,y,m);
        f(x,y);
    }

    draw(f) {
        let oldx, oldy;
        for(let i=0; i+2<this.pts.length; i+=3) {
            let x = this.pts[i], y = this.pts[i+1], m = this.pts[i+2];
            for(let j=0; j<m; j++) {
                let t = j/m;
                f(oldx * (1-t) + x * t, oldy * (1-t) + y * t);
            }
            f(x,y);
            oldx = x; oldy = y;
        }
    }
}

// --------------------------------------------------------

function setCurrentColor(color) {
    currentColor = color;
}

function setCurrentThickness(thickness) {
    currentThickness = thickness;
}

function setBackgroundColor(color) {
    currentBgColor = color;
    clearOfflineBuffer();
    paintStrokes();
}

function beginPaint() {
    twgl.bindFramebufferInfo(gl, offlineBuffer);
    gl.enable(gl.BLEND);
    // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE);
    GU.viewMatrix = worldToBufferMatrix;
}

function endPaint() {
    gl.disable(gl.BLEND);
}

// --------------------------------------------------------
//
// stroke
// 
function paintDot(x,y, rgba, thickness) {
    // draw offline buffer    
    const r = thickness;
    let pp = sg.getCellOrbit([x,y]);
    pp.forEach(p=>{
        m4.scale(
            m4.translate(worldToBufferMatrix, [p[0],p[1],0]), 
            [r,r], GU.tempMatrix);
        GU.filledSquare.draw(GU.texturedMaterial, {
            u_matrix: GU.tempMatrix,
            u_texture: texture,
            u_color: rgba // getCurrentColorRgba()
        })
    })
    
}

function paintStroke(stroke) {
    beginPaint();
    stroke.draw((x,y) => paintDot(x,y,stroke.rgba, stroke.thickness));
    endPaint();
}

function beginStroke(x,y) { 
    beginPaint();
    let frgb = currentColor.rgb();
    let rgba = [frgb[0]/255,frgb[1]/255,frgb[2]/255,1];

    let stroke = new Stroke(currentColor, currentThickness);    
    stroke.addPoint(x,y,(x,y)=>paintDot(x,y,stroke.rgba, stroke.thickness))
    strokes.push(stroke); 
    undoneStrokes = [];
    endPaint();
}

function dragStroke(x,y) {
    beginPaint();
    if(strokes.length == 0) return;
    let stroke = strokes[strokes.length-1];
    stroke.addPoint(x,y,(x,y)=>paintDot(x,y,stroke.rgba,stroke.thickness))
}

function undo() {
    if(strokes.length == 0) return;
    let stroke = strokes.pop();
    undoneStrokes.splice(0, 0, stroke);
    clearOfflineBuffer();
    paintStrokes();
}

function redo() {
    if(undoneStrokes.length == 0) return;
    let stroke = undoneStrokes[0];
    undoneStrokes.splice(0,1);
    strokes.push(stroke);
    beginPaint();
    stroke.draw((x,y) => paintDot(x,y,stroke.rgba,stroke.thickness));
    endPaint();
}


function clearOfflineBuffer() {
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);
    gl.clearColor(...currentBgColor.rgba().map(c=>c/255.0));
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function paintStrokes() {
    let t = performance.now();
    beginPaint();
    strokes.forEach(stroke => stroke.draw((x,y) => paintDot(x,y,stroke.rgba, stroke.thickness)));
    // for(let i=0; i+1<strokes.length; i+=2) stroke(strokes[i], strokes[i+1]);
    endPaint();
    console.log(performance.now()-t);
}

function clearStrokes() {
    strokes = [];
}

function clearAll() {
    strokes = [];
    undoneStrokes = [];
    clearOfflineBuffer();
}