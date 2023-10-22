import { MeshRenderer, VertexAttributeName } from '@orillusion/core';
import { ColliderComponent, BoxColliderShape, SphereColliderShape, CapsuleColliderShape, MeshColliderShape, ColliderShape } from '@orillusion/core';
import { Ammo, Physics, Rigidbody } from '@orillusion/physics';

export { Physics, Rigidbody };

export class ConvexHullColliderShape extends ColliderShape {
  rayPick(ray, fromMatrix) {
    let box = this.box;
    box.setFromCenterAndSize(this.center, this.size);

    let helpMatrix = ColliderShape.helpMatrix;
    helpMatrix.copyFrom(fromMatrix).invert();

    let helpRay = ColliderShape.helpRay.copy(ray);
    helpRay.applyMatrix(helpMatrix);

    let pick = helpRay.intersectBox(this.box, ColliderShape.v3_help_0);
    if (pick) {
      if (!this._pickRet) {
        this._pickRet = { intersectPoint: new Vector3(), distance: 0 };
      }
      this._pickRet.intersectPoint = pick;
      this._pickRet.distance = Vector3.distance(helpRay.origin, ColliderShape.v3_help_0);
      return this._pickRet;
    }
    return null;
  }
}

Rigidbody.prototype.getPhysicShape = function() {
  let collider = this.object3D.getComponent(ColliderComponent);
  let colliderShape = collider.shape;
  if (colliderShape instanceof BoxColliderShape) {
    return new Ammo.btBoxShape(new Ammo.btVector3(colliderShape.halfSize.x, colliderShape.halfSize.y, colliderShape.halfSize.z));
  } else if (colliderShape instanceof CapsuleColliderShape) {
    return new Ammo.btCapsuleShape(colliderShape.radius, colliderShape.height);
  } else if (colliderShape instanceof ConvexHullColliderShape) {
    let geom = colliderShape.mesh.getComponentsInChild(MeshRenderer)[0].geometry;
    let pos = geom.getAttribute(VertexAttributeName.position).data;
    let hull = new Ammo.btConvexHullShape();
    for (let i = 0; i < pos.length / 3; i++) {
      hull.addPoint(new Ammo.btVector3(pos[3*i], pos[3*i + 1], pos[3*i + 2]));
    }
    hull.setMargin(0.001);
    return hull;
  } else if (colliderShape instanceof MeshColliderShape) {
    let geom = colliderShape.mesh.getComponentsInChild(MeshRenderer)[0].geometry;
    let pos = geom.getAttribute(VertexAttributeName.position).data;

    let indices = geom.getAttribute(VertexAttributeName.indices).data;
    let mesh = new Ammo.btTriangleMesh();
    for (let i = 0; i < indices.length / 3; i++) {
      mesh.addTriangle(
        new Ammo.btVector3(pos[3*indices[3*i]], pos[3*indices[3*i] + 1], pos[3*indices[3*i] + 2]),
        new Ammo.btVector3(pos[3*indices[3*i + 1]], pos[3*indices[3*i + 1] + 1], pos[3*indices[3*i + 1] + 2]),
        new Ammo.btVector3(pos[3*indices[3*i + 2]], pos[3*indices[3*i + 2] + 1], pos[3*indices[3*i + 2] + 2]),
        true
      );
    }
    return new Ammo.btBvhTriangleMeshShape(mesh);
  } else if (colliderShape instanceof SphereColliderShape) {
    return new Ammo.btSphereShape(colliderShape.radius);
  }
  console.log("Unknown colliderShape!");
}