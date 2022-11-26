let currentColor = chroma.hsv(0,1,0.6);
let strokes = [];

// --------------------------------------------------------

function setCurrentColor(color) {
    currentColor = color;
}


// --------------------------------------------------------
//
// stroke
// 
function stroke(x,y) {
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
            u_color: getCurrentColorRgba()
        })
    })
    gl.disable(gl.BLEND);

}

function rstroke(x,y) {
    strokes.push(x,y);
    stroke(x,y);
}

// --------------------------------------------------------
//
// clearOfflineBuffer
//
function clearOfflineBuffer() {
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


function paintStrokes() {
    let t = performance.now();
    for(let i=0; i+1<strokes.length; i+=2) stroke(strokes[i], strokes[i+1]);
    console.log(performance.now()-t);
}

function clearStrokes() {
    strokes = [];
}