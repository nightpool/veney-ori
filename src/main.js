import './tap-polyfill.js';
import { Camera3D, DirectLight, Engine3D, HoverCameraController, Object3D, Scene3D, View3D, Vector3, SkyRenderer } from '@orillusion/core';
import { ColliderComponent, BoxColliderShape } from '@orillusion/core';
import { Physics, Rigidbody } from './physics.js';
import Board from './Board.js';
import Piece from './Piece.js';

import skymap from '../textures/skybox.hdr';

Physics.gravity = new Vector3(0, -4.81, 0);
await Physics.init();
Engine3D.setting.shadow.enable = true;
await Engine3D.init({
  renderLoop: () => {
    if (Physics.isInited) {
      Physics.update();
    }
  }
});

let scene = new Scene3D();
const skyTexture = await Engine3D.res.loadHDRTextureCube(skymap);
const sky = scene.addComponent(SkyRenderer);
sky.map = skyTexture;
scene.envMap = skyTexture

let cameraObj = new Object3D();
let camera = cameraObj.addComponent(Camera3D);
camera.perspective(30, window.innerWidth / window.innerHeight, 1, 5000.0);
let controller = camera.object3D.addComponent(HoverCameraController);
controller.setCamera(90, -10, 15, new Vector3(0, 2, 0));
controller.mouseRightFactor = 0.07;
controller.wheelStep = 0.02;
controller.maxDistance = 25;
scene.addChild(cameraObj);

const light = new Object3D().tap((o) => {
  o.y = 4;
  o.rotationX = 57;
  o.rotationZ = 48;
  o.addComponent(DirectLight).tap(l => {
    l.intensity = 20;
    l.castShadow = true;
  });
});
scene.addChild(light);

const board = await Board.load();
board.setScene(scene);
window.board = board;

const floor = new Object3D().tap(f => {
  f.addComponent(Rigidbody).tap(r => {r.mass = 0});
  const collider = f.addComponent(ColliderComponent);
  collider.shape = new BoxColliderShape().tap(b => {
    b.size = new Vector3(100, 0.5, 100);
  });

  // don't ask me why the board is this fucked up;
  f.y = board.origin.y - board.size.y*2;
});
scene.addChild(floor);

const {default: engagement} = await import('../meshes/engagement.glb');
await Engine3D.res.loadGltf(engagement);
for (let i = 0; i < 4; i++) {
  for (let j = 0; j < 16; j++) {
    new Piece(Engine3D.res.getPrefab(engagement), j<8 ? 'light' : 'dark').tap(p => {
      p.pos = board.toWorld(i*2-2, j);
      p.setScene(scene);
    });
  }
}

let view = new View3D();
view.scene = scene;
view.camera = camera;
Engine3D.startRenderView(view);