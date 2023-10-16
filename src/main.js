
import { AtmosphericComponent, BoxGeometry, Camera3D, DirectLight, Engine3D, HoverCameraController, LitMaterial, MeshRenderer, Object3D, Scene3D, View3D, Vector3, Quaternion, VertexAttributeName } from '@orillusion/core';
import { ColliderComponent, BoxColliderShape, SphereColliderShape, CapsuleColliderShape, MeshColliderShape } from '@orillusion/core';
import { Ammo, Physics, Rigidbody } from '@orillusion/physics';
import './tap-polyfill.js';

Rigidbody.prototype.getPhysicShape = function() {
  let collider = this.object3D.getComponent(ColliderComponent);
  let colliderShape = collider.shape;
  if (colliderShape instanceof BoxColliderShape) {
    return new Ammo.btBoxShape(new Ammo.btVector3(colliderShape.halfSize.x, colliderShape.halfSize.y, colliderShape.halfSize.z));
  } else if (colliderShape instanceof CapsuleColliderShape) {
    return new Ammo.btCapsuleShape(colliderShape.radius, colliderShape.height);
  } else if (colliderShape instanceof MeshColliderShape) {
    let mesh = new Ammo.btTriangleMesh();
    let geom = colliderShape.mesh.getComponentsInChild(MeshRenderer)[0].geometry;
    let pos = geom.getAttribute(VertexAttributeName.position).data;
    let indices = geom.getAttribute(VertexAttributeName.indices).data;
    //console.log(pos);
    //console.log(indices);
    //console.log(indices.length);
    for (let i = 0; i < indices.length / 3; i++) {
      mesh.addTriangle(
        new Ammo.btVector3(pos[3*indices[3*i]], pos[3*indices[3*i] + 1], pos[3*indices[3*i] + 2]),
        new Ammo.btVector3(pos[3*indices[3*i + 1]], pos[3*indices[3*i + 1] + 1], pos[3*indices[3*i + 1] + 2]),
        new Ammo.btVector3(pos[3*indices[3*i + 2]], pos[3*indices[3*i + 2] + 1], pos[3*indices[3*i + 2] + 2]),
        true
      );
    }
    //console.log(mesh);

    return new Ammo.btBvhTriangleMeshShape(mesh, true, true);
  } else if (colliderShape instanceof SphereColliderShape) {
    return new Ammo.btSphereShape(colliderShape.radius);
  }
  console.log("Unknown colliderShape!");
}
Rigidbody.prototype.addAmmoRigidbody = function() {
  var shape = this.getPhysicShape();
  var btTransform = new Ammo.btTransform();
  btTransform.setIdentity();
  var localInertia = new Ammo.btVector3(0, 0, 0);
  shape.calculateLocalInertia(this.mass, localInertia);

  btTransform.setOrigin(new Ammo.btVector3(this.object3D.x, this.object3D.y, this.object3D.z));
  let t = this.object3D.transform;

  Quaternion.HELP_0.fromEulerAngles(t.rotationX, t.rotationY, t.rotationZ);
  let btq = new Ammo.btQuaternion(Quaternion.HELP_0.x, Quaternion.HELP_0.y, Quaternion.HELP_0.z, Quaternion.HELP_0.w);
  btTransform.setRotation(btq);

  var motionState = new Ammo.btDefaultMotionState(btTransform);
  var rbInfo = new Ammo.btRigidBodyConstructionInfo(this.mass, motionState, shape, localInertia);

  this._btRigidbody = new Ammo.btRigidBody(rbInfo);
  this._btRigidbody.setRestitution(this.restitution);
  this.btRigidbody.setFriction(this.friction);
  this.btRigidbody.setRollingFriction(this.rollingFriction);
  Physics.addRigidbody(this);
}

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
mr.geometry = new BoxGeometry(1,0.5,1);
mr.material = new LitMaterial();
let body = obj.addComponent(Rigidbody);
body.friction = 0.8;
body.mass = 0;  // static
let collider = obj.addComponent(ColliderComponent);
collider.shape = new BoxColliderShape();
collider.shape.size = new Vector3(1, 0.5, 1);

scene.addChild(obj);

const meshes = import.meta.glob('../meshes/*.glb', {as: 'url', eager: true});
Object.entries(meshes).forEach(async ([key, url], i) => {
  const mesh = await Engine3D.res.loadGltf(url);
  mesh.x = 0;
  mesh.y = i + 1;
  mesh.z = 0;

  let body = mesh.addComponent(Rigidbody);
  body.friction = 0.8;
  body.restitution = 1.1;
  body.mass = 10;
  let collider = mesh.addComponent(ColliderComponent);
  collider.shape = new MeshColliderShape();
  collider.shape.mesh = mesh;
  //let vertexBuf = mesh.getComponentsInChild(MeshRenderer)[0].geometry.vertexBuffer;
  //collider.shape = new SphereColliderShape();
  //collider.shape.radius = 0.1;
  //collider.shape.mesh = mesh;

  scene.addChild(mesh);
});

let view = new View3D();
view.scene = scene;
view.camera = camera;
Engine3D.startRenderView(view);