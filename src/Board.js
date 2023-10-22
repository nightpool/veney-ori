import { Vector3, ColliderComponent, BoxColliderShape, Engine3D, MeshRenderer } from '@orillusion/core';
import { Rigidbody } from './physics.js';
import mesh from '../meshes/board.glb';

export default class Board {
  WIDTH = 4;
  LENGTH = 4 * 4;
  _origin = new Vector3(0, 0, 0);

  constructor(obj) {
    this.obj = obj;

    this.obj.addComponent(Rigidbody).tap(b => {
      b.friction = 0.8;
      b.mass = 0;
    });

    this.obj.addComponent(ColliderComponent).tap(c => {
      c.shape = new BoxColliderShape();
      c.shape.size = this.size;
    });

    this.obj.y = 2;
  }

  toWorld(file, rank, inverse=false) {
    const measure = Math.floor(rank / 4);

    const x = (this.size.x / this.WIDTH) * (file + 0.5)
    const z = (this.size.z / this.LENGTH) * (rank + 0.5) + (measure * 0.02);

    return new Vector3(
      this.origin.x + x,
      this.origin.y + this.size.y + 0.01,
      this.origin.z + z,
    );
  }

  get origin() {
    return this.obj.localPosition.add(this.mesh.geometry.bounds.min, this._origin);
  }

  get mesh() {
    if (!this._mesh) {
      this._mesh = this.obj.getComponentsInChild(MeshRenderer)[0];
    }
    return this._mesh;
  }

  get size() {
    if (!this._size) {
      this._size = this.mesh.geometry.bounds.size;
    }

    return this._size;
  }

  setScene(scene) {
    scene.addChild(this.obj);
  }

  static async load() {
    return new Board(await Engine3D.res.loadGltf(mesh));
  }
}