'use strict';
const m4 = twgl.m4;
let gl;
let programInfo, programInfo2;
let bufferInfo, bufferInfo2;
let offlineBuffer;
let worldToBufferMatrix;
let texture, uff;
let px = 200, py = 250;
let mouseDown = false;
let worldPolygon;
let phi = 0.2; // 2.18; // performance.now()*0.00002;  
const margin = 0;
let mousePos = [0,0];
let sg;
let canvasPos = [0,0];
let currentColor = chroma.hsv(0,1,0.6);

function getCurrentColorRgba() {
    let rgb = currentColor.rgb();
    return [rgb[0]/255,rgb[1]/255,rgb[2]/255,1];
}
//
// computeCanvasPos
// 
function computeCanvasPos() {
  let el = gl.canvas;
  canvasPos[0] = 0;
  canvasPos[1] = 0;
  while(el) {
    canvasPos[0] += el.offsetLeft;
    canvasPos[1] += el.offsetTop;
    el = el.parentElement;    
  }
}

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
    console.log("Invalid framebuffer");
  } else{
    console.log("Success creating framebuffer");
  }

}

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

// resize
window.addEventListener('resize', (event) => {
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  sg.setCanvasSize(gl.canvas.width, gl.canvas.height, margin);    
  worldToBufferMatrix = sg.getWorldToBufferMatrix();
  worldPolygon = sg.createWorldPolygon(gl, worldPolygon);
  computeCanvasPos();
});

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
  
  // createShapes2();

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

  //sg = createSymmetryGroup();
  //sg.setCanvasSize(gl.canvas.width, gl.canvas.height, margin)
  //worldToBufferMatrix = sg.getWorldToBufferMatrix();
  computeCanvasPos();
  setCurrentGroup("P1");

  initPointerEvents(gl.canvas);
  initButtons();
}

//
// clearOfflineBuffer
//
function clearOfflineBuffer() {
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);
    gl.clearColor(0.0, 0.0, 0.0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
}


//
// getMousePos
// 
function getMousePos(e) {
    let x = e.clientX - canvasPos[0];
    let y = gl.canvas.height - (e.clientY - canvasPos[1]);
  
    return [x,y];
}

//
// initPointerEvents
// 
function initPointerEvents(canvas) {
    let dx, dy;
    canvas.addEventListener('pointerdown', e => {
        dx = e.offsetX - e.clientX;
        dy = e.offsetY - e.clientY;
        
      console.log(e);
        mouseDown = true;
        [px,py] = [e.clientX + dx, gl.canvas.height - (e.clientY + dy)];
        if(sg) stroke(px,py);
        document.addEventListener('pointermove', onPointerDrag);
        document.addEventListener('pointerup', onPointerUp);        
    });   

    function onPointerDrag(e) {        
        [px,py] = [e.clientX + dx, gl.canvas.height - (e.clientY + dy)];
        if(mouseDown) stroke(px,py);
    }
    
    function onPointerUp(e) {
        mouseDown = false;
        document.removeEventListener('pointermove', onPointerDrag);
        document.removeEventListener('pointerup', onPointerUp);
    }
    
}



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
}

function setCurrentColor(color) {
    currentColor = color;
    
}
//
// render
//
function render() {

    /*
    const sqrt3_2 = Math.sqrt(3)/2;    
    let r = 150;
    let va = [r*Math.cos(phi),r*Math.sin(phi)];
    let vb = [va[0]/2-va[1]*sqrt3_2, va[1]/2+va[0]*sqrt3_2];
    sg.setVectors(va,vb);
    */


    let matrix = m4.identity();


    /*
    // draw offline buffer
    twgl.bindFramebufferInfo(gl, offlineBuffer);

    gl.clearColor(0.8, 0.9, 0.9, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
  
    //m4.translate(matrix, [-1+2*px/gl.canvas.width, -1 + 2*py/gl.canvas.height,0], matrix);
    //m4.scale(matrix, [0.1,0.1,1], matrix)
    //GU.dot.draw(GU.simpleMaterial, { u_matrix : matrix, u_color : [1,0,0,1]});
    GU.viewMatrix = sg.getWorldToBufferMatrix();
    GU.fillRect(px-10,py-10,20,20, [0,1,0,1])
    */


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
        // translation cell
        GU.drawParallelogram(sg.cell[0], sg.a, sg.b, [0.5,0.5,0.5,1]);
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

    /*
    // cell/foundamental 
    let uv = sg.getUV([px,py]);

    let p2 = sg.getP(uv[0], uv[1]);
    GU.drawDot(p2[0],p2[1],[0,1,1,1],15);

    // current position
    GU.drawDot(px,py,[1,0,1,1],10);
    */


  /*


  m4.translate(viewMatrix, [px,py,0], matrix);
  m4.scale(matrix, [10,10,1], matrix)
  GU.dot.draw(GU.simpleMaterial, { u_matrix : matrix, u_color : [1,0,0,1]});

  m4.translate(viewMatrix, [px+40,py,0], matrix);
  m4.scale(matrix, [10,10,1], matrix)
  GU.dot.draw(GU.simpleMaterial, { u_matrix : matrix, u_color : [0,1,0,1]});

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  //gl.blendFunc(gl.ONE, gl.SRC_ALPHA);

  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  m4.translate(viewMatrix, [120,120,0], matrix);
  m4.scale(matrix, [100,100,1], matrix);
  GU.dot.draw(GU.texturedMaterial, { u_matrix : matrix, u_texture : texture});
  m4.translate(viewMatrix, [px+60,120,0], matrix);
  m4.scale(matrix, [100,100,1], matrix);
  GU.dot.draw(GU.texturedMaterial, { u_matrix : matrix, u_texture : texture});


  m4.translate(viewMatrix, [400,300,0], matrix);
  m4.scale(matrix, [100,100,1], matrix);
  GU.dot.draw(GU.texturedMaterial, { u_matrix : matrix, u_texture : frameBufferInfo.attachments[0]});
  
  //gl.blendFunc(gl.ONE, gl.ZERO);
  */

}



