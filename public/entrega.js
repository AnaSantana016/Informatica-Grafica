import * as THREE from "three";
import { FlyControls } from 'three/addons/controls/FlyControls.js';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer;
let camera, camera2;
let info;
let grid;
let estrella,
  Planetas = [],
  Lunas = [];
let t0 = 0;
let accglobal = 0.001;
let timestamp;
let nave;

init();
animationLoop();

function init() {
  info = document.createElement("div");
  info.style.position = "absolute";
  info.style.top = "30px";
  info.style.width = "100%";
  info.style.textAlign = "center";
  info.style.color = "#fff";
  info.style.fontWeight = "bold";
  info.style.backgroundColor = "transparent";
  info.style.zIndex = "1";
  info.style.fontFamily = "Monospace";
  info.innerHTML = "three.js - sol y planetas";
  document.body.appendChild(info);

  //Defino cámara
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);  
  camera2 = new THREE.PerspectiveCamera(
     75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera2.position.set(0, 0, 10);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true; // Habilitar sombras
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipo de sombra suave
  document.body.appendChild(renderer.domElement);
  
  let camcontrols = new OrbitControls(camera, renderer.domElement);
  
  //Parte de la nave, que te trae por defecto las teclas de movimiento
  nave = new FlyControls(camera, renderer.domElement);
  nave.dragToLook = true;
  nave.movementSpeed = 0.01;
  nave.rollSpeed = 0.006;
  nave.enabled = true;
  
  
  //Rejilla de referencia indicando tamaño y divisiones
  grid = new THREE.GridHelper(20, 40);
  //Mostrarla en vertical
  grid.geometry.rotateX(Math.PI / 2);
  grid.position.set(0, 0, 0.05);
  scene.add(grid);
  
  //Objetos
  //mapas de texturas
  //De la superficie
  const tx1sun = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/sunmap.jpg?v=1698921676862");
  const tx2mercu = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/mercurymap.jpg?v=1698921743519");
  const tx3venus = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/venusmap.jpg?v=1698921839672");
  const tx4earth = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/earthmap1k.jpg?v=1698921860093");
  const tx5mars = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/marsmap1k.jpg?v=1698921896774");
  const tx6jupite = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/jupitermap.jpg?v=1698921938016");
  //Capa de nubes
  const tx1nubes = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/earthcloudmap.jpg?v=1698922794771");
  //const txalpha2 = new THREE.TextureLoader().load("https://cdn.glitch.global/341720a6-447a-46ce-b3c9-8002f2955b61/earthcloudmaptrans.jpg?v=1697720954634");
  const txalpha2 = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/earthcloudmaptrans.jpg?v=1698922860279");
  //lunas
  const tx1luna = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/moonmap1k.jpg?v=1699468508251");
  const tx1phobos = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/phobosbump.jpg?v=1699469244646");
  const tx1deimos = new THREE.TextureLoader().load("https://cdn.glitch.global/41015ee0-3f76-42fb-8a56-fc575877cf8b/deimosbump.jpg?v=1699469245375");
  
  // Agregar una luz puntual en la posición de la estrella
  const light = new THREE.PointLight(0xffffff, 2, 0, 2);
  const ambientLight = new THREE.AmbientLight(0x404040); // Color de la luz ambiental (gris oscuro)
  scene.add(ambientLight);
  light.castShadow = true; // Habilitar sombras
  estrella = light;
  scene.add(light);

  //Objetos
  Estrella(1.8, 0xffffff, tx1sun);
  Planeta(0.5, 4.0, 1.0, 0xffffff, 1.0, 1.0, tx2mercu);
  Planeta(0.5, 5.8, -1.2, 0xffffff, 0.7, 1.3, tx3venus);
  Planeta(0.5, 4.8, -1, 0xffffff, 1.2, 1.0, tx1nubes, undefined, undefined, txalpha2);
  Planeta(0.5, 4.6, 1.0, 0xffffff, 1.0, 1.5, tx5mars);
  Planeta(0.5, 5.2, 1.0, 0xffffff, 1.2, 1.0, tx6jupite);
  
  Luna(Planetas[2], 0.2, 0.8, -3.5, 0xffffff, 0.0, tx1luna);

  Luna(Planetas[3], 0.2, 0.8, -3.5, 0xffffff, 0.0, tx1phobos);
  Luna(Planetas[3], 0.2, 0.6, 1.5, 0xffffff, Math.PI / 2, tx1deimos);
  
  //Inicio tiempo
  t0 = Date.now();
}

