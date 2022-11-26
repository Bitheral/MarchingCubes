import { Vector3, Vector4 } from "three";
import Noise from "../noise";

export class Cube {
    private position: Vector3 = new Vector3(0, 0, 0);

    private verticiesPositions: Vector3[] = [
        new Vector3(0, 0, 0),
        new Vector3(0, 0, 1),
        new Vector3(0, 1, 0),
        new Vector3(0, 1, 1), 
        new Vector3(1, 0, 0),
        new Vector3(1, 0, 1),
        new Vector3(1, 1, 0),
        new Vector3(1, 1, 1)
    ];
    private vertexValues: Vector4[] = [];

    constructor(position: Vector3) {
        this.position = position;
        this.generateValues();
    }

    private generateValues(): void {
        if(this.vertexValues.length >= 1)
            return;

        this.verticiesPositions.forEach(pos => {
            let value = Noise.perlin3(pos);
            this.vertexValues.push(new Vector4(pos.x, pos.y, pos.z, value));
        });
    }
}

export default Cube;