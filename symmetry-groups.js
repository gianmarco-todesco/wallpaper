
class SymmetryGroup {
    constructor() {
        this.a = [1,0];
        this.b = [0,1];
        this.canvasWidth = 400;
        this.canvasHeight = 300;
        this.canvasMargin = 0;
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

    _addR2Center(shape, u, v) {
        const r0 = 5, r1 = 7;
        this._addRCenter(shape, u, v, [0,-r1, r0,0, 0,r1, -r0,0]);
    }
    _addR3Center(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 6, dx = r * 3/2 / (Math.sqrt(3)/2) / 2;
        this._addRCenter(shape, u, v, [0,-r, dx,r/2, -dx,r/2]);
    }
    _addR4Center(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 4;
        this._addRCenter(shape, u, v, [-r,-r, r,-r, r,r, -r,r]);
    }
    _addR6Center(shape, u, v) {
        const [x,y] = this.getP(u,v);
        const r = 7;
        const pts = [];
        for(let i=0;i<6;i++) {
            let phi = Math.PI*2*i/6;
            pts.push(r*Math.cos(phi), r*Math.sin(phi));
        }
        this._addRCenter(shape, u, v, pts);
    }
    addEntities(shape) {
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
    addEntities(shape) {
        this._addR2Center(shape, 0.5, 0.5);
    }


}


class PmGroup extends SymmetryGroup {
    constructor() {
        super();
        this.setVectors([200,0], [0,150]);
        this.foundamentalDomain = [-1,-1,1,-1,-1,0,1,0];
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
        this.foundamentalDomain = [-1,-1,0,-1,-1,1,0,1];
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
