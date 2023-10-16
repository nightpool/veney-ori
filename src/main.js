
import { AtmosphericComponent, BoxGeometry, Camera3D, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Vector3, Quaternion, VertexAttributeName } from '@orillusion/core';
import { ColliderComponent, BoxColliderShape } from '@orillusion/core';
import { Physics, Rigidbody, ConvexHullColliderShape } from './physics.js';
import './tap-polyfill.js';

Physics.gravity = new Vector3(0, -9.81, 0);
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

let cameraObj = new Object3D();
let camera = cameraObj.addComponent(Camera3D);
// Set the camera perspective according to the window size
camera.perspective(30, window.innerWidth / window.innerHeight, 1, 5000.0);
// Set camera controller
let controller = camera.object3D.addComponent(HoverCameraController);
controller.setCamera(-90, -15, 15);
// Add camera node to sence
scene.addChild(cameraObj);

// Create a light object
let light = new Object3D().tap((o) => {
  o.y = -2
  o.rotationX = 45;
  o.rotationY = 30;
  o.addComponent(DirectLight).tap(l => {
    l.intensity = 20;
  });
});
scene.addChild(light);

const obj = new Object3D();
let mr = obj.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(10,0.5,10);
mr.material = new LitMaterial();
let body = obj.addComponent(Rigidbody);
body.friction = 0.8;
body.mass = 0;  // static
let collider = obj.addComponent(ColliderComponent);
collider.shape = new BoxColliderShape();
collider.shape.size = new Vector3(10, 0.5, 10);

scene.addChild(obj);

const meshes = import.meta.glob('../meshes/*.glb', {as: 'url', eager: true});
Object.entries(meshes).forEach(async ([key, url], i) => {
  const mesh = await Engine3D.res.loadGltf(url);
  mesh.x = 0;
  mesh.y = i + 1;
  mesh.z = 0;

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