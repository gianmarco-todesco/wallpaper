'use strict';
const m4 = twgl.m4;
let gl;

    
let programInfo, programInfo2;
let bufferInfo, bufferInfo2;
let frameBufferInfo;


/*
const va = {x:200, y:40};
const vb = {x:100, y:240};

function createShapes2() {
  const array1 = {
    position: {
      data: [-0.9,-0.9,0.9,-0.9,0.9,0.9],
      numComponents:2
    }
  }
  bufferInfo = twgl.createBufferInfoFromArrays(gl, array1);


  function q(x,y) { return [(x+y*0.5)*5, y*5]}
  const array2 = {
    position: {
        data: [-1,-1, -1,1, 1,-1, 1,1],
        numComponents:2
    },
    texcoord: {
        data: [...q(0,0), ...q(0,1), ...q(1,0), ...q(1,1)],
        numComponents:2
    }
  }
  bufferInfo2 = twgl.createBufferInfoFromArrays(gl, array2);

  let width = gl.canvas.width;
  let height = gl.canvas.height;
  console.log(width, height);
  let vc = {x: va.x+vb.x, y: va.y+vb.y};  
  x0 = width/2 - vc.x/2;
  y0 = height/2 - vc.y/2;

  outline = twgl.createBufferInfoFromArrays(gl, {
    position: {
      numComponents: 2,
      data: [x0,y0, x0+va.x, y0+va.y, x0+vc.x, y0+vc.y, x0+vb.x, y0+vb.y, width/2,height/2]
    }
  });

  worldPolygon = twgl.createBufferInfoFromArrays(gl, {
    position: {
      numComponents: 2,
      data: [
        x0-va.x-vb.x,y0-va.y-vb.y, 
        x0+2*va.x-vb.x, y0+2*va.y-vb.y, 
        x0-va.x+2*vb.x, y0-va.y+2*vb.y, 
        x0+2*va.x+2*vb.x, y0+2*va.y+2*vb.y]
    },
    texcoord: {
      data: [-1,-1, 2,-1, -1,2, 2,2],
      numComponents:2
    }
  });

  innerPolygon = twgl.createBufferInfoFromArrays(gl, {
    position: {
      numComponents: 2,
      data: [-0.9,-0.9, 0.9,-0.9, -0.9,0.9, 0.9,0.9]
    },
  });
  
  let r = 20;
  dot = twgl.createBufferInfoFromArrays(gl, {
    position: {
      numComponents: 2,
      data: [-r,-r, r,-r, -r,r, r,r]
    },
  });
  
    /*
    const arrays = {
      position: twgl.primitives.createAugmentedTypedArray(2, 6),
      // color: twgl.primitives.createAugmentedTypedArray(3, numLines * 2, Uint8Array),
    };
    * /
}
*/

function createDynamicTexture() {
  const attachments = [
    {
      attach: gl.COLOR_ATTACHMENT0,
      wrap: gl.REPEAT,
      min: gl.LINEAR,
      mag: gl.LINEAR,
    },
  ]
  frameBufferInfo = twgl.createFramebufferInfo(gl, attachments, 1024, 1024);
  let status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if(status != gl.FRAMEBUFFER_COMPLETE){
    console.log("Invalid framebuffer");
  } else{
    console.log("Success creating framebuffer");
  }

}

let texture, uff;

document.addEventListener('DOMContentLoaded', ()=>{
    
  initialize();

    function animate() {
      render();
      requestAnimationFrame(animate);
    }
    animate();
});


