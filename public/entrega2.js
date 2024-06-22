import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


let camera, controls, scene, renderer;
let textureLoader;
const clock = new THREE.Clock();

const mouseCoords = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
const ballMaterial = new THREE.MeshPhongMaterial({ color: 0x202020 });

let physicsWorld;
const gravityConstant = 7.8;
let collisionConfiguration;
let dispatcher;
let broadphase;
let solver;
let ballCollider;

const margin = 0.05;

const rigidBodies = [];

const pos = new THREE.Vector3();
const quat = new THREE.Quaternion();

let transformAux1;
let tempBtVec3_1;


Ammo().then(function (AmmoLib) {
  Ammo = AmmoLib;

  init();
  animationLoop();
});

function init() {
  initGraphics();
  initPhysics();
  createObjects();
  initInput();
}

function initGraphics() {
  
  camera = new THREE.PerspectiveCamera(
    80,
    window.innerWidth / window.innerHeight,
    0.2,
    2000
  );
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);
  camera.position.set(-14, 4, 0);

  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  document.body.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0,4, 0);
  controls.update();

  textureLoader = new THREE.TextureLoader();


  const ambientLight = new THREE.AmbientLight(0x707070);
  scene.add(ambientLight);

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(-10, 18, 5);
  light.castShadow = true;
  const d = 14;
  light.shadow.camera.left = -d;
  light.shadow.camera.right = d;
  light.shadow.camera.top = d;
  light.shadow.camera.bottom = -d;

  light.shadow.camera.near = 2;
  light.shadow.camera.far = 50;

  light.shadow.mapSize.x = 1024;
  light.shadow.mapSize.y = 1024;

  scene.add(light);
  
  window.addEventListener("resize", onWindowResize);
}

function initPhysics() {
  
  collisionConfiguration = new Ammo.btDefaultCollisionConfiguration();
 
  dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration);
  
  broadphase = new Ammo.btDbvtBroadphase();
  
  solver = new Ammo.btSequentialImpulseConstraintSolver();
  
  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    broadphase,
    solver,
    collisionConfiguration
  );
  
  physicsWorld.setGravity(new Ammo.btVector3(0, -gravityConstant, 0));

  transformAux1 = new Ammo.btTransform();
  tempBtVec3_1 = new Ammo.btVector3(0, 0, 0);
  
  ballCollider = createBoxWithPhysics(0.4, 0.4, 0.4, 0, new THREE.Vector3(), new THREE.Quaternion(), ballMaterial);
}

function createObject(mass, halfExtents, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(
      halfExtents.x * 2,
      halfExtents.y * 2,
      halfExtents.z * 2
    ),
    material
  );
  object.position.copy(pos);
  object.quaternion.copy(quat);

  scene.add(object);

  createRigidBody(object, new Ammo.btBoxShape(new Ammo.btVector3(halfExtents.x, halfExtents.y, halfExtents.z)), mass, pos, quat);

  return object;
}


function createObjects() {
 
  pos.set(0, -0.5, 0);
  quat.set(0, 0, 0, 1);
  const suelo = createBoxWithPhysics(
    40,
    1,
    40,
    0,
    pos,
    quat,
    new THREE.MeshPhongMaterial({ color: 0xffffff })
  );
  suelo.receiveShadow = true;
  textureLoader.load(
    "https://cdn.glitch.global/8b114fdc-500a-4e05-b3c5-a4afa5246b07/grid.png?v=1669716810074",
    function (texture) {
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.repeat.set(40, 40);
      suelo.material.map = texture;
      suelo.material.needsUpdate = true;
    }
  );
  
  createDominosRow();
}

function createDominosRow() {
  const dominoMass = 1;
  const dominoWidth = 0.2;
  const dominoHeight = 1;
  const dominoDepth = 0.5;
  const spacing = 0.1;
  const rowLength = 40; 

  const quat = new THREE.Quaternion();

  const startPosition = (rowLength * dominoWidth + (rowLength - 1) * spacing) / 2;

  for (let i = 0; i < rowLength; i++) {
    const xPos = i * (dominoWidth + spacing) - startPosition;

    const domino = createBoxWithPhysics(
      dominoWidth,
      dominoHeight,
      dominoDepth,
      dominoMass,
      new THREE.Vector3(xPos, dominoHeight / 2, 0),
      new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI), 
      createMaterial(0x964B00) 
    );

    domino.castShadow = true;
    domino.receiveShadow = true;
  }
}


