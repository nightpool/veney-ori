
import { AtmosphericComponent, BoxGeometry, Camera3D, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D } from '@orillusion/core';
import './tap-polyfill.js';

await Engine3D.init();

let scene = new Scene3D();
let sky = scene.addComponent(AtmosphericComponent);

let cameraObj = new Object3D();
let camera = cameraObj.addComponent(Camera3D);
// Set the camera perspective according to the window size
camera.perspective(60, window.innerWidth / window.innerHeight, 1, 5000.0);
// Set camera controller
let controller = camera.object3D.addComponent(HoverCameraController);
controller.setCamera(0, 0, 15);
// Add camera node to sence
scene.addChild(cameraObj);

// Create a light object
let light = new Object3D().tap((o) => {
  o.y = -2
  o.rotationX = 45;
  o.rotationY = 30;
  o.addComponent(DirectLight).tap(l => {
    l.intensity = 2;
  });
});
scene.addChild(light);

const obj = new Object3D();
let mr = obj.addComponent(MeshRenderer);
mr.geometry = new BoxGeometry(1,0.5,1);
mr.material = new LitMaterial();
scene.addChild(obj);

const meshes = import.meta.glob('../meshes/*.glb', {as: 'url', eager: true});
Object.entries(meshes).forEach(async ([key, url], i) => {
  const mesh = await Engine3D.res.loadGltf(url);
  mesh.x = i + 1;
  mesh.y = 0;
  scene.addChild(mesh);
});

let view = new View3D();
view.scene = scene;
view.camera = camera;
Engine3D.startRenderView(view);