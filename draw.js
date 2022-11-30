"use strict";
let currentColor = chroma.hsv(0,1,0.6);
let strokes = [];
let undoneStrokes = [];
let currentBgColor = chroma.hsv(0,1,0);

class Stroke {
    constructor(color) {
        let frgb = color.rgb();    
        this.rgba =  [frgb[0]/255,frgb[1]/255,frgb[2]/255,1];
        this.pts = []; //  x,y,m
    }
    // add a control point; call f(x,y) with all actual point
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

function setBackgroundColor(color) {
    currentBgColor = color;
    clearOfflineBuffer();
    paintStrokes();
}

// --------------------------------------------------------
//
// stroke
// 
function paintDot(x,y,rgba) {
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    GU.viewMatrix = worldToBufferMatrix;
    const r = 5;
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
    gl.disable(gl.BLEND);
}

function paintStroke(stroke) {
    stroke.draw((x,y) => paintDot(x,y,stroke.rgba));
}

function beginStroke(x,y) { 
    let frgb = currentColor.rgb();
    let rgba = [frgb[0]/255,frgb[1]/255,frgb[2]/255,1];

    let stroke = new Stroke(currentColor);    
    stroke.addPoint(x,y,(x,y)=>paintDot(x,y,stroke.rgba))
    strokes.push(stroke); 
    undoneStrokes = [];
}

function dragStroke(x,y) {
    if(strokes.length == 0) return;
    let stroke = strokes[strokes.length-1];
    stroke.addPoint(x,y,(x,y)=>paintDot(x,y,stroke.rgba))
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
    stroke.draw((x,y) => paintDot(x,y,stroke.rgba))
}


function clearOfflineBuffer() {
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);
    gl.clearColor(...currentBgColor.rgba().map(c=>c/255.0));
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function paintStrokes() {
    let t = performance.now();
    strokes.forEach(stroke => stroke.draw((x,y) => paintDot(x,y,stroke.rgba)));
    // for(let i=0; i+1<strokes.length; i+=2) stroke(strokes[i], strokes[i+1]);
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