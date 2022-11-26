import Cube from "./Cube"
import { Vector3, BoxGeometry, Mesh, MeshBasicMaterial } from "three"
import noise from "../noise";

export class Volume {
    private size: number;
    private cubeGrid: Cube[][][] = [];
    private position: Vector3;

    private isoLevel: number = 0.5;

    constructor(size: number, position: Vector3) {
        this.size = size;
        this.position = position;
        this.generateGrid();
    }

    private generateGrid(): void {
        for(let z = 0; z < this.size; z++) {
            for(let y = 0; y < this.size; y++) {
                for(let x = 0; x < this.size; x++) {
                    this.cubeGrid[x][y][z] = new Cube(this, new Vector3(x, y, z));
                }
            }
        }
    }

    public March(scene: THREE.Scene): void {
        // For each cube in the grid
        for(let z = 0; z < this.size - 1; z++) {
            for(let y = 0; y < this.size - 1; y++) {
                for(let x = 0; x < this.size - 1; x++) {
                    // Get the cube
                    let cube = this.cubeGrid[x][y][z];
                    // Build the mesh
                    cube.buildMesh();

                    // Add the mesh to the scene
                    let mesh = new Mesh(cube.getGeometry(), new MeshBasicMaterial({color: 0x00ff00}));
                    mesh.position.set(x, y, z);
                    scene.add(mesh);
                }
            }
        }
    }

    public getPosition(): Vector3 {
        return this.position;
    }

    public getIsoLevel(): number {
        return this.isoLevel;
    }

}

export default Volume