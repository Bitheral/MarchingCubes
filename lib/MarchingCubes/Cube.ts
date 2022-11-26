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

        let tableIndex = 0;
        for(let i = 0; i < this.corners.length; i++) {
            if(this.corners[i].w < this.volume.getIsoLevel()) {
                tableIndex |= 1 << i;
            }
        }

        if(edgeTable[tableIndex] === 0) {
            return;
        }

        for(let i = 0; i < 12; i++) {
            if((edgeTable[tableIndex] & (1 << i)) !== 0) {
                vertices[i] = VertexLerp(this.volume.getIsoLevel(), this.corners[triTable[tableIndex][i * 3]], this.corners[triTable[tableIndex][i * 3 + 1]]);
            }
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