function createBoxWithPhysics(sx, sy, sz, mass, pos, quat, material) {
  const object = new THREE.Mesh(
    new THREE.BoxGeometry(sx, sy, sz, 1, 1, 1),
    material
  );
  
  const shape = new Ammo.btBoxShape(
    new Ammo.btVector3(sx * 0.5, sy * 0.5, sz * 0.5)
  );
  
  shape.setMargin(margin);

  createRigidBody(object, shape, mass, pos, quat);

  return object;
}

function createRigidBody(object, physicsShape, mass, pos, quat, vel, angVel) {
  
  if (pos) {
    object.position.copy(pos);
  } else {
    pos = object.position;
  }

  if (quat) {
    object.quaternion.copy(quat);
  } else {
    quat = object.quaternion;
  }
  
  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);
  
  const localInertia = new Ammo.btVector3(0, 0, 0);
  physicsShape.calculateLocalInertia(mass, localInertia);
 
  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    physicsShape,
    localInertia
  );
  const body = new Ammo.btRigidBody(rbInfo);

  body.setFriction(0.5);

  if (vel) {
    body.setLinearVelocity(new Ammo.btVector3(vel.x, vel.y, vel.z));
  }

  if (angVel) {
    body.setAngularVelocity(new Ammo.btVector3(angVel.x, angVel.y, angVel.z));
  }

  object.userData.physicsBody = body;
  object.userData.collided = false;

  scene.add(object);
  
  if (mass > 0) {
    rigidBodies.push(object);
    
    body.setActivationState(4);
  }
  
  physicsWorld.addRigidBody(body);

  return body;
}

function createRandomColor() {
  return Math.floor(Math.random() * (1 << 24));
}

function createMaterial(color) {
  color = color || createRandomColor();
  return new THREE.MeshPhongMaterial({ color: color });
}

function initInput() {
  window.addEventListener("pointerdown", function (event) {
    
    mouseCoords.set(
      (event.clientX / window.innerWidth) * 2 - 1,
      -(event.clientY / window.innerHeight) * 2 + 1
    );

    raycaster.setFromCamera(mouseCoords, camera);

    const ballMass = 10;
    const ballRadius = 0.2;
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(ballRadius, 14, 10),
      ballMaterial
    );
    ball.castShadow = true;
    ball.receiveShadow = true;
    
    const ballShape = new Ammo.btSphereShape(ballRadius);
    ballShape.setMargin(margin);
    pos.copy(raycaster.ray.direction);
    pos.add(raycaster.ray.origin);
    quat.set(0, 0, 0, 1);
    const ballBody = createRigidBody(ball, ballShape, ballMass, pos, quat);

    pos.copy(raycaster.ray.direction);
    pos.multiplyScalar(4);
    ballBody.setLinearVelocity(new Ammo.btVector3(pos.x, pos.y, pos.z));
  });
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animationLoop() {
  requestAnimationFrame(animationLoop);

  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);

  const firstDomino = rigidBodies[rigidBodies.length - 1];
  if (!firstDomino.userData.collided && checkCollision(ballCollider, firstDomino)) {
    firstDomino.userData.collided = true;
    toppleDominos(firstDomino, rigidBodies.length);
  }

  renderer.render(scene, camera);
}

function toppleDominos(startDomino, rowLength) {
  const impulse = 40; 

  const startPos = startDomino.position.clone();
  const startQuat = startDomino.quaternion.clone();

  for (let i = 0; i < rowLength; i++) {
    const domino = rigidBodies.find((body) => body.position.x === startPos.x + i * (dominoWidth + spacing));
    
    if (domino) {
      
      const impulseVec = new Ammo.btVector3(impulse, 0, 0);
      domino.userData.physicsBody.applyImpulse(impulseVec, new Ammo.btVector3(0, 0, 0));
    }
  }
}

function checkCollision(object1, object2) {
  if (object1.userData && object1.userData.physicsBody) {
    
    const result = new THREE.Vector3();
    object1.userData.physicsBody.getMotionState().getWorldTransform(transformAux1);
    const p = transformAux1.getOrigin();
    result.set(p.x(), p.y(), p.z());

    const distance = result.distanceTo(object2.position);

    return distance < 0.5;
  } else {
    
    const result = new THREE.Vector3();
    object1.getWorldPosition(result);

    const distance = result.distanceTo(object2.position);

    return distance < 0.5;
  }
}


function updatePhysics(deltaTime) {
  
  physicsWorld.stepSimulation(deltaTime, 10);

  for (let i = 0, il = rigidBodies.length; i < il; i++) {
    const objThree = rigidBodies[i];
    const objPhys = objThree.userData.physicsBody;
    
    const ms = objPhys.getMotionState();
    
    if (ms) {
      ms.getWorldTransform(transformAux1);
      const p = transformAux1.getOrigin();
      const q = transformAux1.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());

      objThree.userData.collided = false;
    }
  }
}
