import { Vector3, Vector4, BufferGeometry, Float32BufferAttribute, Float16BufferAttribute, Uint16BufferAttribute } from "three";
import Volume from "./Volume";
import { VertexInterp } from "./util";
import { edgeTable, triTable, cornerIndexFromEdge} from "./lookup.json"

import { createNoise3D } from "simplex-noise";

export interface MeshData {
    vertices: number[];
    normals: number[];
}

export class Cube {
    private position: Vector3 = new Vector3;

    public static cornersIndex: Vector3[] = [
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        new Vector3(1, 0, 1),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        new Vector3(1, 1, 0),
        new Vector3(1, 1, 1),
        new Vector3(0, 1, 1)
    ]

    public corners: Vector4[] = [];
    public cornerDensity: number[] = [];

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
        this.cornerDensity = new Array(8);
        this.noise = this.volume.noise;
        // for(let i = 0; i < Cube.cornersIndex.length; i++) {
        //     let corner = Cube.cornersIndex[i].clone().add(this.position);

        //     let value = this.noise["3D"](corner.x, corner.y, corner.z);
        //     this.corners[i] = new Vector4(corner.x, corner.y, corner.z, value);
        // }

        Cube.cornersIndex.forEach((corner, i) => {
            let cornerPos = corner.clone();
            cornerPos.add(this.position);

            let xCoord = (cornerPos.x / this.volume.getScale()) * this.volume.getNoiseScale() + this.volume.getNoiseOffset().x;
            let yCoord = (cornerPos.y / this.volume.getScale()) * this.volume.getNoiseScale() + this.volume.getNoiseOffset().y;
            let zCoord = (cornerPos.z / this.volume.getScale()) * this.volume.getNoiseScale() + this.volume.getNoiseOffset().z;

            // Offset the noise to the center of the volume
            xCoord -= this.volume.getScale() / 2;
            yCoord -= this.volume.getScale() / 2;
            zCoord -= this.volume.getScale() / 2;
                    
            let noiseValue = this.noise.perlin["3D"](xCoord, yCoord, zCoord);
            
            const heightBias = (cornerPos.y / this.volume.getScale());
            const density = heightBias * (cornerPos.y / this.volume.yBias) - noiseValue; 

            // Invert the density
            //density = 1 - density;
            
            this.corners[i] = new Vector4(cornerPos.x, cornerPos.y, cornerPos.z, density);
            this.cornerDensity[i] = density;
        });
    }

    private updatePosition(position: Vector3): void {
        this.position = position;
    }

    public buildMesh(updateValues: boolean = false): BufferGeometry {
        
        let cubeindex:number = 0;
        let vertlist:Vector3[] = []

        if(updateValues) {
            this.generateValues();
        }

        for(let i = 0; i < 8; i++) {
            const corner = this.corners[i];
            

            // If the corner at at the top of the volume,
            // the corner.w will be 1, otherwise it will be 0
            
            const cornerIsAtTop = corner.y == this.volume.getScale() - 1;
            const cornerIsAtBottom = corner.y == 0;
            const cornerIsAtRight = corner.x == this.volume.getScale() - 1;
            const cornerIsAtLeft = corner.x == 0;
            const cornerIsAtFront = corner.z == this.volume.getScale() - 1;
            const cornerIsAtBack = corner.z == 0;

            if((cornerIsAtTop || cornerIsAtBottom || cornerIsAtRight || cornerIsAtLeft || cornerIsAtFront || cornerIsAtBack)) {
                corner.w = (this.volume.showEdges) ? this.volume.edgeSharpness : this.cornerDensity[i];
            }
            
            if(corner.w <= this.volume.getDensityThreshold()) {
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

            let vert = VertexInterp(this.volume.getDensityThreshold(), cornerA, cornerB);

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

}

export type CubeType = Cube;

export default Cube;