
const GU = {};

class ProgramInfo {
    constructor(options) {
        const gl = this.gl = options.gl;
        this.programInfo = twgl.createProgramInfo(gl, [
            options.vs,
            options.fs,
        ]);
    }
}

class Material {
    constructor(options) {
        const gl = this.gl = options.gl;
        
        this.programInfo = options.programInfo ?? new ProgramInfo(options);        
        this.uniforms = options.uniforms;
    }
}

class Shape {
    constructor(options) {
        const gl = this.gl = options.gl;
        this.bufferInfo = twgl.createBufferInfoFromArrays(gl, options.arrays);
        this.verb = options.verb;
    }

    draw(material, uniforms) {
        gl.useProgram(material.programInfo.programInfo.program);

        twgl.setBuffersAndAttributes(
            this.gl, 
            material.programInfo.programInfo, 
            this.bufferInfo);
        for(let u in uniforms) material.uniforms[u] = uniforms[u];
        twgl.setUniforms(material.programInfo.programInfo, material.uniforms);
        twgl.drawBufferInfo(this.gl, this.bufferInfo, this.verb);
    }
}

function createPrograms(gl) {
    GU.simpleMaterial = new Material({gl, 
        vs: `
        uniform mat4 u_matrix;
        attribute vec2 a_position;
        void main() {
          gl_Position = u_matrix * vec4(a_position, 0, 1);
        }
        `,
        fs:`
        precision mediump float;
        uniform vec4 u_color;
        void main() {
          gl_FragColor = u_color;
        }
        `,
        uniforms:{
            u_matrix : twgl.m4.identity(),
            u_color : [0,0,0,1]
        }
        
    });

    GU.texturedMaterial = new Material({gl, 
        vs: `
        uniform mat4 u_matrix;
        attribute vec2 a_position;
        attribute vec2 a_texcoord;
        varying vec2 v_texcoord;
    
        void main() {
          gl_Position = u_matrix * vec4(a_position, 0, 1);
          v_texcoord = a_texcoord;
        }
        `,
        fs:`
        precision mediump float;
        uniform sampler2D u_texture;
        uniform vec4 u_color;
        varying vec2 v_texcoord;
        // varying vec4 v_color;
    
        void main() {
            vec4 color = texture2D(u_texture, v_texcoord) * u_color;
            gl_FragColor = color;
        }
        `,
        uniforms: {
            u_matrix : twgl.m4.identity(),
            u_texture: null,
            u_color: [1,1,1,1]
        }
    });
}

function createShapes(gl) {
    let r = 1;
    GU.filledSquare = new Shape({gl, 
        arrays: {
            position: {
                numComponents: 2,
                data: [-r,-r, r,-r, -r,r, r,r]
            },
            texcoord: {
                data: [0,0, 1,0, 0,1, 1,1],
                numComponents:2
            }
        },
        verb: gl.TRIANGLE_STRIP
    });
    GU.square = new Shape({gl, 
        arrays: {
            position: {
                numComponents: 2,
                data: [-r,-r, r,-r, r,r, -r,r, -r,-r]
            },
            texcoord: {
                data: [0,0, 1,0, 1,1, 0,1, 0,0],
                numComponents:2
            }
        },
        verb: gl.LINE_STRIP
    });

}

GU.viewMatrix = twgl.m4.identity();
GU.tempMatrix = twgl.m4.identity();


GU.fillRect = function(x,y,lx,ly,color) {
    m4.scale(
        m4.translate(GU.viewMatrix, [x+lx/2,y+ly/2,0]), 
        [lx/2,ly/2,1], GU.tempMatrix);
    GU.filledSquare.draw(GU.simpleMaterial, { 
        u_matrix : GU.tempMatrix, 
        u_color : color
    });
}

GU.drawRect = function(x,y,lx,ly,color) {
    m4.scale(
        m4.translate(GU.viewMatrix, [x+lx/2,y+ly/2,0]), 
        [lx/2,ly/2,1], GU.tempMatrix);
    GU.square.draw(GU.simpleMaterial, { 
        u_matrix : GU.tempMatrix, 
        u_color : color
    });
}

GU.drawParallelogram = function(p0,a,b,color) {
    const [x0,y0] = p0;
    const [ax,ay] = a;
    const [bx,by] = b;
    
    GU.square.draw(GU.simpleMaterial, { 
        u_matrix : m4.multiply(m4.multiply(
                GU.viewMatrix,
                [ax,ay,0,0, bx,by,0,0, 0,0,1,0, x0,y0,0,1]),
                [0.5,0,0,0, 0,0.5,0,0, 0,0,1,0, 0.5,0.5,0,1]),
        u_color : [0.5,0.5,0.5,1]
      });
    
}



GU.drawDot = function(x,y,color,r=5) {
    GU.fillRect(x-r,y-r,2*r,2*r,color);
}


GU.init = function(gl) {
    createPrograms(gl);
    createShapes(gl);
}


GU.createBlurredDotTexture = function() {
    let t = performance.now();
    let canvas = document.createElement('canvas');
    canvas.style.background = "transparent";
    let sz = canvas.width = canvas.height = 64;
    let ctx = canvas.getContext('2d');
    const imageData = ctx.createImageData(canvas.width, canvas.height);
    let ra = sz * 0.2, rb = sz * 0.45;
    for(let y=0; y<canvas.height; y++) {
        for(let x=0;x<canvas.width;x++) {
            let dx = x-sz/2, dy = y-sz/2;
            let r = Math.sqrt(dx*dx+dy*dy);
            let v = r<ra?1.0:(r>rb?0.0:(rb-r)/(rb-ra)); 
            v = 1.0-Math.cos(Math.PI*v);
            v = Math.floor(255.0*v);
            let i = (y*canvas.width+x)*4;
            imageData.data[i] = 255;
            imageData.data[i+1] = 255;
            imageData.data[i+2] = 255;
            imageData.data[i+3] = v;            
        }
    }
    ctx.putImageData(imageData,0,0);
    console.log(performance.now() - t);
    /*
    ctx.clearRect(0,0,canvas.width, canvas.height);
    //ctx.fillStyle = "rgba(0,0,0,0)";
    //ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.beginPath();
    ctx.arc(sz/2,sz/2,sz/2-20,0,Math.PI*2);
    ctx.fillStyle = "red";
    ctx.filter = 'blur(10px)';
    ctx.fill();
    */
    return canvas;

}
