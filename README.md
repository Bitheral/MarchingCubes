# A Marching Cubes algorithm package for Three.js

![Version](https://img.shields.io/npm/v/@bitheral/marching-cubes?label=Version&style=for-the-badge)
[![License](https://img.shields.io/npm/l/@bitheral/marching-cubes?style=for-the-badge)](https://github.com/Bitheral/MarchingCubes/blob/main/LICENSE.md)
[![Dependencies](https://img.shields.io/librariesio/release/npm/@bitheral/marching-cubes/1.4.5?style=for-the-badge)](https://www.npmjs.com/package/@bitheral/marching-cubes?activeTab=dependencies)
![Size](https://img.shields.io/bundlephobia/min/@bitheral/marching-cubes?label=Bundle%20Size&style=for-the-badge)

This package is in part a port of Paul Bourke's [marching cubes algorithm](http://paulbourke.net/geometry/polygonise/), to help create an environment using the [Three.js](http://threejs.org/) library.

This package was developed in concurrence with [my dissertation project](https://github.com/Bitheral/webgl-procedural-environment), which is a procedural environment generator using WebGL. It is **recommended** to check out the project for a more complete example.

## Installation

```bash
npm install @bitheral/marching-cubes
```

## Usage

```js
import { VolumeNew: Volume } from '@bitheral/marching-cubes';
import { Vector3, Mesh, MeshBasicMaterial } from 'three';

// Create Marching Cubes volume
const volume = new Volume(32, new Vector3(), new Vector3());
volume.March();

// Create Three.js mesh
const geometry = volume.geometry;
const material = new MeshBasicMaterial({ color: 0x00ff00 });
const mesh = new Mesh(geometry, material);

// Add mesh to scene...
```
