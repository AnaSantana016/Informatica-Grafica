import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let renderer, camera, scene;
let uniforms, material;
let camcontrols;
let isMouseDown = false;

init();
requestAnimationFrame(render);

function fragmentShader(){
  
  return `
  
    uniform vec2 u_resolution;
    uniform vec2 u_mouse;
    uniform float u_time;

    float random(vec2 st) {
        return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
    }

    vec3 dynamicPattern(vec2 st, float time) {
        st += vec2(cos(time), sin(time)) * 0.1;

        float noise = random(st);
        st += noise * 0.1;

        float pattern = sin(st.x * 10.0) * cos(st.y * 10.0);

        vec3 color = vec3(pattern, noise, 1.0 - pattern);

        return color;
    }

    void main() {
        vec2 st = gl_FragCoord.xy / u_resolution.xy;

        vec3 resultColor = dynamicPattern(st + u_mouse / u_resolution, u_time);

        gl_FragColor = vec4(resultColor, 1.0);
    }
  
  `;
}

function init() {
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 10);

  renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);
  
  const geometry = new THREE.PlaneBufferGeometry(window.innerWidth, window.innerHeight);
  uniforms = {
    u_resolution: { value: new THREE.Vector2() },
    u_mouse: { value: new THREE.Vector2() },
    u_time: { value: 1.0 },
  };
  material = new THREE.ShaderMaterial({
    uniforms: uniforms,
    fragmentShader: fragmentShader(),
  });
  const plane = new THREE.Mesh(geometry, material);
  scene.add(plane);
  
  camcontrols = new OrbitControls(camera, renderer.domElement);
  camcontrols.enableRotate = false;
  
  window.addEventListener("mousedown", onMouseDown);
  window.addEventListener("mouseup", onMouseUp);
  window.addEventListener("mousemove", onMouseMove);

  onWindowResize();
  window.addEventListener("resize", onWindowResize, false);
}

function onMouseDown() {
  isMouseDown = true;
}

function onMouseUp() {
  isMouseDown = false;
}

function onMouseMove(event) {
  
  if (isMouseDown) {
    
    const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
    const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

    uniforms.u_mouse.value.x = mouseX;
    uniforms.u_mouse.value.y = mouseY;
  }
}

function onWindowResize(e) {
  renderer.setSize(window.innerWidth, window.innerHeight);
  uniforms.u_resolution.value.x = renderer.domElement.width;
  uniforms.u_resolution.value.y = renderer.domElement.height;
}

function render() {
  uniforms.u_time.value += 0.05;
  
  camcontrols.update();

  renderer.render(scene, camera);
  requestAnimationFrame(render);
}
