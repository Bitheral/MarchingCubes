import Cube, { MeshData } from "./Cube"
import { Vector3, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial, BoxGeometry } from "three"
// import { createNoise3D, createNoise2D } from "simplex-noise";

import { seed, perlin2, perlin3 } from "perlin.js"

export class Volume {
    public size: number;
    public cubeGrid: Cube[] = [];
    public wireframeCube: BufferGeometry = new BufferGeometry;
    public wireframeMesh: Mesh | undefined;
    public position: Vector3;

    public geometry: BufferGeometry = new BufferGeometry();

    public showEdges: boolean = true;
    public edgeSharpness: number = 1.1;
    public show: boolean = true;

    public noiseOffset: Vector3 = new Vector3(0,0,0);
    
    public noiseScale: number = 4;
    public densityThreshold: number = 0.5;
    public yBias: number = 0;

    public gridWireframe: boolean = false;
    public wireFrame: boolean = false;

    public seed: number = 0;
    public noiseSeed = seed(this.seed);

    public noise: any = {
        "2D": perlin2,
        "3D": perlin3,
    }

    constructor(size: number, position: Vector3) {
        this.size = size;
        this.position = position;
        this.yBias = this.size / 2;
        this.generateGrid();
    }

    private generateGrid(): void {
        const boxGeos: BoxGeometry[] = new Array(this.size * this.size * this.size);

        for(let z = 0; z < this.size; z++) {
            for(let y = 0; y < this.size; y++) {
                for(let x = 0; x < this.size; x++) {
                    const index = x + y * this.size + z * this.size * this.size;
                    // When setting the cube position, we need to take into account the position of the volume

                    const cubePosition = new Vector3(x, y, z);
                    cubePosition.add(this.position);

                    this.cubeGrid[index] = new Cube(this, cubePosition);
                    boxGeos[index] = new BoxGeometry(1, 1, 1);
                    boxGeos[index].translate(x, y, z);
                    boxGeos[index].translate(0.5, 0.5, 0.5);
                }
            }
        }

        this.wireframeCube = this.mergeGeometries(boxGeos);
        // Create the mesh
        this.wireframeMesh = new Mesh(this.wireframeCube, new MeshBasicMaterial({color: 0x000000, wireframe: true}));
        this.wireframeMesh.name = "VolumeWireframe";
        this.update("wireframe");
    }

    public enableWireFrame(scene: THREE.Scene): void {
        if(this.wireframeMesh != undefined) {
            scene.add(this.wireframeMesh);
        }
    }


    public update(key: string): void {
        if (key.toLowerCase() == "geometry") {
            this.geometry.dispose();
            this.geometry = this.mergeGeometries(this.March(true));
            this.geometry.computeVertexNormals();
        }
    }


    public March(updateValues: boolean = false): BufferGeometry[] {
        this.noiseSeed = seed(this.seed);
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
                    const cubeGeometry = cube.buildMesh(updateValues);

                    // Translate the cube to the correct position
                    //cubeGeometry.translate(x, y, z);
                    
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

    public static mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
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

        return finalGeometry
    }

    public getPosition(): Vector3 {
        return this.position;
    }

    public getDensityThreshold(): number {
        return this.densityThreshold;
    }

    public getNoiseScale(): number {
        return this.noiseScale;
    }

    public getScale(): number {
        return this.size;
    }

    public getNoiseOffset(): Vector3 {
        // return new Vector3(this.noiseOffsetX, this.noiseOffsetY, this.noiseOffsetZ);
        return this.noiseOffset;
    }

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

    public isShowingEdges(): boolean {
        return this.showEdges;
    }

    public isWireFrame(): boolean {
        return this.wireFrame;
    }
}

// Create type for the volume
export type VolumeType = Volume;

export default Volume