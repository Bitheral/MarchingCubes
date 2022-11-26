import { Vector3, Vector4, BufferGeometry, Float32BufferAttribute } from "three";
import Volume from "./Volume";
import { VertexInterp } from "./util";
import { edgeTable, triTable} from "./lookup.json"

import { createNoise3D } from "simplex-noise";

export class Cube {
    private position: Vector3 = new Vector3;

    private static cornersIndex: Vector3[] = [
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        new Vector3(1, 0, 1),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        new Vector3(1, 1, 0),
        new Vector3(1, 1, 1),
        new Vector3(0, 1, 1)
    ]

    private corners: Vector4[] = [];

    private volume: Volume;
    private geometry: BufferGeometry;

    private noise: any;

    constructor(volume: Volume, position: Vector3) {
        this.volume = volume;
        this.noise = volume.noise;
        this.geometry = new BufferGeometry();
        this.updatePosition(position);
        this.generateValues();
    }

    private generateValues(): void {
        this.corners = new Array(8);
        for(let i = 0; i < 8; i++) {
            let corner = Cube.cornersIndex[i].clone().add(this.position);

            let value = this.noise["3D"](corner.x, corner.y, corner.z);
            this.corners[i] = new Vector4(corner.x, corner.y, corner.z, value);
        }
    }

    private updatePosition(position: Vector3): void {
        this.position = position;
    }

    public buildMesh(): void {
        
        /*
            Determine the index into the edge table which
            tells us which vertices are inside of the surface
            */
        let cubeindex:number = 0;
        let vertlist:Vector3[] = new Array(12);

        for(let i = 0; i < 8; i++) {
            if(this.corners[i].w < this.volume.getIsoLevel()) {
                cubeindex |= 1 << i;
            }
        }

        /* Cube is entirely in/out of the surface */
        if (edgeTable[cubeindex] == 0)
            return;

        /* Find the vertices where the surface intersects the cube */
        if (edgeTable[cubeindex] & 1)
            vertlist[0] = VertexInterp(this.volume.getIsoLevel(), this.corners[0], this.corners[1]);
        if (edgeTable[cubeindex] & 2)
            vertlist[1] = VertexInterp(this.volume.getIsoLevel(), this.corners[1], this.corners[2]);
        if (edgeTable[cubeindex] & 4)
            vertlist[2] = VertexInterp(this.volume.getIsoLevel(), this.corners[2], this.corners[3]);
        if (edgeTable[cubeindex] & 8)
            vertlist[3] = VertexInterp(this.volume.getIsoLevel(), this.corners[3], this.corners[0]);
        if (edgeTable[cubeindex] & 16)
            vertlist[4] = VertexInterp(this.volume.getIsoLevel(), this.corners[4], this.corners[5]);
        if (edgeTable[cubeindex] & 32)
            vertlist[5] = VertexInterp(this.volume.getIsoLevel(), this.corners[5], this.corners[6]);
        if (edgeTable[cubeindex] & 64)
            vertlist[6] = VertexInterp(this.volume.getIsoLevel(), this.corners[6], this.corners[7]);
        if (edgeTable[cubeindex] & 128)
            vertlist[7] = VertexInterp(this.volume.getIsoLevel(), this.corners[7], this.corners[4]);
        if (edgeTable[cubeindex] & 256)
            vertlist[8] = VertexInterp(this.volume.getIsoLevel(), this.corners[0], this.corners[4]);
        if (edgeTable[cubeindex] & 512)
            vertlist[9] = VertexInterp(this.volume.getIsoLevel(), this.corners[1], this.corners[5]);
        if (edgeTable[cubeindex] & 1024)
            vertlist[10] = VertexInterp(this.volume.getIsoLevel(), this.corners[2], this.corners[6]);
        if (edgeTable[cubeindex] & 2048)
            vertlist[11] = VertexInterp(this.volume.getIsoLevel(), this.corners[3], this.corners[7]);

        // Convert the vertex list to a float32 array
        let vertices: number[] = [];
        for(let i = 0; i < vertlist.length; i++) {
            if(vertlist[i] != undefined) {
                vertices.push(vertlist[i].x, vertlist[i].y, vertlist[i].z);
            }
        }

        // Create the geometry
        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        
    }

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

}

export default Cube;