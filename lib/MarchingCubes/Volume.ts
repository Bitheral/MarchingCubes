import Cube, { MeshData } from "./Cube"
import { Vector3, Vector4, BufferGeometry, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshLambertMaterial, BoxGeometry } from "three"
import { createNoise3D, createNoise2D } from "simplex-noise";
import alea from "alea";

import { Noise, NoiseData } from "../Noise"

import { VertexInterp3, VertexInterp4 } from "./util";
import { edgeTable, triTable, cornerIndexFromEdge} from "./lookup.json"

import { seed, perlin2, perlin3 } from "perlin.js"

export interface VolumeNeighbours {
    front: VolumeNew | Volume | null,
    back: VolumeNew | Volume | null,
    left: VolumeNew | Volume | null,
    right: VolumeNew | Volume |null,
    frontLeft: VolumeNew | Volume |null,
    frontRight: VolumeNew | Volume |null,
    backLeft: VolumeNew | Volume | null,
    backRight: VolumeNew | Volume | null
}


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
    public densityThreshold: number = 1;
    public yBias: number = 0;

    public gridWireframe: boolean = false;
    public wireFrame: boolean = false;

    public seed: number = 0;
    public noiseSeed: number = 0;
    public pNoiseSeed = Volume.createSeed(this.seed);

    public ySize: number = 0;

    public noise: any = {
        perlin: {
            "2D": perlin2,
            "3D": perlin3,
        },
        simplex: {
            "2D": createNoise2D(),
            "3D": createNoise3D(),
        }
    }

    public static createSeed(_seed: number) {
        return seed(_seed);
    }

    constructor(size: number, position: Vector3) {
        this.size = size;
        this.ySize = size / 2;

        this.seed = Date.now();
        this.pNoiseSeed = seed(this.seed);
        
        // If the position is not zero, divide it by the size of the volume
        // This is to make sure that the volume is centered around the position
        this.position = position.clone().divideScalar(size);
        this.noiseOffset = this.position.clone();

        this.yBias = this.ySize;
        this.generateGrid();
    }

    private generateGrid(): void {
        const boxGeos: BoxGeometry[] = new Array(this.size * this.size * this.size);

        for(let z = 0; z < this.size; z++) {
            for(let y = 0; y < this.size; y++) {
                for(let x = 0; x < this.size; x++) {
                    // Get the index
                    const index = x + y * this.size + z * this.size * this.size;


                    // When setting the cube position, we need to take into account the position of the volume

                    const cubePosition = new Vector3(x, y, z);

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

        this.cubeGrid = [];
        this.generateGrid();

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
        const uvs = []
    
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i]
            const position = geometry.getAttribute('position')
            const uv = geometry.getAttribute('uv')
    
            for (let i = 0; i < position.count; i++) {
                vertices.push(position.getX(i), position.getY(i), position.getZ(i))
            }

            for (let i = 0; i < uv.count; i++) {
                uvs.push(uv.getX(i), uv.getY(i))
            }
        }
    
        finalGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
        finalGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
        finalGeometry.computeVertexNormals()
        this.geometry = finalGeometry;

        return finalGeometry
    }

    public static mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
        const finalGeometry = new BufferGeometry()
        const vertices = []
        const uvs = []
    
        for (let i = 0; i < geometries.length; i++) {
            const geometry = geometries[i]
            const position = geometry.getAttribute('position');
            const uv = geometry.getAttribute('uv');
    
            for (let j = 0; j < position.count; j++) {
                vertices.push(position.getX(j), position.getY(j), position.getZ(j))
            }

            for (let j = 0; j < uv.count; j++) {
                uvs.push(uv.getX(j), uv.getY(j))
            }
        }
    
        finalGeometry.setAttribute('position', new Float32BufferAttribute(vertices, 3))
        finalGeometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
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

export class VolumeNew {

    private static cubeCorners: Vector3[] = [
        new Vector3(0, 0, 0),
        new Vector3(1, 0, 0),
        new Vector3(1, 0, 1),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        new Vector3(1, 1, 0),
        new Vector3(1, 1, 1),
        new Vector3(0, 1, 1)
    ]

    public size: number;
    public position: Vector3 = new Vector3(0,0,0);

    public vertices: number[] = [];
    public uvs: number[] = [];
    public densities: number[] = [];

    public geometry: BufferGeometry = new BufferGeometry();

    public showEdges: boolean = false;
    public edgeSharpness: number = 1.1;
    public show: boolean = true;

    public noiseOffset: Vector3 = new Vector3(0,0,0);
    
    public noiseScale: number = 4;
    public densityThreshold: number = 1;
    public yBias: number = 0;

    public seed: number = 0;
    public noiseSeed: number = 0;
    public pNoiseSeed = Volume.createSeed(this.seed);

    public ySize: number = 0;

    public customNoise: Noise = new Noise(this.seed);

    public noiseConfigs: NoiseData[] = [];

    public neighbours = {
        front: null,
        back: null,
        left: null,
        right: null,
        frontLeft: null,
        frontRight: null,
        backLeft: null,
        backRight: null
    } as VolumeNeighbours;

    public noise: any = {
        perlin: {
            "2D": perlin2,
            "3D": perlin3,
        },
        simplex: {
            "2D": createNoise2D(),
            "3D": createNoise3D(),
        }
    }

    constructor(size: number, position: Vector3, noiseOffset: Vector3 = new Vector3(0,0,0)) {
        this.size = size;
        this.position = position;
        this.noiseOffset = noiseOffset;

        this.ySize = this.size / 2;
        this.yBias = this.ySize;

        this.noiseConfigs.push({
            'scale': 1,
            'octaves': 4,
            'persistence': 0.5,
            'lacunarity': 2,
            'offset': new Vector3(0,0,0)
        });
    }

    public update(key: string): void {
        if (key.toLowerCase() == "geometry") {
            this.geometry.dispose();
            this.March();
            this.geometry.computeVertexNormals();
        }

        // if(key.toLowerCase() == "noise") {
        //     for(let i = 0; i < this.noiseConfigs.length; i++) {
        //         this.noiseConfigs[i].offset = this.position.clone().multiplyScalar(this.noiseConfigs[i].scale);

        //     }
        // }
    }


    public March() {
        this.noiseSeed = seed(this.seed);
        this.vertices = [];
        this.densities = [];
        this.uvs = [];
        
        let frontNeighbour = this.neighbours.front;
        let backNeighbour = this.neighbours.back;
        let leftNeighbour = this.neighbours.left;
        let rightNeighbour = this.neighbours.right;
        
        let frontLeftNeighbour = this.neighbours.frontLeft;
        let frontRightNeighbour = this.neighbours.frontRight;
        let backLeftNeighbour = this.neighbours.backLeft;
        let backRightNeighbour = this.neighbours.backRight;

        let zSize = (frontNeighbour == null) ? this.size - 1 : this.size;
        let xSize = (rightNeighbour == null) ? this.size - 1 : this.size;

        // For each cube in the grid
        for(let z = 0; z < zSize; z++) {
            for(let y = 0; y < this.size-1; y++) {
                for(let x = 0; x < xSize; x++) {

                    let cubeindex:number = 0;
                    let cubePosition = new Vector3(x, y, z);
                    let corners: Vector4[] = [];
                    let cornerDensity: number[] = [];

                    VolumeNew.cubeCorners.forEach((corner, i) => {
                        let cornerPos = corner.clone();
                        cornerPos.add(cubePosition);
                        
                        let noise = 0;

                        // For each noise config, add the noise
                        for(let config of this.noiseConfigs) {
                            let cPosition = cornerPos.clone();
                            cPosition.z -= zSize * 0.5;
                            cPosition.x -= xSize * 0.5;
                            cPosition.divideScalar(this.getScale());

                            const volumePosition = this.position.clone().multiplyScalar(config.scale);
                            let newNoise = this.customNoise.generate3DFBM(
                                cPosition,
                                config,
                                volumePosition
                            );

                            noise += (newNoise * (1 / this.noiseConfigs.length));
                        }

                        // let noise = this.customNoise.generate3D(, this.noiseScale, 1, 1, 1, this.noiseOffset);

                        noise = (noise + 1) / 2;

                        let heightBias = (cornerPos.y / this.getScale());
                        let density = heightBias * (cornerPos.y / this.yBias || 0.001) - noise;

                        cornerDensity[i] = density;
                        corners[i] = new Vector4(cornerPos.x, cornerPos.y, cornerPos.z, density);
                    });

                    
                    for(let i = 0; i < 8; i++) {
                        const corner = corners[i];
                        

                        // If the corner at at the top of the volume,
                        // the corner.w will be 1, otherwise it will be 0
                        
                        const cornerIsAtTop = corner.y == this.getScale() - 1;
                        const cornerIsAtBottom = corner.y == 0;
                        const cornerIsAtRight = corner.x == this.getScale() - 1;
                        const cornerIsAtLeft = corner.x == 0;
                        const cornerIsAtFront = corner.z == this.getScale() - 1;
                        const cornerIsAtBack = corner.z == 0;

                        const showFrontFace = (cornerIsAtFront && !frontNeighbour) && z == this.size - 2;
                        const showBackFace = (cornerIsAtBack && !backNeighbour) && z == 0;
                        const showRightFace = (cornerIsAtRight && !rightNeighbour) && x == this.size - 2;
                        const showLeftFace = (cornerIsAtLeft && !leftNeighbour) && x == 0;

                                               
                        if(showFrontFace) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];
                        if(showBackFace) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];
                        if(showRightFace) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];
                        if(showLeftFace) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];

                        if(cornerIsAtBottom) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];
                        if(cornerIsAtTop) corner.w = (this.showEdges) ? this.edgeSharpness : cornerDensity[i];

                        if(corner.w <= this.getDensityThreshold()) {
                            cubeindex |= 1 << i;
                        }
                    }

                    /* Cube is entirely in/out of the surface */
                    if (edgeTable[cubeindex] == 0) {
                        continue;
                    }


                    const triangluation = triTable[cubeindex];
                    triangluation.forEach(edge => {
                        if(edge == -1) return;

                        let indexA = cornerIndexFromEdge[edge][0];
                        let indexB = cornerIndexFromEdge[edge][1];

                        let cornerA = corners[indexA];
                        let cornerB = corners[indexB];
                        
                        let vert = VertexInterp3(this.getDensityThreshold(), cornerA, cornerB);

                        // Get the vertex
                        // Don't interpolate
                        // let vert = cornerA.clone();
                        // vert.add(cornerB);
                        // vert.divideScalar(2);
                        
                        this.vertices.push(vert.x, vert.y, vert.z);

                        // Create UV  from vert
                        let uvVert = vert.clone().divideScalar(this.getScale())
                        this.uvs.push(uvVert.x, uvVert.z);
                    });
                }
            }
        }

        // Create the geometry
        this.geometry = new BufferGeometry();
        this.geometry.setAttribute('position', new Float32BufferAttribute(this.vertices, 3));
        this.geometry.setAttribute('uv', new Float32BufferAttribute(this.uvs, 2));

        this.geometry.computeVertexNormals();
        this.geometry.translate(this.position.x * this.size, this.position.y  * this.size, this.position.z  * this.size);
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

    public getGeometry(): BufferGeometry {
        return this.geometry;
    }

    public isShowingEdges(): boolean {
        return this.showEdges;
    }
}

// Create type for the volume
export type VolumeType = Volume;

export default { Volume, VolumeNew, NoiseData };