function Estrella(rad, col, texture = undefined) {
  let geometry = new THREE.SphereGeometry(rad, 10, 10);
  let material = new THREE.MeshBasicMaterial({ color: col });
  
  estrella = new THREE.Mesh(geometry, material);
  //Textura
  if (texture != undefined){
    material.map = texture;
  }
  estrella.castShadow = false;
  estrella.receiveShadow = false;
  scene.add(estrella);
  
}

function Planeta(radio, dist, vel, col, f1, f2, texture = undefined, texbump = undefined, texspec = undefined, texalpha = undefined) {
  let geom = new THREE.SphereGeometry(radio, 10, 10);
  let mat = new THREE.MeshPhongMaterial({ color: col });
  let planeta = new THREE.Mesh(geom, mat);
  planeta.userData.dist = dist;
  planeta.userData.speed = vel;
  planeta.userData.f1 = f1;
  planeta.userData.f2 = f2;
  
  //Textura
  if (texture != undefined){
    mat.map = texture;
  }
  //Rugosidad
  if (texbump != undefined){
    mat.bumpMap = texbump;
    mat.bumpScale = 1.0;
  }
  
  //Especular
  if (texspec != undefined){
    mat.specularMap = texspec;
    mat.specular = new THREE.Color('grey');
  }
  
   //Transparencia
  if (texalpha != undefined){
    //Con mapa de transparencia
    mat.alphaMap = texalpha;
    mat.transparent = true;
    mat.side = THREE.DoubleSide;
    mat.opacity = 1.0;
  }

  
  planeta.castShadow = true;
  planeta.receiveShadow = true;
  
  Planetas.push(planeta);
  scene.add(planeta);
  

  //Dibuja trayectoria, con
  let curve = new THREE.EllipseCurve(
    0,
    0, // centro
    dist * f1,
    dist * f2 // radios elipse
  );
  //Crea geometría
  let points = curve.getPoints(50);
  let geome = new THREE.BufferGeometry().setFromPoints(points);
  let mate = new THREE.LineBasicMaterial({ color: 0xffffff });
  // Objeto
  let orbita = new THREE.Line(geome, mate);
  scene.add(orbita);
  
}

function Luna(planeta, radio, dist, vel, col, angle, texture = undefined) {
  var pivote = new THREE.Object3D();
  pivote.rotation.x = angle;
  planeta.add(pivote);
  var geom = new THREE.SphereGeometry(radio, 10, 10);
  var mat = new THREE.MeshPhongMaterial({ color: col });
  var luna = new THREE.Mesh(geom, mat);
  luna.userData.dist = dist;
  luna.userData.speed = vel;

  //Textura
  if (texture != undefined){
    mat.map = texture;
  }
  
  luna.castShadow = true;
  luna.receiveShadow = true;
  
  Lunas.push(luna);
  pivote.add(luna);
}

//Bucle de animación
function animationLoop() {
  timestamp = (Date.now() - t0) * accglobal;

  requestAnimationFrame(animationLoop);

  //Modifica rotación de todos los objetos
  for (let object of Planetas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) *
      object.userData.f1 *
      object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) *
      object.userData.f2 *
      object.userData.dist;
  }

  for (let object of Lunas) {
    object.position.x =
      Math.cos(timestamp * object.userData.speed) * object.userData.dist;
    object.position.y =
      Math.sin(timestamp * object.userData.speed) * object.userData.dist;
  }
  
  let x, y, w, h;

  //Efecto similar al de defecto, ocupa toda la ventana
  x = Math.floor(window.innerWidth * 0.0);
  y = Math.floor(window.innerHeight * 0.5);
  w = Math.floor(window.innerWidth * 0.5);
  h = Math.floor(window.innerHeight * 0.5);

  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.setScissorTest(true);

  renderer.render(scene, camera);

  //Efecto similar al de defecto, ocupa toda la ventana
  x = Math.floor(window.innerWidth * 0.5);
  y = Math.floor(window.innerHeight * 0.0);
  w = Math.floor(window.innerWidth * 0.5);
  h = Math.floor(window.innerHeight * 0.5);

  renderer.setViewport(x, y, w, h);
  renderer.setScissor(x, y, w, h);
  renderer.setScissorTest(true);

  renderer.render(scene, camera2);

  //Actualizamos el controlador y el 10 sirve para controlar la velocidad
  nave.update(10);
  renderer.render(scene, camera);
  
}

