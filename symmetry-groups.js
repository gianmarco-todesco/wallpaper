
class SymmetryGroup {
    constructor() {
        this.a = [1,0];
        this.b = [0,1];
        this.canvasWidth = 400;
        this.canvasHeight = 300;
        this.canvasMargin = 0;
        this.generatorSymbols = [];
    }

    setVectors(a,b) {
        this.a = a;
        this.b = b;
        this.updateGeometry();
    }
    setCanvasSize(w,h,mrg) {
        this.canvasWidth = w;
        this.canvasHeight = h;
        this.canvasMargin = mrg;
        this.updateGeometry();
    }


    updateGeometry(width, height) {
        const [ax,ay] = this.a;
        const [bx,by] = this.b;
        
        let cx = ax+bx, cy = ay+by;
        let x0 = this.canvasWidth/2 - cx*0.5;
        let y0 = this.canvasHeight/2 - cy*0.5;
        this.cell = [[x0,y0], [x0+ax,y0+ay], [x0+cx,y0+cy], [x0+bx,y0+by]];        
    }

    _computeUVRange() {
        let u0=0,u1=0,v0=0,v1=0;
        const [x0,y0] = this.cell[0];
        const [ax,ay] = this.a;
        const [bx,by] = this.b;
        const w = this.canvasWidth, h = this.canvasHeight;
        const ab = ax*by-ay*bx;
        const mrg = this.canvasMargin;
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
        
        const pts = []; // p0x,p0y, p0x+dax,p0y+day, p0x+dbx,p0y+dby, p0x+dax+dbx,p0y+day+dby ];
        const uvs = []; // u0,v0, u1,v0, u0,v1, u1,v1];
        const indices = [];

        const m = 2;
        for(let i=0;i<m;i++) {
            let v = (v0*(m-1-i)+v1*i)/(m-1);
            for(let j=0;j<m;j++) {
                let u = (u0*(m-1-j)+u1*j)/(m-1);
                uvs.push(u,v);
                pts.push(x0 + ax*u + bx*v, y0 + ay*u + by*v);
            }
        }
        for(let i=0;i+1<m;i++) {
            for(let j=0;j+1<m;j++) {
                let k = i*m + j;
                indices.push(k,k+1,k+m+1, k,k+m+1,k+m);
            }
        }
        
        if(!worldPolygon) {
            return new Shape({gl, 
                arrays: {
                    position: { numComponents:2, data: pts },
                    texcoord: { numComponents:2, data: uvs },
                    indices: { numComponents:3, data: indices },
                },
                verb: gl.TRIANGLES
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


    createWorldPolygon_old(gl, worldPolygon) {
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


    getUV(p) {
        const [x0,y0] = this.cell[0];
        const [ax,ay] = this.a;
        const [bx,by] = this.b;
        const ab = ax*by-ay*bx;
        const [x,y] = [p[0]-x0, p[1]-y0];
        let u = (x*by-y*bx)/ab;
        let v = -(x*ay-y*ax)/ab;
        return [u-Math.floor(u), v-Math.floor(v),u,v];        
    }

    getP(u,v) {
        return [
            this.cell[0][0] + u * this.a[0] + v * this.b[0],
            this.cell[0][1] + u * this.a[1] + v * this.b[1]
        ];
    }

    getFoundamentalP() {
        throw "not implemented";
    }

    getCellOrbit(p) {
        throw "not implemented";
    }


    wrapAroundUvs(uvs) {
        let L = [];
        const mrg = 0.05;
        uvs.forEach(([u,v]) => {
            let pp = [[u,v]];
            if(u<mrg) pp.push(...pp.map(([uu,vv])=>[uu+1,vv]));
            else if(u>1-mrg)pp.push(...pp.map(([uu,vv])=>[uu-1,vv]));
            if(v<mrg) pp.push(...pp.map(([uu,vv])=>[uu,vv+1]));
            else if(v>1-mrg)pp.push(...pp.map(([uu,vv])=>[uu,vv-1]));
            L.push(...pp);
        })
        return L;
    }

    getWorldToBufferMatrix() {
        const [x0,y0] = this.cell[0];
        const [ax,ay] = this.a;
        const [bx,by] = this.b;

        let matrix = m4.multiply(
            [ax,ay,0,0, bx,by,0,0, 0,0,1,0, x0,y0,0,1],
            [0.5,0,0,0, 0,0.5,0,0, 0,0,1,0, 0.5,0.5,0,1],
        );
        return m4.inverse(matrix);
    }

    _addRCenter(shape, u, v, dd) {
        let m = dd.length/2;
        const [x,y] = this.getP(u,v);
        for(let i=0; i<m; i++) {
            let i1 = (i+1)%m;
            shape.addLine(x+dd[i*2],y+dd[i*2+1],x+dd[i1*2],y+dd[i1*2+1]);
        }
    }

    _addR2(shape, u, v) {
        const r0 = 5, r1 = 7;
        shape.setColor(1,0.5,0.5);
        this._addRCenter(shape, u, v, [0,-r1, r0,0, 0,r1, -r0,0]);
    }
    _addR3(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 6, dx = r * 3/2 / (Math.sqrt(3)/2) / 2;
        shape.setColor(1,0.5,0.5);
        this._addRCenter(shape, u, v, [0,-r, dx,r/2, -dx,r/2]);
    }
    _addR4(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 4;
        shape.setColor(1,0.5,0.5);
        this._addRCenter(shape, u, v, [-r,-r, r,-r, r,r, -r,r]);
    }
    _addR6(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 7;
        const pts = [];
        shape.setColor(1,0.5,0.5);
        for(let i=0;i<6;i++) {
            let phi = Math.PI*2*i/6;
            pts.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        this._addRCenter(shape, u, v, pts);
    }
    _addM(shape, u0,v0, u1,v1) {
        const [x0,y0] = this.getP(u0,v0);
        const [x1,y1] = this.getP(u1,v1);
        shape.setColor(1,0.1,0.5);
        shape.addDashLine(x0,y0,x1,y1);
    }
    _addG(shape, u0,v0, u1,v1) {
        const [x0,y0] = this.getP(u0,v0);
        const [x1,y1] = this.getP(u1,v1);
        shape.setColor(1,0.5,1.0);
        shape.addZigZagLine(x0,y0,x1,y1);
    }
    addEntities(shape) {
        this.generatorSymbols.forEach(gs => {
            let methodName = "_add" + gs[0];
            let method = this[methodName];
            if(typeof method == "function") {
                method.apply(this, [shape, ...gs.slice(1)]);
            }            
        });
    }
}

/*
function createSymmetryGroup() {
    const sqrt3_2 = Math.sqrt(3)/2;
    sg = new SymmetryGroup();
    let va = [200,50];
    let vb = [va[0]/2-va[1]*sqrt3_2, va[1]/2+va[0]*sqrt3_2];
    sg.setVectors(va,vb);
    return sg;
}
*/

class P1Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,200]);
        this.foundamentalDomain = [-1,-1,1,-1,-1,1,1,1];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}


class P2Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1,1,-1,1,1];
        this.generatorSymbols = [
            ["R2",0,0], ["R2",0.5,0], ["R2",1,0], 
            ["R2",0.5,0.5], ["R2",1,0.5], ["R2",1,1], 
        ];
        this.symmetrySymbols = [
            { name: "R2a", type:"R2", pos:[0.0,0.0] },
            { name: "R2b", type:"R2", pos:[0.5,0.0] },
            { name: "R2c", type:"R2", pos:[0.5,0.5] },
            { name: "R2d", type:"R2", pos:[1.0,0.5] },            
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u+v>1.0) { u=1-u; v=1-v;}
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v], [1-u,1-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }
    getGeneratorSymbols() {

    }


}


class PmGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1,1,-1,-1,0,1,0];
        this.generatorSymbols = [
            ["M",0,0,1,0],
            ["M",0,0.5,1,0.5]
        ];
        this.symmetrySymbols = [
            { name: "Ma", type:"M", pos:[0.0,0.0,1.0,0.0] },
            { name: "Mb", type:"M", pos:[0.0,0.5,1.0,0.5] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { v=1-v;}
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v], [u,1-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}


class PgGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1, 1,-1, -1,0,1,0];
        this.generatorSymbols = [
            ["G",0,0,0,0.5],
            ["G",0.5,0,0.5,0.5],
            ["G",1,0,1,0.5],
        ];
        this.symmetrySymbols = [
            { name: "Ga", type:"G", pos:[0.0,0.0,0.0,0.5] },
            { name: "Gb", type:"G", pos:[0.5,0.0,0.5,0.5] },
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { u=1-u; v=v-0.5}
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v], [1-u,v+0.5]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}

class CmGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,150], [-200,150]);
        this.foundamentalDomain = [-1,-1,1,-1,-1,1];
        this.generatorSymbols = [
            ["M",1,0,0,1],
            ["M",-0.1,0.1,0.1,-0.1],
            ["G",0.5,0,0,0.5]
        ]
        this.symmetrySymbols = [
            { name: "Ma", type:"M", pos:[1.0,0.0,0.0,1.0] },
            { name: "Ga", type:"G", pos:[0.5,0.0,0.0,0.5] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u+v>1) { u=1-v; v=1-u;}
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v], [1-v,1-u]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}


class PmmGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1,0,-1,-1,0,0,0];
        this.generatorSymbols = [
            ["R2",0, 0],
            ["R2",0, 0.5],
            ["R2",0.5, 0],
            ["R2",0.5, 0.5],
            ["M",0,0,0.5,0],
            ["M",0,0.5,0.5,0.5],
            ["M",0,0,0,0.5],
            ["M",0.5,0,0.5,0.5],            
        ]
        this.symmetrySymbols = [
            { name: "R2a", type:"R2", pos:[0.0,0.0] },
            { name: "R2b", type:"R2", pos:[0.0,0.5] },
            { name: "R2c", type:"R2", pos:[0.5,0.0] },
            { name: "R2d", type:"R2", pos:[0.5,0.5] },
            { name: "Ma", type:"M", pos:[0.0,0.0,0.5,0.0] },
            { name: "Mb", type:"M", pos:[0.0,0.5,0.5,0.5] },
            { name: "Mc", type:"M", pos:[0.0,0.0,0.0,0.5] },
            { name: "Md", type:"M", pos:[0.5,0.0,0.5,0.5] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5) { u=1-u; }
        if(v>0.5) { v=1-v; }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        let pp = this.wrapAroundUvs([[u,v], [1-u,v], [u,1-v], [1-u,1-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}


class PmgGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1,0,-1,-1,0,0,0];
        this.generatorSymbols = [
            ["R2",0.0,0.25],
            ["R2",0.5,0.25],
            ["M",0,0,0.5,0],
            ["M",0,0.5,0.5,0.5],
            ["G",0,0,0,0.5],
            ["G",0.5,0,0.5,0.5],            
        ]
        this.symmetrySymbols = [
            { name: "R2a", type:"R2", pos:[0.0,0.25] },
            { name: "R2b", type:"R2", pos:[0.5,0.25] },
            { name: "Ma", type:"M", pos:[0.0,0.0,0.5,0.0] },
            { name: "Mb", type:"M", pos:[0.0,0.5,0.5,0.5] },
            { name: "Ga", type:"G", pos:[0.0,0.0,0.0,0.5] },
            { name: "Gb", type:"G", pos:[0.5,0.0,0.5,0.5] },
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { v = 1-v; }
        if(u>0.5) { u = 1-u; v = 0.5-v; }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { v = 1-v; }
        if(u>0.5) { u = 1-u; v = 0.5-v; }
        let pp = this.wrapAroundUvs([[u,v], [1-u,0.5-v], [u,1-v], [1-u,0.5+v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}


class PggGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [0,-1,1,0,-1,0];
        this.generatorSymbols = [
            ["R2", 0.5, 0.5],
            ["R2", 0.0, 0.5],
            ["R2", 1.0, 0.5],
            ["R2", 0.5, 0.0],
            ["G",1/4,1/4,3/4,1/4],
            ["G",1/4,1/4,1/4,1/2],
            ["G",3/4,1/4,3/4,1/2], 
        ]
        this.symmetrySymbols = [
            { name: "R2a", type:"R2", pos:[0.5,0.5] },
            { name: "R2b", type:"R2", pos:[0.0,0.5] },
            { name: "R2c", type:"R2", pos:[0.5,0.0] },
            { name: "Ga", type:"G", pos:[1/4,1/4,3/4,1/4] },
            { name: "Gb", type:"G", pos:[1/4,1/4,1/4,1/2] },
            { name: "Gc", type:"G", pos:[3/4,1/4,3/4,1/2] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { u = 1-u; v = 1-v; }
        if(u<0.5 && u+v<0.5 || u>=0.5 && u-v>0.5) { 
            if(u<0.5) { u=u+0.5; v=0.5-v; }
            else { u=u-0.5; v=0.5-v;}
        }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>0.5) { u = 1-u; v = 1-v; }
        if(u<0.5 && u+v<0.5 || u>=0.5 && u-v>0.5) { 
            if(u<0.5) { u=u+0.5; v=0.5-v; }
            else { u=u-0.5; v=0.5-v;}
        }
        let u1 = u>0.5 ? u-0.5 : u+0.5;
        let pp = this.wrapAroundUvs([[u,v], [u1,0.5-v], [1-u,1-v], [1-u1,0.5+v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}


class CmmGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,150], [-200,150]);
        this.foundamentalDomain = [-1,-1,0,0,-1,1];
        this.generatorSymbols = [
            ["R2", 0.0, 0.0],
            ["R2", 0.0, 1.0],
            ["R2", 0.5, 0.5],
            ["R2", 0.0, 0.5],
            ["M", 0,1,0.5,0.5],
            ["M", 0,0,0.5,0.5],
            ["G", 0,0.5,1/4,3/4],
            ["G", 0,0.5,1/4,1/4], 
        ]
        this.symmetrySymbols = [
            { name: "R2a", type:"R2", pos:[0.0,0.0] },
            { name: "R2b", type:"R2", pos:[0.5,0.5] },
            { name: "R2c", type:"R2", pos:[0.0,0.5] },
            { name: "R2c", type:"R2", pos:[0.5,0.0] },
            { name: "Ma", type:"M", pos:[0,1,1/2,1/2] },
            { name: "Mb", type:"M", pos:[0,0,1/2,1/2] },
            { name: "Ga", type:"G", pos:[0,1/2,1/4,3/4] },
            { name: "Gb", type:"G", pos:[0,1/2,1/4,1/4] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>u) {[u,v]=[v,u];}
        if(u+v>1) {[u,v]=[1-v,1-u]};
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(v>u) {[u,v]=[v,u];}
        if(u+v>1) {[u,v]=[1-v,1-u]};
        let pp = this.wrapAroundUvs([[u,v], [v,u], [1-v,1-u], [1-u,1-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}

class P4Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,200]);
        this.foundamentalDomain = [-1,-1,0,-1,-1,0,0,0];
        this.generatorSymbols = [
            ["R4", 0.5, 0.5],
            ["R4", 0.0, 0.0],
            ["R2", 0.0, 0.5],
            ["R2", 0.5, 0.0],
        ]
        this.symmetrySymbols = [
            { name: "R4a", type:"R4", pos:[0.5,0.5] },
            { name: "R4b", type:"R4", pos:[0.0,0.0] },
            { name: "R2a", type:"R2", pos:[0.0,0.5] },
            { name: "R2a", type:"R2", pos:[0.5,0.0] },
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        let pp = this.wrapAroundUvs([[u,v], [1-v,u], [v,1-u], [1-u,1-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}

class P4mGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,200]);
        this.foundamentalDomain = [-1,-1,0,-1,0,0];
        this.generatorSymbols = [
            ["R4", 0.5, 0.5],
            ["R4", 0.0, 0.0],
            ["R2", 0.5, 0.0],
            ["M",0,0,0.5,0],
            ["M",0.5,0,0.5,0.5],
            ["M",0.5,0.5,0,0],
            ["G",0.5,0,0.25,0.25]
        ],
        this.symmetrySymbols = [
            { name: "R4a", type:"R4", pos:[0.5,0.5] },
            { name: "R4b", type:"R4", pos:[0.0,0.0] },
            { name: "R2a", type:"R2", pos:[0.5,0.0] },
            { name: "R2b", type:"R2", pos:[0.0,0.5] },
            { name: "Ma",  type:"M",  pos:[0.0,0.0,1.0,0.0] },
            { name: "Ma",  type:"M",  pos:[0.0,0.0,0.0,1.0] },
            { name: "Mb",  type:"M",  pos:[0.5,0.0,0.5,1.0] },
            { name: "Mb",  type:"M",  pos:[0.0,0.5,1.0,0.5] },
            { name: "Mc",  type:"M",  pos:[0.0,0.0,1.0,1.0] },
            { name: "Mc",  type:"M",  pos:[0.0,1.0,1.0,0.0] },            
            { name: "Ga",  type:"G",  pos:[0.5,0.0,0.25,0.25] },
            { name: "Ga",  type:"G",  pos:[0.5,0.0,0.75,0.25] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        if(u-v>0.0) { [u,v] = [v,u]; }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        if(u-v>0.0) { [u,v] = [v,u]; }
        let pp = this.wrapAroundUvs([
            [u,v], [1-v,u], [v,1-u], [1-u,1-v],
            [v,u], [1-u,v], [u,1-v], [1-v,1-u],
        ]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}

class P4gGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,200]);
        this.foundamentalDomain = [0,-1,0,0,-1,0];
        this.generatorSymbols = [
            ["R4", 0.5, 0.5],
            ["R2", 0.0, 0.5],
            ["R2", 0.5, 0.0],
            ["M",0.5,0,0,0.5],
            ["G",0.25,0.25,0.5,0.5],
            ["G",0.25,0.25,0.25,0.5],
            ["G",0.25,0.25,0.5,0.25],
            
        ]
        this.symmetrySymbols = [
            { name: "R4a", type:"R4", pos:[0.5,0.5] },
            { name: "R4a", type:"R4", pos:[0.0,0.0] },
            { name: "R2a", type:"R2", pos:[0.0,0.5] },
            { name: "R2b", type:"R2", pos:[0.5,0.0] },
            { name: "Ma",  type:"M",  pos:[0.5,0.0,0.0,0.5] },
            { name: "Ma",  type:"M",  pos:[0.5,0.0,1.0,0.5] },
            { name: "Ga",  type:"G",  pos:[0.0,0.0,0.5,0.5] },
            { name: "Ga",  type:"G",  pos:[1.0,0.0,0.5,0.5] },
            { name: "Gb",  type:"G",  pos:[0.25,0.0,0.25,1.0] },
            { name: "Gb",  type:"G",  pos:[0.75,0.0,0.75,1.0] },
            { name: "Gb",  type:"G",  pos:[0.0,0.25,1.0,0.25] },
            { name: "Gb",  type:"G",  pos:[0.0,0.75,1.0,0.75] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        if(u+v>0.0) { [u,v] = [0.5-u,0.5-v]; }
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        if(u>0.5 && v>0.5) { u=1-u;v=1-v; }
        else if(u>0.5) { [u,v] = [v,1-u]; }
        else if(v>0.5) { [u,v] = [1-v,u]; }
        if(u+v>0.5) { [u,v] = [0.5-v,0.5-u]; }
        let pp = this.wrapAroundUvs([
            [u,v], [1-v,u], [v,1-u], [1-u,1-v],
            [0.5-v,0.5-u], [0.5+u,0.5-v], [0.5-u,0.5+v], [0.5+v,0.5+u],
        ]);
        return pp.map(([u,v])=>this.getP(u,v));
    }

}

class P3Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [100,200*Math.sqrt(3)/2]);
        this.foundamentalDomain = [1,-1,-1/3,-1/3,1/3,1/3,-1,1];
        this.generatorSymbols = [
            ["R3", 1.0, 0.0],
            ["R3", 0.0, 1.0],
            ["R3", 1/3, 1/3],
            ["R3", 2/3, 2/3],
        ]
        this.symmetrySymbols = [
            { name: "R3a", type:"R3", pos:[1,0] },
            { name: "R3b", type:"R3", pos:[1/3,1/3] },
            { name: "R3c", type:"R3", pos:[2/3,2/3] },
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);

         
        let pp = this.wrapAroundUvs(u+v < 1.0 
            ? [[u,v], [1-u-v, u], [v, 1-u-v]]
            : [[u,v], [2-u-v, u], [v, 2-u-v]]);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}

class P3m1Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [100,200*Math.sqrt(3)/2]);
        this.foundamentalDomain = [-1/3,-1/3,1/3,1/3,-1,1];
        this.generatorSymbols = [
            ["R3", 0.0, 1.0],
            ["R3", 1/3, 1/3],
            ["R3", 2/3, 2/3],
            ["M",0,1,1/3,1/3],
            ["M",1/3,1/3,2/3,2/3],
            ["M",2/3,2/3,0,1],
            ["G",1/6,2/3,1/2,1/2],
            ["G",1/2,1/2,1/3,5/6],
            ["G",1/3,5/6,1/6,2/3],            
        ]
        this.symmetrySymbols = [
            { name: "R3a", type:"R3", pos:[0,1] },
            { name: "R3b", type:"R3", pos:[1/3,1/3] },
            { name: "R3c", type:"R3", pos:[2/3,2/3] },
            { name: "Ma",  type:"M", pos:[0,1,1/3,1/3] },
            { name: "Mb",  type:"M", pos:[1/3,1/3,2/3,2/3] },
            { name: "Mc",  type:"M", pos:[2/3,2/3,0,1] },
            
        ];
    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!

        let L = u+v < 1.0 
            ? [[u,v], [1-u-v, u], [v, 1-u-v]]
            : [[u,v], [2-u-v, u], [v, 2-u-v]];
        for(let i=0; i<3; i++) {
            let [uu,vv] = L[i];
            L.push([vv,uu])
        }
        let pp = this.wrapAroundUvs(L);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}


class P31mGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [100,200*Math.sqrt(3)/2]);
        this.foundamentalDomain = [-1,-1,1,-1,-1/3,-1/3];
        this.generatorSymbols = [
            ["R3", 0.0, 0.0],
            ["R3", 1.0, 0.0],
            ["R3", 1/3, 1/3],
            ["M",0,0,1,0],
            ["G",1/2,0,1/4,1/4],
            ["G",1/2,0,1/2,1/4],
        ]
        this.symmetrySymbols = [
            { name: "R3a", type:"R3", pos:[0,0] },
            { name: "R3b", type:"R3", pos:[1/3,1/3] },
            { name: "R3b", type:"R3", pos:[2/3,2/3] },
            { name: "Ma",  type:"M", pos:[0,0,1,0] },
            { name: "Ma",  type:"M", pos:[0,0,0,1] },
            { name: "Ma",  type:"M", pos:[0,1,1,0] },
            { name: "Ga",  type:"G", pos:[1/2,0,1/4,1/4] },
            { name: "Ga",  type:"G", pos:[1/2,0,1/2,1/2] },
            { name: "Ga",  type:"G", pos:[0,1/2,1,1/2] },            
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        let L = u+v < 1.0 
            ? [[u,v], [1-u-v, u], [v, 1-u-v]]
            : [[u,v], [2-u-v, u], [v, 2-u-v]];
        for(let i=0; i<3; i++) {
            let [uu,vv] = L[i];
            L.push([1-vv,1-uu])
        }
        let pp = this.wrapAroundUvs(L);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}

class P6Group extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [100,200*Math.sqrt(3)/2]);
        this.foundamentalDomain = [-1,-1,1,-1,-1/3,-1/3];
        this.generatorSymbols = [
            ["R6", 0.0, 0.0],
            ["R6", 1.0, 0.0],
            ["R3", 1/3, 1/3],
            ["R2", 0.5, 0],            
        ]
        this.symmetrySymbols = [
            { name: "R6a", type:"R6", pos:[0,0] },
            { name: "R3a", type:"R3", pos:[1/3,1/3] },
            { name: "R3a", type:"R3", pos:[2/3,2/3] },
            { name: "R2a", type:"R2", pos:[1/2,0] },
            { name: "R2a", type:"R2", pos:[0,1/2] },
            { name: "R2a", type:"R2", pos:[1/2,1/2] },
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        let L = u+v < 1.0 
            ? [[u,v], [1-u-v, u], [v, 1-u-v]]
            : [[u,v], [2-u-v, u], [v, 2-u-v]];
        for(let i=0; i<3; i++) {
            let [uu,vv] = L[i];
            L.push([1-uu,1-vv])
        }
        let pp = this.wrapAroundUvs(L);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}

class P6mGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [100,200*Math.sqrt(3)/2]);
        this.foundamentalDomain = [-1,-1,0,-1,-1/3,-1/3];
        this.generatorSymbols = [
            ["R6", 0.0, 0.0],
            ["R3", 1/3, 1/3],
            ["R2", 0.5, 0],
            ["M",0,0,1/3,1/3],
            ["M",1/3,1/3,1/2,0],
            ["M",1/2,0,0,0],
            ["G",1/4,0,1/6,1/6],
            ["G",1/2,0,1/6,1/6],
            ["G",1/2,0,1/4,1/4],
        ]
        this.symmetrySymbols = [
            { name: "R6a", type:"R6", pos:[0,0] },
            { name: "R3a", type:"R3", pos:[1/3,1/3] },
            { name: "R3a", type:"R3", pos:[2/3,2/3] },
            { name: "R2a", type:"R2", pos:[1/2,0] },
            { name: "R2a", type:"R2", pos:[0,1/2] },
            { name: "R2a", type:"R2", pos:[1/2,1/2] },

            { name: "Ma",  type:"M", pos:[0,0,1/3,1/3] },
            { name: "Ma",  type:"M", pos:[0.5,0,0,1] },
            { name: "Ma",  type:"M", pos:[0.0,0.5,1,0] },

            //{ name: "Ma",  type:"M", pos:[0,0,0,1] },
           // { name: "Ma",  type:"M", pos:[0,1,1,0] },
            //{ name: "Ma",  type:"M", pos:[0.5,0,0,1] },

            { name: "Mb",  type:"M", pos:[0,0,1,0] },
            { name: "Mb",  type:"M", pos:[0,0,0,1] },
            { name: "Mb",  type:"M", pos:[1,0,0,1] },
            
            { name: "Ga",  type:"G", pos:[1/2,0,1/4,1/4] },
            { name: "Ga",  type:"G", pos:[1/2,0,1/2,1/2] },
            { name: "Ga",  type:"G", pos:[0,1/2,1,1/2] },  

            { name: "Gb",  type:"G", pos:[1/4,0,0,1/2] },
            { name: "Gb",  type:"G", pos:[0,1/4,1/2,0] },
            { name: "Gb",  type:"G", pos:[1/2,0,1,1/2] },
            //{ name: "Ga",  type:"G", pos:[1/2,0,1/2,1/2] },
            //{ name: "Ga",  type:"G", pos:[0,1/2,1,1/2] },  
        ];

    }
    getFoundamentalP(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // misssing!!
        return this.getP(u,v);        
    }
    getCellOrbit(p) {
        let [u,v,uu,vv] = this.getUV(p);
        // it is partial!!
        if(u+v>1.0) { [u,v]=[1-u,1-v];}
        let L = [[u,v], [1-u-v, u], [v, 1-u-v]];
        for(let i=0; i<3; i++) {
            let [uu,vv] = L[i];
            L.push([vv,uu])
            L.push([1-vv,1-uu])
            L.push([1-uu,1-vv])
        }
        let pp = this.wrapAroundUvs(L);
        return pp.map(([u,v])=>this.getP(u,v));
    }
}

