'use strict';

const m4 = twgl.m4;
let gl;
let bufferInfo, bufferInfo2;
let offlineBuffer;
let worldToBufferMatrix;
let texture, uff;
let px = 200, py = 250;
let mouseDown = false;
let worldPolygon;
let phi = 0.2; 
const margin = 0;
let mousePos = [0,0];
let sg;
// let canvasPos = [0,0];
let downloadRequested = false;
let groupsTable = {};
let prova;
let downloadLink;
let globalSymmetrySymbols;

// --------------------------------------------------------
/*
function getCurrentColorRgba() {
    let rgb = currentColor.rgb();
    return [rgb[0]/255,rgb[1]/255,rgb[2]/255,1];
}

// --------------------------------------------------------
*/


function createDynamicTexture() {
  const attachments = [
    {
      attach: gl.COLOR_ATTACHMENT0,
      wrap: gl.REPEAT,
      min: gl.NEAREST,
      mag: gl.NEAREST,
    },
  ]
  offlineBuffer = twgl.createFramebufferInfo(gl, attachments, 1024, 1024);
  let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE){
    console.warn("Could not create framebuffer");
  } 
}

// --------------------------------------------------------
//
// Document loaded
//
document.addEventListener('DOMContentLoaded', ()=>{
    initialize();
    function animate() {
        render();
        requestAnimationFrame(animate);
    }
    animate();
});

// --------------------------------------------------------
// resize
window.addEventListener('resize', (event) => {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  sg.setCanvasSize(gl.canvas.width, gl.canvas.height, margin);    
  worldToBufferMatrix = sg.getWorldToBufferMatrix();
  worldPolygon = sg.createWorldPolygon(gl, worldPolygon);
  // computeCanvasPos();
});

// --------------------------------------------------------
//
// initialize
//
function initialize() {
    twgl.setDefaults({attribPrefix: "a_"});
    gl = document.getElementById("renderCanvas").getContext("webgl", {
        alpha: false,
        antialias: true,
    });
    twgl.resizeCanvasToDisplaySize(gl.canvas);

    GU.init(gl);
  
    createDynamicTexture();
    //gl.enable(gl.CULL_FACE);
    // clear offline buffer  
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);

    let textureCanvas = GU.createBlurredDotTexture();
    texture = twgl.createTexture(gl, {
        src: textureCanvas,
        min: gl.LINEAR,
    });

    /*
    function updateTexture() {
        gl.bindTexture(gl.TEXTURE_2D, textures.tx);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, txCtx.canvas);
    }
    */

    setCurrentGroup("P1");

    initPointerEvents(gl.canvas);
    createControls();
    initButtons();

    prova =  new DynamicColoredShape({ 
        gl, n: 1000, verb: gl.LINES});
    globalSymmetrySymbols = new DynamicColoredShape({ 
        gl, n: 10000, verb: gl.LINES});

}

function foo(L) {
    globalSymmetrySymbols.idx = 0;
    let sgh = new SymmetryGroupHelper(sg,globalSymmetrySymbols);
    sgh.addSymbols(L);
}

function drawMyTest() 
{
    // globalSymmetrySymbols.update();    
    globalSymmetrySymbols.draw(GU.coloredMaterial, { u_matrix: GU.viewMatrix});

    return;


    let material = GU.simpleMaterial;
    let uniforms = {
        u_matrix : GU.viewMatrix, 
        u_color : [1,1,0,1]
    }
    let gl = mytest.gl;
    gl.useProgram(material.programInfo.programInfo.program);
    twgl.setBuffersAndAttributes(
        gl, 
        material.programInfo.programInfo, 
        mytest.bufferInfo);
    for(let u in uniforms) material.uniforms[u] = uniforms[u];
    twgl.setUniforms(material.programInfo.programInfo, material.uniforms);
    twgl.drawBufferInfo(gl, mytest.bufferInfo, gl.LINE_STRIP, 4);

}

// --------------------------------------------------------
//
// initPointerEvents
// 
function initPointerEvents(canvas) {
    let dx, dy;
    canvas.addEventListener('pointerdown', e => {
        dx = e.offsetX - e.clientX;
        dy = e.offsetY - e.clientY;
        
      // console.log(e);
        mouseDown = true;
        [px,py] = [e.clientX + dx, gl.canvas.height - (e.clientY + dy)];
        if(sg) beginStroke(px,py);
        document.addEventListener('pointermove', onPointerDrag);
        document.addEventListener('pointerup', onPointerUp);        
    });   

    function onPointerDrag(e) {   
        let [oldx,oldy] = [px,py];     
        [px,py] = [e.clientX + dx, gl.canvas.height - (e.clientY + dy)];
        if(mouseDown) dragStroke(px,py);
    }
    
    function onPointerUp(e) {
        mouseDown = false;
        document.removeEventListener('pointermove', onPointerDrag);
        document.removeEventListener('pointerup', onPointerUp);
    }
    
}


// --------------------------------------------------------