function initialize() {
  twgl.setDefaults({attribPrefix: "a_"});
  gl = document.getElementById("renderCanvas").getContext("webgl");
  twgl.resizeCanvasToDisplaySize(gl.canvas);

  GU.init(gl);
  
  // createShapes2();

  createDynamicTexture();
    //gl.enable(gl.CULL_FACE);

  // clear offline buffer  
  gl.clearColor(0.0, 0.5, 0.7, 1);
  gl.clear(gl.COLOR_BUFFER_BIT);


  let textureCanvas = GU.createBlurredDotTexture();
  texture = twgl.createTexture(gl, {
    src: textureCanvas,
  });


  /*
  const txCtx = document.createElement("canvas").getContext("2d");
  txCtx.canvas.width  = 256;
  txCtx.canvas.height = 256;


  function updateCtx() {
      txCtx.clearRect(0,0,txCtx.canvas.width,txCtx.canvas.height);
      txCtx.fillStyle = 'red';
      txCtx.beginPath();    
      let r = 30 + 30 * Math.cos(performance.now()*0.003);
      txCtx.arc(txCtx.canvas.width/2,txCtx.canvas.height/2,r,0,2*Math.PI);
      txCtx.fill();
  }
  updateCtx();


  const textures = twgl.createTextures(gl, {tx: {
      mag: gl.NEAREST,
      min: gl.LINEAR,
      src: txCtx.canvas}});

  function updateTexture() {
      gl.bindTexture(gl.TEXTURE_2D, textures.tx);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA,gl.RGBA, gl.UNSIGNED_BYTE, txCtx.canvas);
  }
  */

  sg = createSymmetryGroup();
  sg.setCanvasSize(gl.canvas.width, gl.canvas.height)

}

let px = 200, py = 250;

document.addEventListener('mousemove', e => {
  px = e.clientX - gl.canvas.offsetLeft;
  py = gl.canvas.height - (e.clientY - gl.canvas.offsetTop);

})

let worldPolygon;

function render() {

  const sqrt3_2 = Math.sqrt(3)/2;
    
    let phi = performance.now()*0.0005;  
    let r = 100;
    let va = [r*Math.cos(phi),r*Math.sin(phi)];
    let vb = [va[0]/2-va[1]*sqrt3_2, va[1]/2+va[0]*sqrt3_2];
    sg.setVectors(va,vb);

    let matrix = m4.identity();


  // draw offline buffer
  twgl.bindFramebufferInfo(gl, frameBufferInfo);

  m4.translate(matrix, [-1+2*px/gl.canvas.width, -1 + 2*py/gl.canvas.height,0], matrix);
  m4.scale(matrix, [0.1,0.1,1], matrix)
  //GU.dot.draw(GU.simpleMaterial, { u_matrix : matrix, u_color : [1,0,0,1]});



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


  GU.fillRect(px,py,40,10,[1,0,1,1]);
  GU.fillRect(px+50,py,10,10,[0,1,1,1]);
  GU.fillRect(px+40,py+10,10,10,[0,1,1,1]);
  
  const mrg = 150;
  
  GU.drawDot(sg.cell[0][0],sg.cell[0][1], [1,0,0,1]);
  GU.drawDot(sg.cell[1][0],sg.cell[1][1], [0,1,0,1]);
  GU.drawDot(sg.cell[2][0],sg.cell[2][1], [0,0,1,1]);
  

  //if(!worldPolygon) {
    worldPolygon = sg.createWorldPolygon(gl, worldPolygon);
  //}


  worldPolygon.draw(GU.texturedMaterial, { u_matrix : viewMatrix, u_texture : texture});
  


  
  GU.drawParallelogram(sg.cell[0], sg.a, sg.b, [0.5,0.5,0.5,1]);
  const [u0,u1,v0,v1] = sg._computeUVRange();

  const [x0,y0] = sg.cell[0];
  const [ax,ay] = sg.a;
  const [bx,by] = sg.b;





  GU.drawParallelogram(
    [x0+ax*u0+bx*v0, y0+ay*u0+by*v0], 
    [ax*(u1-u0),ay*(u1-u0)],
    [bx*(v1-v0),by*(v1-v0)],
  [0.75,0.75,0.75,1]);
  

  GU.drawRect(mrg,mrg,gl.canvas.width-mrg*2,gl.canvas.height-mrg*2, [1,0,0,1]);

  

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