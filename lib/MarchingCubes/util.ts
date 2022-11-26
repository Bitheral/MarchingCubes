import { Vector3, Vector4 } from "three";

export function VertexInterp(isoLevel: number, vertex1: Vector4, vertex2: Vector4): Vector3 {
    if(Math.abs(isoLevel - vertex1.w) < 0.00001) {
        return new Vector3(vertex1.x, vertex1.y, vertex1.z);
    }
    if(Math.abs(isoLevel - vertex2.w) < 0.00001) {
        return new Vector3(vertex2.x, vertex2.y, vertex2.z);
    }
    if(Math.abs(vertex1.w - vertex2.w) < 0.00001) {
        return new Vector3(vertex1.x, vertex1.y, vertex1.z);
    }

    let mu = (isoLevel - vertex1.w) / (vertex2.w - vertex1.w);
    let x = vertex1.x + mu * (vertex2.x - vertex1.x);
    let y = vertex1.y + mu * (vertex2.y - vertex1.y);
    let z = vertex1.z + mu * (vertex2.z - vertex1.z);

    return new Vector3(x, y, z);
}