function setCurrentGroup(name) {
    console.log(this);
    if(this) this.classList.add("current");
    clearOfflineBuffer();
    let group = getGroup(name);
    if(!group) {
        console.warn("Group not found:" + name);
        return;
    }
    sg = group;
    sg.setCanvasSize(gl.canvas.width, gl.canvas.height, margin);
    worldToBufferMatrix = sg.getWorldToBufferMatrix();
    worldPolygon = sg.createWorldPolygon(gl, worldPolygon);
    paintStrokes();
    if(globalSymmetrySymbols)
        globalSymmetrySymbols.clear();
}


// --------------------------------------------------------

function getFoundamentalDomainBuffer() {
    if(!sg) return null;
    let gName = sg.constructor.name;
    let buffer = groupsTable[gName];
    if(buffer) return buffer;
    let foundamentalDomain = sg.foundamentalDomain;
    if(!foundamentalDomain) return null;
    let shape = new Shape({gl, 
        arrays: {
            position: { numComponents:2, data: foundamentalDomain },
        },
        verb: gl.TRIANGLE_STRIP
    });
    groupsTable[gName] = shape;
    return shape;
}

// --------------------------------------------------------
//
// render
//
function render() {

    let matrix = m4.identity();

    // draw canvas
    twgl.bindFramebufferInfo(gl);

    // resize
    twgl.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    let viewMatrix = GU.viewMatrix = m4.ortho(
        0, gl.canvas.clientWidth, 
        0,  gl.canvas.clientHeight, 
        -1, 1);

    // clear
    gl.clearColor(0.0, 0.0, 0.0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    //if(!worldPolygon) {
    //}

    if(worldPolygon) {
        worldPolygon.draw(GU.texturedMaterial, { 
            u_matrix : viewMatrix, 
            u_texture : offlineBuffer.attachments[0],
            u_color: [1,1,1,1]
        });
        if(downloadRequested) _doDownload();


        // symmetry symbols
        if(globalSymmetrySymbols)
            globalSymmetrySymbols.draw(
                GU.coloredLineMaterial, { u_matrix: GU.viewMatrix});


        // translation cell
        GU.drawParallelogram(sg.cell[0], sg.a, sg.b, [0.5,0.5,0.5,1]);

        let foundamentalCellBuffer = getFoundamentalDomainBuffer();
        if(foundamentalCellBuffer) {
            let [x0,y0] = sg.cell[0];
            const [ax,ay] = sg.a;
            const [bx,by] = sg.b;
            let matrix = m4.multiply(m4.multiply(
                GU.viewMatrix,
                [ax,ay,0,0, bx,by,0,0, 0,0,1,0, x0,y0,0,1]),
                [0.5,0,0,0, 0,0.5,0,0, 0,0,1,0, 0.5,0.5,0,1]);
            
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            foundamentalCellBuffer.draw(GU.simpleMaterial, {
                u_matrix : matrix,
                u_color : [0.5,0.5,0.5,0.25]
            })
            gl.disable(gl.BLEND);
        }

        const [u0,u1,v0,v1] = sg._computeUVRange();

        if(margin>0) {
            // outer limit
            const [x0,y0] = sg.cell[0];
            const [ax,ay] = sg.a;
            const [bx,by] = sg.b;


            GU.drawParallelogram(
                [x0+ax*u0+bx*v0, y0+ay*u0+by*v0], 
                [ax*(u1-u0),ay*(u1-u0)],
                [bx*(v1-v0),by*(v1-v0)],
                [0.75,0.75,0.75,1]);
                        
            // canvas border (with margin)
            const mrg = margin;
            GU.drawRect(mrg,mrg,gl.canvas.width-mrg*2,gl.canvas.height-mrg*2, [1,0,0,1]);        
        }

        /*
        GU.drawDot(sg.cell[0][0],sg.cell[0][1], [1,0,0,1]);
        GU.drawDot(sg.cell[1][0],sg.cell[1][1], [0,1,0,1]);
        GU.drawDot(sg.cell[2][0],sg.cell[2][1], [0,0,1,1]);


        let pts = sg.getCellOrbit(mousePos);
        pts.forEach((p)=> GU.drawDot(p[0],p[1], [1,0,0,1]));
        */

    }

    let radius = 100; // 50+40*Math.sin(performance.now()*0.001);

    /*
    prova.idx = 0;
    sg.addEntities(prova);
    prova.update();    
    prova.draw(GU.coloredMaterial, { u_matrix: GU.viewMatrix});
    */
    // drawMyTest();

}

// --------------------------------------------------------

function download() {
    downloadRequested = true;
}


function _doDownload() {
    downloadRequested = false;
    let imgData = gl.canvas.toDataURL("image/png");
    if(!downloadLink) downloadLink = document.createElement('a');
    downloadLink.setAttribute('download', 'mosaico.png');
    downloadLink.setAttribute('href', imgData);
    downloadLink.click();
}

function uff2() {
    let t = performance.now();
    const m = 1000;
    for(let i=0;i<m;i++) {
        let t = i/(m-1);
        stroke(100 + t*100, 100 + 100*Math.sin(Math.PI*4*t));
    }
    console.log(performance.now() - t);
}