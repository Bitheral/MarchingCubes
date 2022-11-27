import Cube from "./Cube"
import { Vector3, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial } from "three"
import { createNoise3D, createNoise2D } from "simplex-noise";

export class Volume {
    private size: number;
    private cubeGrid: Cube[] = [];
    private position: Vector3;

    private geometry: BufferGeometry = new BufferGeometry();

    private isoLevel: number = 0.5;
    private noiseScale: number = 1;

    private wireFrame: boolean = false;


    public noise: any = {
        "2D": createNoise2D(),
        "3D": createNoise3D(),
    }

    constructor(size: number, position: Vector3) {
        this.size = size;
        this.position = position;
        this.generateGrid();
    }

    private generateGrid(): void {
        for(let z = 0; z < this.size; z++) {
            for(let y = 0; y < this.size; y++) {
                for(let x = 0; x < this.size; x++) {
                    const index = x + y * this.size + z * this.size * this.size;
                    this.cubeGrid[index] = new Cube(this, new Vector3(x, y, z));
                }
            }
        }
    }

    public March(): BufferGeometry[] {
        let cubeGeometries: BufferGeometry[] = [];

        // For each cube in the grid
        for(let z = 0; z < this.size - 1; z++) {
            for(let y = 0; y < this.size - 1; y++) {
                for(let x = 0; x < this.size - 1; x++) {
                    
                    // Get the index
                    const index = x + y * this.size + z * this.size * this.size;

                    // Get the cube
                    let cube = this.cubeGrid[index];
                    // Build the mesh
                    const cubeGeometry = cube.buildMesh();

                    // Translate the cube to the correct position
                    cubeGeometry.translate(x, y, z);
                    
                    if(cubeGeometry.getAttribute("position") != null || cubeGeometry.getAttribute("position") != undefined) {
                        cubeGeometries.push(cubeGeometry);
                    }
                }
            }
        }

        return cubeGeometries;
    }

    public mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const finalGeometry = new BufferGeometry()
        const vertices = []
    
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i]
            const position = geometry.getAttribute('position')
    
            for (let j = 0; j < position.count; j++) {
                vertices.push(position.getX(j), position.getY(j), position.getZ(j))
            }
        }
    
        finalGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
        finalGeometry.computeVertexNormals()
        this.geometry = finalGeometry;

        return finalGeometry
    }

    public getPosition(): Vector3 {
        return this.position;
    }

    public getIsoLevel(): number {
        return this.isoLevel;
    }

    public getNoiseScale(): number {
        return this.noiseScale;
    }

    public getScale(): number {
        return this.size;
    }

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

}

export default Volume