import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, renderer, camera, camcontrols;
let mapa, mapsx, mapsy;

let minlon = -15.5304,
  maxlon = -15.3656;
let minlat = 28.0705,
  maxlat = 28.1817;
let txwidth, txheight;
let psx, psy;
let objetos = [];
let nest;

init();
animate();

function init() {
    const container = document.getElementById("escena-container");

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    camcontrols = new OrbitControls(camera, renderer.domElement);

    mapsx = 5;
    mapsy = 5;
    Plano(0, 0, 0, mapsx, mapsy);

    // Carga del mapa
    const tx1 = new THREE.TextureLoader().load(
        "https://cdn.glitch.global/341720a6-447a-46ce-b3c9-8002f2955b61/mapaLPGC.png?v=1697723131403",
        function (texture) {
            console.log(texture.image.width, texture.image.height);

            mapa.material.map = texture;
            mapa.material.needsUpdate = true;

            txwidth = texture.image.width;
            txheight = texture.image.height;

            if (txheight > txwidth) {
                let factor = txheight / (maxlon - minlon);
                mapa.scale.set(1, factor, 1);
                mapsy *= factor;
            } else {
                let factor = txwidth / txheight;
                mapa.scale.set(factor, 1, 1);
                mapsx *= factor;
            }
        }
    );
}

function buscarDatos() {
  const fechaInput = document.getElementById("fechaInput").value;
  const fecha = new Date(fechaInput);

  // Eliminar puntos existentes
  objetos.forEach((mesh) => {
    scene.remove(mesh);
  });
  objetos = [];

  // Cargar datos y buscar ubicaciones
  cargarDatosYBuscarUbicaciones(fecha);
}

function cargarDatosYBuscarUbicaciones(fecha) {
  // Cargar datos desde el archivo CSV usando una Promesa
  const promise = new Promise((resolve, reject) => {
    var loader = new THREE.FileLoader();
    loader.load("Alquileres-Octubre-2023.csv", function (text) {
      try {
        const datosFiltrados = filtrarDatosPorFecha(text, fecha);
        resolve(datosFiltrados);
      } catch (error) {
        reject(error);
      }
    });
  });

  // Procesar los datos después de que se completen
  promise
    .then((datosFiltrados) => {
      // Mostrar puntos en todas las ubicaciones de recogida
      datosFiltrados.forEach((dato) => {
        buscarUbicacion(dato.rentalPlace);
      });
    })
    .catch((error) => {
      console.error("Error al cargar datos:", error);
    });
}

function filtrarDatosPorFecha(text, fecha) {
  const data = [];

  let lines = text.split("\n");
  for (let line of lines) {
    let values = line.split(",");
    if (values.length >= 3) {
      const startTimeStr = values[0].substring(1, values[0].length - 1).trim();
      const startTimeParts = startTimeStr.split(" ");
      const startTime = new Date(startTimeParts[0]);
      
      // Comparar solo las partes de fecha (día, mes, año)
      if (
        startTime.getDate() === fecha.getDate() &&
        startTime.getMonth() === fecha.getMonth() &&
        startTime.getFullYear() === fecha.getFullYear()
      ) {
        data.push({
          startTime: startTime,
          rentalPlace: values[2].substring(1, values[2].length - 1).trim(),
        });
      }
    }
  }
  return data;
}


function buscarUbicacion(lugar) {
  // Cargar datos de ubicaciones desde el archivo CSV
  var loader = new THREE.FileLoader();
  loader.load("Geolocalización estaciones sitycleta.csv", function (text) {
    let lines = text.split("\n");
    nest = 0;
    for (let line of lines) {
      if (nest > 0) {
        let values = line.split(",");
        const nombreEstacion = values[1].substring(1, values[1].length - 1).trim(); 
        console.log("Comparando:", nombreEstacion, lugar.trim());
        if (nombreEstacion === lugar.trim()) {
          console.log("Coincidencia encontrada:", nombreEstacion, lugar.trim());
          const mlon = Mapeo(
            Number(values[7].substring(1, values[7].length - 1)),
            minlon,
            maxlon,
            -mapsx / 2,
            mapsx / 2
          );
          const mlat = Mapeo(
            Number(values[6].substring(1, values[6].length - 1)),
            minlat,
            maxlat,
            -mapsy / 2,
            mapsy / 2
          );
          Esfera(mlon, mlat, 0, 0.1, 10, 10, 0x00ff00);
          break; 
        }
      }
      nest += 1;
    }
  });
}

let intervalId; // Variable para almacenar el ID del intervalo
let fechaActual; // Variable para almacenar la fecha actual

function simularPasoDelTiempo() {
  const fechaInicio = fechaActual || new Date("10/1/2023"); // Usa la fecha almacenada o inicia desde el 10/1/2023
  const fechaFin = new Date("10/31/2023");
  const unDiaEnMilisegundos = 24 * 60 * 60 * 1000; 

  fechaActual = fechaInicio; // Actualiza la fecha actual

  // Utiliza setInterval para simular el paso del tiempo
  intervalId = setInterval(() => {
    // Detén la simulación al llegar al final de octubre
    if (fechaActual > fechaFin) {
      detenerSimulacion();
      return;
    }

    // Actualiza el elemento HTML con la fecha actual
    document.getElementById("fechaActual").innerText = fechaActual.toDateString();

    // Buscar y dibujar ubicaciones para la fecha actual
    buscarDatosParaFecha(fechaActual);

    // Aumentar la fecha actual en un día
    fechaActual = new Date(fechaActual.getTime() + unDiaEnMilisegundos);

    // Eliminar puntos existentes
    objetos.forEach((mesh) => {
      scene.remove(mesh);
    });
    objetos = [];
  }, 2500); // Cambia este valor para ajustar la velocidad de simulación
}

// Función para detener la simulación
function detenerSimulacion() {
  clearInterval(intervalId);
}

// Función para reiniciar la simulación
function reiniciarSimulacion() {
  detenerSimulacion();
  fechaActual = null; // Reinicia la fecha actual
  document.getElementById("fechaActual").innerText = ""; 
}

function buscarDatosParaFecha(fecha) {
  // Cargar datos y buscar ubicaciones
  cargarDatosYBuscarUbicaciones(fecha);
}

function Mapeo(val, vmin, vmax, dmin, dmax) {
  let t = 1 - (vmax - val) / (vmax - vmin);
  return dmin + t * (dmax - dmin);
}

function Esfera(px, py, pz, radio, nx, ny, col) {
  let geometry = new THREE.SphereBufferGeometry(0.05, nx, ny);
  let material = new THREE.MeshBasicMaterial({
    color: col,
  });
  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  objetos.push(mesh);
  scene.add(mesh);
}

function Plano(px, py, pz, sx, sy) {
  let geometry = new THREE.PlaneBufferGeometry(sx, sy);

  let material = new THREE.MeshBasicMaterial({});

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(px, py, pz);
  scene.add(mesh);
  mapa = mesh;
}

function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

document.getElementById("simularButton").addEventListener("click", simularPasoDelTiempo);
document.getElementById("detenerButton").addEventListener("click", detenerSimulacion);
document.getElementById("reiniciarButton").addEventListener("click", reiniciarSimulacion);

