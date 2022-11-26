import { Vector3, Vector4 } from "three";

export function VertexLerp(isoLevel: number, vertex1: Vector4, vertex2: Vector4): Vector3 {
    if(Math.abs(isoLevel - vertex1.w) < 0.00001) {
        return new Vector3(vertex1.x, vertex1.y, vertex1.z);
    }

    if(Math.abs(isoLevel - vertex2.w) < 0.00001) {
        return new Vector3(vertex2.x, vertex2.y, vertex2.z);
    }

    if(Math.abs(vertex1.w - vertex2.w) < 0.00001) {
        return new Vector3(vertex1.x, vertex1.y, vertex1.z);
    }

    let t = (isoLevel - vertex1.w) / (vertex2.w - vertex1.w);
    let point = new Vector3(
        vertex1.x + t * (vertex2.x - vertex1.x),
        vertex1.y + t * (vertex2.y - vertex1.y),
        vertex1.z + t * (vertex2.z - vertex1.z)
    );

    return point;
}