const groupTable = {
    'P1' : P1Group,
    'P2' : P2Group,
    'Pm' : PmGroup,
    'Pg' : PgGroup,
    'Cm' : CmGroup,
    'Pmm': PmmGroup,
    'Pmg': PmgGroup,
    'Pgg': PggGroup,
    'Cmm': CmmGroup,
    'P4' : P4Group,
    'P4m': P4mGroup,
    'P4g': P4gGroup,
    'P3' : P3Group,
    'P3m1' : P3m1Group,
    'P31m' : P31mGroup,
    'P6' : P6Group,
    'P6m': P6mGroup,
}
// #8

function getGroup(name) {
    let cl = groupTable[name];
    return cl ? new cl() : null;
}


class SymmetryGroupHelper {
    constructor(g, shape) {
        this.g = g;
        this.shape = shape;
        this.uvRange = g._computeUVRange();
    }

    addSymbols(L) {
        this.shape.idx = 0;
        let symbols = this.g.symmetrySymbols || [];
        symbols = [
            ...symbols.filter(s=>!s.type.startsWith("R")),
            ...symbols.filter(s=>s.type.startsWith("R"))];
        const me = this;
        const methods = {
            "R2": (pos) => me.addRotationCenter(pos,2),
            "R3": (pos) => me.addRotationCenter(pos,3),
            "R4": (pos) => me.addRotationCenter(pos,4),
            "R6": (pos) => me.addRotationCenter(pos,6),
            "M" : (pos) => me.addReflections(pos),
            "G" : (pos) => me.addGlideReflections(pos),            
        }
        symbols
           .filter(symbol=>L.find(s=>s==symbol.name))
            .forEach(symbol => {
                let f = methods[symbol.type];
                if(f) f(symbol.pos);            
            });        
        this.shape.update();   
        console.log(this.shape.idx);
    }

