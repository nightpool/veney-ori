import { ColliderComponent, Engine3D, MeshRenderer, LitMaterial, Color } from '@orillusion/core';
import { Rigidbody, ConvexHullColliderShape } from './physics.js';
import once from 'lodash/once';

const DARK_MATERIAL = once(() => new LitMaterial().tap(l => {
  l.baseColor = new Color(0.0824, 0.0824, 0.0824, 1);
  l.roughness = 0.7;
}));

export default class Piece {
  constructor(obj, team = 'light') {
    this.obj = obj;

    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    if (team == 'dark') {
      this.mesh.material = DARK_MATERIAL();
    }

    this.obj.addComponent(Rigidbody).tap(body => {
      body.friction = 0.8;
      body.restitution = 0.6;
      body.mass = 10;
    });

    this.obj.addComponent(ColliderComponent).tap(collider => {
      collider.shape = new ConvexHullColliderShape();
      collider.shape.mesh = this.obj;
    });
  }

  set pos(pos) {
    return this.obj.localPosition = pos;
  }

  get mesh() {
    if (!this._mesh) {
      this._mesh = this.obj.getComponentsInChild(MeshRenderer)[0];
    }
    return this._mesh;
  }

  get size() {
    return this.mesh.geometry.bounds.size;
  }

  setScene(scene) {
    scene.addChild(this.obj);
  }

  
  static async load(url) {
    return new Piece(await Engine3D.res.loadGltf(url));
  }
}