//
// =======================================
// end
// =======================================
//

function render2() {


  let y = ((px-x0)*va.y - (py-y0)*va.x) / (vb.x*va.y - vb.y*va.x);
  let x = ((px-x0)*vb.y - (py-y0)*vb.x) / (va.x*vb.y - va.y*vb.x);  
  x = x - Math.floor(x);
  y = y - Math.floor(y);
  let px1 = x0 + va.x * x + vb.x * y;
  let py1 = y0 + va.y * x + vb.y * y;

  mat2 = [va.x,va.y,0,0, vb.x,vb.y,0,0, 0,0,1,0, 0,0,0,1];
  imat2 = m4.multiply([2,0,0,0, 0,2,0,0, 0,0,1,0, -1,-1,0,1], m4.inverse(mat2));


  const uniforms = {
    u_matrix: m4.identity(),
    u_color: [1,1,0,1]
    //u_texture: textures.tx
  };

  // disegna sul frame buffer

  twgl.bindFramebufferInfo(gl, frameBufferInfo);

  gl.useProgram(programInfo.program);
  gl.clearColor(0.0, 0.0, 0.0, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);
  twgl.setBuffersAndAttributes(gl, programInfo, innerPolygon);
  uniforms.u_color = [0,1,1,1];
  uniforms.u_matrix = m4.identity();
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, innerPolygon, gl.TRIANGLE_STRIP);

  twgl.setBuffersAndAttributes(gl, programInfo, dot);
  uniforms.u_color = [0,0,1,1];
  uniforms.u_matrix = m4.multiply(imat2, m4.translation([px1-x0, py1-y0, 0]));
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, dot, gl.TRIANGLE_STRIP);

  
  // disegna su canvas
  twgl.bindFramebufferInfo(gl);



  

  twgl.bindFramebufferInfo(gl);
  twgl.resizeCanvasToDisplaySize(gl.canvas);
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  //gl.enable(gl.CULL_FACE);
  gl.clearColor(0.8, 0.8, 0.8, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  const aspect = gl.canvas.clientWidth / gl.canvas.clientHeight;
  // m4.ortho(-aspect, aspect, 1, -1, -1, 1, uniforms.u_matrix);
  // console.log(uniforms.u_matrix);



  /*
  twgl.bindFramebufferInfo(gl, frameBufferInfo);

  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, bufferInfo);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, bufferInfo, gl.TRIANGLES);

  
  twgl.bindFramebufferInfo(gl);

  const uniforms2 = {
    u_matrix: m4.identity(),
    u_texture: frameBufferInfo.attachments[0]
  };
  gl.useProgram(programInfo2.program);
  twgl.setBuffersAndAttributes(gl, programInfo2, bufferInfo2);
  twgl.setUniforms(programInfo2, uniforms2);
  twgl.drawBufferInfo(gl, bufferInfo2, gl.TRIANGLE_STRIP);
  
*/
  const uniforms2 = {
    u_matrix: m4.identity(),
    u_texture: frameBufferInfo.attachments[0]
  };
  m4.ortho(0, gl.canvas.clientWidth, 0,  gl.canvas.clientHeight, -1, 1, uniforms2.u_matrix);
  
  gl.useProgram(programInfo2.program);
  twgl.setBuffersAndAttributes(gl, programInfo2, worldPolygon);
  twgl.setUniforms(programInfo2, uniforms2);
  twgl.drawBufferInfo(gl, worldPolygon, gl.TRIANGLE_STRIP);


  m4.ortho(0, gl.canvas.clientWidth, 0,  gl.canvas.clientHeight, -1, 1, uniforms.u_matrix);  
  gl.useProgram(programInfo.program);
  twgl.setBuffersAndAttributes(gl, programInfo, outline);
  uniforms.u_color = [0,1,0,1];
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, outline, gl.LINE_STRIP);

  twgl.setBuffersAndAttributes(gl, programInfo, dot);
  uniforms.u_color = [1,0,1,1];


  let mat = m4.copy(uniforms.u_matrix);

  m4.multiply(mat, m4.translation([px,py,0]) , uniforms.u_matrix);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, dot, gl.TRIANGLE_STRIP);




  m4.multiply(mat, m4.translation([px1,py1,0]), uniforms.u_matrix);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, dot, gl.TRIANGLE_STRIP);
  
  /*
  m4.multiply(mat, m4.multiply(mat2, m4.scaling([0.1,0.1,0.1])), uniforms.u_matrix);
  twgl.setUniforms(programInfo, uniforms);
  twgl.drawBufferInfo(gl, dot, gl.TRIANGLE_STRIP);
  */

  
}