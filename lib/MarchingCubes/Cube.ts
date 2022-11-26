import { Vector3, Vector4, BufferGeometry, Float32BufferAttribute } from "three";
import Noise from "../noise";
import Volume from "./Volume";
import { VertexLerp } from "./util";
import { edgeTable, triTable} from "./lookup.json"

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

    private positionInGrid: Vector3 = new Vector3;
    private positionInWorld: Vector3 = new Vector3;

    private corners: Vector4[] = [];

    private volume: Volume;
    private geometry: BufferGeometry;

    constructor(volume: Volume, position: Vector3) {
        this.volume = volume;
        this.geometry = new BufferGeometry();
        this.updatePosition(position);
        this.generateValues();
    }

    private generateValues(): void {
        this.corners = new Array(8);
        this.updatePosition(this.positionInGrid);
    }

    private updatePosition(position: Vector3): void {
        this.positionInGrid = position;
        this.positionInWorld = this.volume.getPosition().add(position);
        for(let i = 0; i < this.corners.length; i++) {
            let cornerPos = this.positionInWorld.clone().add(Cube.cornersIndex[i]);
            this.corners[i] = new Vector4(cornerPos.x, cornerPos.y, cornerPos.z, Math.random());
        }
    }

    public buildMesh(): void {
        // Vertices array where the size is 12
        let vertices: Vector3[] = new Array(12);
        
        // Triangles array is of size 3, where each element is a vertex index
        let triangles: number[] = [];

        let tableIndex = 0;
        for(let i = 0; i < this.corners.length; i++) {
            if(this.corners[i].w < this.volume.getIsoLevel()) {
                tableIndex |= 1 << i;
            }
        }

        if(edgeTable[tableIndex] === 0) {
            return;
        }

        if (edgeTable[tableIndex] & 1)
            vertices[0] = VertexLerp(this.volume.getIsoLevel(), this.corners[0], this.corners[1]);
        if (edgeTable[tableIndex] & 2)
            vertices[1] = VertexLerp(this.volume.getIsoLevel(), this.corners[1], this.corners[2]);
        if (edgeTable[tableIndex] & 4)
            vertices[2] = VertexLerp(this.volume.getIsoLevel(), this.corners[2], this.corners[3]);
        if (edgeTable[tableIndex] & 8)
            vertices[3] = VertexLerp(this.volume.getIsoLevel(), this.corners[3], this.corners[0]);
        if (edgeTable[tableIndex] & 16)
            vertices[4] = VertexLerp(this.volume.getIsoLevel(), this.corners[4], this.corners[5]);
        if (edgeTable[tableIndex] & 32)
            vertices[5] = VertexLerp(this.volume.getIsoLevel(), this.corners[5], this.corners[6]);
        if (edgeTable[tableIndex] & 64)
            vertices[6] = VertexLerp(this.volume.getIsoLevel(), this.corners[6], this.corners[7]);
        if (edgeTable[tableIndex] & 128)
            vertices[7] = VertexLerp(this.volume.getIsoLevel(), this.corners[7], this.corners[4]);
        if (edgeTable[tableIndex] & 256)
            vertices[8] = VertexLerp(this.volume.getIsoLevel(), this.corners[0], this.corners[4]);
        if (edgeTable[tableIndex] & 512)
            vertices[9] = VertexLerp(this.volume.getIsoLevel(), this.corners[1], this.corners[5]);  
        if (edgeTable[tableIndex] & 1024)
            vertices[10] = VertexLerp(this.volume.getIsoLevel(), this.corners[2], this.corners[6]);
        if (edgeTable[tableIndex] & 2048)
            vertices[11] = VertexLerp(this.volume.getIsoLevel(), this.corners[3], this.corners[7]);
        
        let nTriangles = 0;
        for(let i = 0; triTable[tableIndex][i] != -1; i+=3) {
            triangles.push(triTable[tableIndex][i]);
            triangles.push(triTable[tableIndex][i+1]);
            triangles.push(triTable[tableIndex][i+2]);
            nTriangles++;
        }

        // Convert the vertices to a Float32Array
        let verticesArray = new Float32Array(vertices.length * 3);
        for(let i = 0; i < vertices.length; i++) {
            verticesArray[i * 3] = vertices[i].x;
            verticesArray[i * 3 + 1] = vertices[i].y;
            verticesArray[i * 3 + 2] = vertices[i].z;
        }

        this.geometry.setAttribute("position", new Float32BufferAttribute(verticesArray, 3));
    }

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

}

export default Cube;