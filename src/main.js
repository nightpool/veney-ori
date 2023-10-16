
import { AtmosphericComponent, BoxGeometry, Camera3D, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Vector3, Quaternion, VertexAttributeName, SkyRenderer } from '@orillusion/core';
import { ColliderComponent, BoxColliderShape, SphereColliderShape, CapsuleColliderShape, MeshColliderShape } from '@orillusion/core';
import { Physics, Rigidbody, ConvexHullColliderShape } from './physics.js';
import { Ammo, Physics, Rigidbody } from '@orillusion/physics';
import './tap-polyfill.js';
import skymap from '../textures/skybox.png';

Physics.gravity = new Vector3(0, -4.81, 0);
await Physics.init();
await Engine3D.init({
  renderLoop: () => {
    if (Physics.isInited) {
      Physics.update();
    }
  }
});

let scene = new Scene3D();
let sky = scene.addComponent(AtmosphericComponent);
// const skyTexture = await Engine3D.res.loadTextureCubeStd(skymap);
// const sky = scene.addComponent(SkyRenderer);
// sky.map = skyTexture;

let cameraObj = new Object3D();
let camera = cameraObj.addComponent(Camera3D);
// Set the camera perspective according to the window size
camera.perspective(30, window.innerWidth / window.innerHeight, 1, 5000.0);
// Set camera controller
let controller = camera.object3D.addComponent(HoverCameraController);
controller.setCamera(-90, -15, 15);
controller.mouseRightFactor = 0.07;
controller.wheelStep = 0.02;
controller.maxDistance = 25;
// Add camera node to sence
scene.addChild(cameraObj);

// Create a light object
const light = new Object3D().tap((o) => {
  o.y = 2;
  o.rotationX = 57;
  o.rotationZ = 48;
  o.addComponent(DirectLight).tap(l => {
    l.intensity = 20;
    l.castShadow = true;
  });
});
Engine3D.setting.shadow.enable = true;
scene.addChild(light);

const meshes = import.meta.glob('../meshes/*.glb', {as: 'url', eager: true});

const board = await Engine3D.res.loadGltf(meshes['../meshes/board.glb']);
window.board = board;
board.y = -1;
scene.addChild(board);
delete meshes['../meshes/board.glb'];
board.addComponent(Rigidbody).tap(b => { b.friction = 0.8; b.mass = 0; });
board.receiveShadow = true;
const collider = board.addComponent(ColliderComponent);
collider.shape = new BoxColliderShape();
const boardRenderer = board.getComponentsInChild(MeshRenderer)[0];
collider.shape.size = boardRenderer.geometry.bounds.size;
boardRenderer.receiveShadow = true;

Object.entries(meshes).forEach(async ([key, url], i) => {
  const mesh = await Engine3D.res.loadGltf(url);
  mesh.y = -0.5;
  mesh.z = i - 4;
  mesh.x = 0;
  mesh.getComponentsInChild(MeshRenderer).forEach(r => {
    r.castShadow = true;
    r.receiveShadow = true;

  });
  let body = mesh.addComponent(Rigidbody);
  body.friction = 0.8;
  body.restitution = 0.6;
  body.mass = 10;
  let collider = mesh.addComponent(ColliderComponent);
  collider.shape = new ConvexHullColliderShape();
  collider.shape.mesh = mesh;
  scene.addChild(mesh);
});

let view = new View3D();
view.scene = scene;
view.camera = camera;
Engine3D.startRenderView(view);