    addRotationCenter(p,m) {
        let param = SymmetryGroupHelper.rotParams[m];
        if(!param) return;
        this.shape.setColor(...param.color);
        console.log(param.color);
        let num = param.vv.length/2;
        for(let du = this.uvRange[0]; du <= this.uvRange[1]; du++)
        for(let dv = this.uvRange[2]; dv <= this.uvRange[3]; dv++)
        {
            const [x,y] = this.g.getP(p[0]+du,p[1]+dv);        
            for(let i=0; i<num; i++) {
                let i1 = (i+1)%num;
                this.shape.addLine(
                    x+param.vv[i*2],
                    y+param.vv[i*2+1],
                    x+param.vv[i1*2],
                    y+param.vv[i1*2+1]);
            }
    
        }

    }

    addSingleLine(p,d,isDashed) {
        let ta=-Infinity,tb=Infinity;
        const epsilon = 0.0001;
        const [u0,u1,v0,v1] = this.uvRange;
        
        if(Math.abs(d[0]) > epsilon) {
            ta = (u0 - p[0])/d[0];
            tb = (u1 - p[0])/d[0];
            if(d[0] < 0) [ta,tb] = [tb,ta];            
        }
        if(Math.abs(d[1]) > epsilon) {
            let ta2 = (v0 - p[1])/d[1];
            let tb2 = (v1 - p[1])/d[1];
            if(d[1] < 0) [ta2,tb2] = [tb2,ta2];
            ta = Math.max(ta, ta2);
            tb = Math.min(tb, tb2);
        }
        if(ta < tb) {
            const [xa, ya] = this.g.getP(p[0]+d[0]*ta,p[1]+d[1]*ta);
            const [xb, yb] = this.g.getP(p[0]+d[0]*tb,p[1]+d[1]*tb);
            if(isDashed) 
                this.shape.addDashLine(xa,ya,xb,yb);
            else 
                this.shape.addLine(xa,ya,xb,yb);
            return true;    
        } else {
            return false;
        }
    }

