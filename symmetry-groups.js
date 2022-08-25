class SymmetryGroup {
    constructor() {
        this.a = [1,0];
        this.b = [0,1];
        this.canvasWidth = 400;
        this.canvasHeight = 300;
    }

    setVectors(a,b) {
        this.a = a;
        this.b = b;
        this.updateGeometry();
    }
    setCanvasSize(w,h) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.updateGeometry();
    }


    updateGeometry(width, height) {
        const [ax,ay] = this.a;
        const [bx,by] = this.b;
        
        let cx = ax+bx, cy = ay+by;
        let x0 = this.canvasWidth/2 - cx*0.5;
        let y0 = this.canvasHeight/2 - cy*0.5;
        this.cell = [[x0,y0], [x0+ax,y0+ay], [x0+cx,y0+cy], [x0+bx,y0+by]];
        /*
        
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
          */
    }

    _computeUVRange() {
        let u0=0,u1=0,v0=0,v1=0;
        const [x0,y0] = this.cell[0];
        const [ax,ay] = this.a;
        const [bx,by] = this.b;
        const w = this.canvasWidth, h = this.canvasHeight;
        const ab = ax*by-ay*bx;
        const mrg = 150;
        [[mrg,mrg],[w-mrg,mrg],[w-mrg,h-mrg],[mrg,h-mrg]].forEach(([px,py]) => {
            let x = px - x0, y = py - y0;
            let u = (x*by-y*bx)/ab;
            let v = -(x*ay-y*ax)/ab;
            if(u<u0)u0=u; else if(u>u1)u1=u;
            if(v<v0)v0=v; else if(v>v1)v1=v;
        });
        u0 = Math.floor(u0);
        v0 = Math.floor(v0);
        u1 = Math.ceil(u1);
        v1 = Math.ceil(v1);
        
        return [u0,u1,v0,v1];
    }

    createWorldPolygon(gl, worldPolygon) {
        const [u0,u1,v0,v1] = this._computeUVRange();
        const [x0,y0] = this.cell[0];
        const [ax,ay] = this.a;
        const [bx,by] = this.b;

        const p0 = [x0 + ax*u0 + bx*v0, y0 + ay*u0 + by*v0];
        const [p0x,p0y] = p0;
        const du = u1-u0, dv = v1-v0;
        const [dax,day] = [ax*du, ay*du];
        const [dbx,dby] = [bx*dv, by*dv];
        
        const pts = [p0x,p0y, p0x+dax,p0y+day, p0x+dbx,p0y+dby, p0x+dax+dbx,p0y+day+dby ];
        const uvs = [u0,v0, u1,v0, u0,v1, u1,v1];
        if(!worldPolygon) {
            return new Shape({gl, 
                arrays: {
                    position: {
                        numComponents: 2,
                        data: pts
                    },
                    texcoord: {
                        data: uvs,
                        numComponents:2
                    }
                },
                verb: gl.TRIANGLE_STRIP
            });    
        } else {
            twgl.setAttribInfoBufferFromArray(gl, 
                worldPolygon.bufferInfo.attribs.a_position, 
                new Float32Array(pts));
                twgl.setAttribInfoBufferFromArray(gl, 
                    worldPolygon.bufferInfo.attribs.a_texcoord, 
                    new Float32Array(uvs));
    
            return worldPolygon;
        }

    }
}


function createSymmetryGroup() {
    const sqrt3_2 = Math.sqrt(3)/2;
    sg = new SymmetryGroup();
    let va = [100,50];
    let vb = [va[0]/2-va[1]*sqrt3_2, va[1]/2+va[0]*sqrt3_2];
    sg.setVectors(va,vb);
    return sg;
}