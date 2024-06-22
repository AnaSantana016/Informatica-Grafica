import * as THREE from "three";

let scene, renderer;
let camera;
let objetos = [];

init();
animationLoop();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(40, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 0, 50);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  const gridSize = 10;
  const spacing = 3;

  const groundGeometry = new THREE.PlaneGeometry(gridSize * spacing * 2, gridSize * spacing * 2);
  const groundMaterial = new THREE.MeshBasicMaterial({ color: 0xaaaaaa, side: THREE.DoubleSide });
  const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
  groundMesh.rotation.x = Math.PI / 2;
  scene.add(groundMesh);

  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      const posX = i * spacing - (gridSize * spacing) / 2;
      const posY = j * spacing - (gridSize * spacing) / 2;

      if (i % 2 === 0) {
        const cube = Cubo(posX, posY, 0, 0.9, 0.9, 0.9, 0x00ff00);
        objetos.push(cube);

        const cubeMovement = new TWEEN.Tween(cube.position)
          .to({ x: posX + spacing * 2, y: posY + spacing * 2, z: 15 }, 2000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .yoyo(true)
          .repeat(Infinity)
          .start();
      } else {
        const sphere = Esfera(posX, posY, 0, 0.9, 32, 32, 0xff0000);
        objetos.push(sphere);

        const sphereRotation = new TWEEN.Tween(sphere.rotation)
          .to({ x: Math.PI * 2, y: Math.PI * 2, z: Math.PI * 2 }, 3000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .repeat(Infinity)
          .start();

        const sphereMovement = new TWEEN.Tween(sphere.position)
          .to({ x: posX + spacing * 2, y: posY + spacing * 2, z: 15 }, 2000)
          .easing(TWEEN.Easing.Quadratic.InOut)
          .yoyo(true)
          .repeat(Infinity)
          .delay(1000) 
          .start();
      }
    }
  }
}

function Cubo(px, py, pz, sx, sy, sz, col) {
  const geometry = new THREE.BoxBufferGeometry(sx, sy, sz);
  const material = new THREE.MeshNormalMaterial({ color: col });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  return mesh;
}

function Esfera(px, py, pz, radius, widthSegments, heightSegments, col) {
  const geometry = new THREE.SphereBufferGeometry(radius, widthSegments, heightSegments);
  const material = new THREE.MeshNormalMaterial({ color: col });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  return mesh;
}

function animationLoop() {
  requestAnimationFrame(animationLoop);
  TWEEN.update();
  renderer.render(scene, camera);
}