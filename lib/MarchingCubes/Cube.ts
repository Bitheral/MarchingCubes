import { Vector3, Vector4, BufferGeometry, Float32BufferAttribute } from "three";
import Volume from "./Volume";
import { VertexInterp } from "./util";
import { edgeTable, triTable, cornerIndexFromEdge} from "./lookup.json"

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
        // for(let i = 0; i < Cube.cornersIndex.length; i++) {
        //     let corner = Cube.cornersIndex[i].clone().add(this.position);

        //     let value = this.noise["3D"](corner.x, corner.y, corner.z);
        //     this.corners[i] = new Vector4(corner.x, corner.y, corner.z, value);
        // }

        Cube.cornersIndex.forEach((corner, i) => {
            let cornerPos = corner.clone();
            cornerPos.add(this.position);

            let xCoord = (cornerPos.x / this.volume.getScale()) * this.volume.getNoiseScale();
            let yCoord = (cornerPos.y / this.volume.getScale()) * this.volume.getNoiseScale();
            let zCoord = (cornerPos.z / this.volume.getScale()) * this.volume.getNoiseScale();


            let value = this.noise["3D"](xCoord, yCoord, zCoord);
            this.corners[i] = new Vector4(corner.x, corner.y, corner.z, value);
        });
    }

    private updatePosition(position: Vector3): void {
        this.position = position;
    }

    public buildMesh(): BufferGeometry {
        
        let cubeindex:number = 0;
        let vertlist:Vector3[] = []

        for(let i = 0; i < 8; i++) {
            if(this.corners[i].w < this.volume.getIsoLevel()) {
                cubeindex |= 1 << i;
            }
        }

        /* Cube is entirely in/out of the surface */
        if (edgeTable[cubeindex] == 0)
            return new BufferGeometry();

       const triangluation = triTable[cubeindex];
       triangluation.forEach(edge => {
            if(edge == -1) return;

            let indexA = cornerIndexFromEdge[edge][0];
            let indexB = cornerIndexFromEdge[edge][1];

            let cornerA = this.corners[indexA];
            let cornerB = this.corners[indexB];

            let vert = VertexInterp(this.volume.getIsoLevel(), cornerA, cornerB);

            vertlist.push(vert);
       });

        // Convert the vertex list to a float32 array
        let vertices: number[] = new Array(vertlist.length * 3);
        for(let i = 0; i < vertlist.length; i++) {
            vertices.push(vertlist[i].x, vertlist[i].y, vertlist[i].z);
        }

        // Create the geometry
        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        this.geometry.computeVertexNormals();

        return this.geometry;
    }

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

    public getPosition(): Vector3 {
        return this.position;
    }

}

export default Cube;