    addReflections(pos) {
        this.shape.setColor(0,0,1,1);
        this.addLineFamily(pos, false);
    }
    addGlideReflections(pos) {
        this.shape.setColor(1,0.5,0,1);
        this.addLineFamily(pos, true);
    }
    
    addLineFamily(pos, dashed) {
        let p = [pos[0],pos[1]];
        let d = [pos[2]-pos[0], pos[3]-pos[1]];
        let ret;
        ret = this.addSingleLine(p, d, dashed);
        if(!ret) return;
        let L = [];        
        const epsilon = 0.001;
        if(Math.abs(d[1]) > epsilon) L.push([1,0],[-1,0]);
        if(Math.abs(d[0]) > epsilon) L.push([0,1],[0,-1]);
        L.forEach(([dx,dy])=> {
            let pp = [p[0]+dx, p[1]+dy];
            let count = 50;
            while(count >=0 && this.addSingleLine(pp,d,dashed)) {
                count -= 1;
                pp[0]+=dx; 
                pp[1]+=dy;
            }
            if(count==0) 
                console.warn("possible infinite loop detected")
        });        
    }

}

SymmetryGroupHelper.R2 = { 
    color: [1,0.5,0.5],
    vv: ((r0,r1)=>[0,-r1, r0,0, 0,r1, -r0,0])(5,7)
}
SymmetryGroupHelper.R3 = { 
    color: [1,0.5,0.5],
    vv: ((r)=> {
        const dx = r * 3/2 / (Math.sqrt(3)/2) / 2;
        return [0,-r, dx,r/2, -dx,r/2];        
    })(8)
}
SymmetryGroupHelper.R4 = { 
    color: [1,0.5,0.5],
    vv: ((r)=> [-r,-r, r,-r, r,r, -r,r])(4)
}
SymmetryGroupHelper.R6 = { 
    color: [1,0.5,0.5],
    vv: ((r)=> {
        const pts = [];
        for(let i=0;i<6;i++) {
            let phi = Math.PI*2*i/6;
            pts.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        return pts;
    })(7)
}


SymmetryGroupHelper.rotParams = [
    null,null,
    SymmetryGroupHelper.R2, 
    SymmetryGroupHelper.R3, 
    SymmetryGroupHelper.R4, 
    null,
    SymmetryGroupHelper.R6, 
]
/*
const r0 = 5, r1 = 7;
shape.setColor(1,0.5,0.5);
this._addRCenter(shape, u, v, [0,-r1, r0,0, 0,r1, -r0,0]);
}
_addR3(shape, u, v) {
const [x,y] = this.getP(u,v);
const r = 6, dx = r * 3/2 / (Math.sqrt(3)/2) / 2;
shape.setColor(1,0.5,0.5);
this._addRCenter(shape, u, v, [0,-r, dx,r/2, -dx,r/2]);
}
_addR4(shape, u, v) {
const [x,y] = this.getP(u,v);
const r = 4;
shape.setColor(1,0.5,0.5);
this._addRCenter(shape, u, v, [-r,-r, r,-r, r,r, -r,r]);
}
_addR6(shape, u, v) {
const [x,y] = this.getP(u,v);
const r = 7;
const pts = [];
shape.setColor(1,0.5,0.5);
for(let i=0;i<6;i++) {
    let phi = Math.PI*2*i/6;
    pts.push(r*Math.cos(phi), r*Math.sin(phi));
}
*/



