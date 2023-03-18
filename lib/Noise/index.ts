import { seed, perlin2, perlin3 } from "perlin.js"
import { createNoise3D, createNoise2D } from "simplex-noise";
import { Vector3 } from "three";

export interface NoiseData {
    offset: Vector3;
    scale: number;
    octaves: number;
    persistence: number;
    lacunarity: number;
}

export const NoiseData = {
    offset: new Vector3(0, 0, 0),
    scale: 1,
    octaves: 1,
    persistence: 1,
    lacunarity: 1,
};

export class Noise {
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

    public seed = 0;
    private noiseType =  "perlin";

    constructor(_seed: number) {
        this.seed = Noise.createSeed(_seed);
    }

    public static createSeed(_seed: number) {
        return seed(_seed);
    }

    public setType(type: string) {
        switch(type) {
            case "perlin":
            case "simplex":
                this.noiseType = type;
                break;
            default:
                console.error("Noise type not found");
                console.warn("Defaulting to perlin noise");
                this.noiseType = "perlin";
                break;
        }
    }

    public generate3D(position: Vector3, noiseData: NoiseData): number {
        let noise = this.noise[this.noiseType]["3D"];

        if(noiseData.scale <= 0) {
            noiseData.scale = 0.0001;
        }
        
        let coord = position.clone().multiplyScalar(noiseData.scale).add(noiseData.offset);
        let perlinValue = noise(coord.x, coord.y, coord.z);

        return perlinValue;
    }

    public generate3DFBM(position: Vector3, noiseData: NoiseData, offset: Vector3): number {
        let noise = this.noise[this.noiseType]["3D"];

        let maxPossibleHeight = 0;
        let amplitude = 1;
        let frequency = 1;

        for(let i = 0; i < noiseData.octaves; i++) {
            maxPossibleHeight += amplitude;
            amplitude *= noiseData.persistence;
        }

        if(noiseData.scale <= 0) {
            noiseData.scale = 0.0001;
        }

        // Get max and min values of Float
        let max = Number.MAX_VALUE;
        let min = Number.MIN_VALUE;

        let noiseHeight = 0;
        amplitude = 1;
        frequency = 1;

        for(let i = 0; i < noiseData.octaves; i++) {
            let coord = position.clone().multiplyScalar(noiseData.scale * frequency).add(offset).add(noiseData.offset);

            let perlinValue = noise(coord.x, coord.y, coord.z);
            noiseHeight += perlinValue * amplitude;

            amplitude *= noiseData.persistence;
            frequency *= noiseData.lacunarity;
        }

        if(noiseHeight > max) {
            max = noiseHeight;
        } else if(noiseHeight < min) {
            min = noiseHeight;
        }

        return noiseHeight;
    }


}

export default {Noise, NoiseData};