import * as THREE from "three";

const MAX_POINTS = 500;
let puntosCurva = [], curvaPoints = [], points = [];
let scene, camera, renderer, perfil, plano, torno;
let raycaster, npuntos, flag, gridVisible = false, grid, allowDrawing = true;;

init();
animate();

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 5);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(600, 600);
  document.body.appendChild(renderer.domElement);


  let geometryp = new THREE.PlaneGeometry(40, 40);
  let materialp = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
  });
  plano = new THREE.Mesh(geometryp, materialp);
  plano.visible = false;
  scene.add(plano);
  
  let centralLineGeometry = new THREE.BufferGeometry();
  let centralLineMaterial = new THREE.LineBasicMaterial({ 
                                                            color: 0xffff00, 
                                                            linewidth:60
                                                          });
  let centralLinePositions = new Float32Array([0, 5, 1, 0, -5, 1]);
  centralLineGeometry.setAttribute("position", new THREE.BufferAttribute(centralLinePositions, 3));
  let centralLine = new THREE.Line(centralLineGeometry, centralLineMaterial);
  scene.add(centralLine);


  raycaster = new THREE.Raycaster();

  let geometry = new THREE.BufferGeometry();
  let positions = new Float32Array(MAX_POINTS * 3);
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  npuntos = 0;
  
  
  geometry.setDrawRange(0, npuntos);
  let material = new THREE.LineBasicMaterial({ color: 0xff0000 });
  perfil = new THREE.Line(geometry, material);

  geometry = new THREE.LatheGeometry([], 30);
  material = new THREE.MeshBasicMaterial({
    color: 0x00ff00,
    side: THREE.DoubleSide,
    wireframe: true,
  });
  torno = new THREE.Mesh(geometry, material);

  scene.add(torno);
  scene.add(perfil);
  
  toggleGrid();
  toggleShape();
  undoShape();
  resetGeometry();

  document.addEventListener("mousedown", onDocumentMouseDown);
  document.addEventListener("keydown", onKeyDown);
  
}

function toggleGrid(){
  
  if(!gridVisible)
  {
    grid = new THREE.GridHelper(100, 100);
    grid.position.set(0, 0, 0);
    grid.geometry.rotateX(Math.PI / 2);
    grid.position.set(0, 0, 0.5);
    scene.add(grid);
  }else{
    scene.remove(grid);
  }
  
  gridVisible = !gridVisible;
}

function onDocumentMouseDown(event) {
  
  if (event.target.tagName.toLowerCase() === 'button') {
    return;
  }
  
  if (!allowDrawing) {
    return;
  }
    
  const mouse = {
    x: (event.clientX / renderer.domElement.clientWidth) * 2 - 1,
    y: -(event.clientY / renderer.domElement.clientHeight) * 2 + 1,
  };

  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObject(plano);
  
  if (intersects.length > 0) {
    const point = intersects[0].point;
    curvaPoints.push(new THREE.Vector3(point.x, point.y, point.z));

    // Actualiza la geometría de la curva con los puntos
    const curva = new THREE.CatmullRomCurve3(curvaPoints);
    const puntosCurva = curva.getPoints(MAX_POINTS);

    npuntos = puntosCurva.length;
    const vertices = new Float32Array(npuntos * 3);

    for (let i = 0; i < npuntos; i++) {
      vertices[i * 3] = puntosCurva[i].x;
      vertices[i * 3 + 1] = puntosCurva[i].y;
      vertices[i * 3 + 2] = puntosCurva[i].z;
    }

    perfil.geometry.setAttribute("position", new THREE.BufferAttribute(vertices, 3));
    
  }
}

function animate() {
  requestAnimationFrame(animate);

  perfil.geometry.setDrawRange(0, npuntos);
  perfil.geometry.attributes.position.needsUpdate = true;
  torno.geometry.setDrawRange(0, Infinity);

  renderer.render(scene, camera);
}

function toggleShape(){
  
  flag = !flag;

  if (!flag) return;
  
  allowDrawing = false;
  
  const pointsOnCentralLine = curvaPoints.filter((p) => isPointOnCentralLine(p));

  if (pointsOnCentralLine.length >= 2) {

    for (
      let i = 0;
      i < perfil.geometry.attributes.position.array.length;
      i += 3
    ) {
      points.push(
        new THREE.Vector3(
          perfil.geometry.attributes.position.array[i],
          perfil.geometry.attributes.position.array[i + 1],
          perfil.geometry.attributes.position.array[i + 2]
        )
      );
    }
    
  let curva = new THREE.CatmullRomCurve3(points);
  let puntosCurvaRev = curva.getPoints(60);
  let puntosCurvas = [];

  for (let i = 0; i < puntosCurvaRev.length; i++) {
    puntosCurvas.push(
      new THREE.Vector2(puntosCurvaRev[i].x, puntosCurvaRev[i].y)
    );
  }

  torno.geometry = new THREE.LatheGeometry(puntosCurvas, 10);
  }
}

function isPointOnCentralLine(point) {
  const thresholdDistance = 0.1;
  const distance = Math.abs(point.x);

  return distance < thresholdDistance;
}

function resetGeometry(){
  
  npuntos = 0;
  curvaPoints = [];
  points=[];
  allowDrawing = true;
  
  perfil.geometry.dispose();
  torno.geometry.dispose(); 
  torno.geometry = new THREE.LatheGeometry([], 30); 

  flag = false;
  
}

function undoShape() {
  if (flag) {
    flag = false;
    allowDrawing = true;
    // Limpiar la geometría del torno y reiniciar la variable flag
    torno.geometry.dispose();
    torno.geometry = new THREE.LatheGeometry([], 30);
  } 
}

function onKeyDown(key) {
  switch (key.keyCode) {
    case 38: {
      //tecla up
      toggleShape();
      break;
    }
      
    case 0x20: {
      //tecla espacio
      resetGeometry();
      allowDrawing = true;
      break;
    }
  }
}

window.toggleGrid = toggleGrid;
window.toggleShape = toggleShape;
window.undoShape = undoShape;
window.resetGeometry = resetGeometry;
