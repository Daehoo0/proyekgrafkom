import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Inisialisasi scene, kamera, dan renderer
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Latar belakang biru

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.y = 50; // Menempatkan kamera sedikit di atas permukaan

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Tipe shadow map yang lebih lembut

// Definisikan skala dunia
const worldScale = 350;

// Load tekstur lantai dari file JPG
const textureLoader = new THREE.TextureLoader();
const floorTexture = textureLoader.load("./models/lantai.webp");

// Buat dataran tanah dengan tekstur dari file JPG
const groundGeometry = new THREE.PlaneGeometry(worldScale, worldScale);
const groundMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true; // Menerima bayangan
scene.add(ground);

// Movement variables
let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let onv = false; // Variable untuk mengontrol video
const speed = 0.1;

// Pointer lock controls
const controls = new PointerLockControls(camera, document.body);
scene.add(controls.getObject());

document.addEventListener("click", () => {
  controls.lock();
});

document.addEventListener("keydown", onKeyDown);
document.addEventListener("keyup", onKeyUp);

// Fungsi untuk menangani penekanan tombol keyboard
function onKeyDown(event) {
  switch (event.key) {
    case "w":
      moveForward = true;
      break;
    case "s":
      moveBackward = true;
      break;
    case "a":
      moveLeft = true;
      break;
    case "d":
      moveRight = true;
      break;
    case "p":
      onv = !onv; // Toggle nilai onv untuk mengubah video
      updateVideoTexture();
      break;
    case "i":
      toggleLights(); // Toggle lampu ketika tombol 'i' ditekan
      break;
    case "m":
      toggleMute(); // Mengubah status mute video
      break;
  }
}

function onKeyUp(event) {
  switch (event.key) {
    case "w":
      moveForward = false;
      break;
    case "s":
      moveBackward = false;
      break;
    case "a":
      moveLeft = false;
      break;
    case "d":
      moveRight = false;
      break;
  }
}

// Fungsi untuk memperbarui pergerakan kamera
function updateMovement() {
  const speedFactor = speed * (camera.position.y / 2);

  if (moveForward) controls.moveForward(speedFactor);
  if (moveBackward) controls.moveForward(-speedFactor);
  if (moveLeft) controls.moveRight(-speedFactor);
  if (moveRight) controls.moveRight(speedFactor);

  // Mendapatkan posisi kamera
  const cameraPosition = controls.getObject().position;

  // Batasi pergerakan kamera di dalam batas dunia
  cameraPosition.x = THREE.MathUtils.clamp(
    cameraPosition.x,
    -worldScale / 2,
    worldScale / 2
  );
  cameraPosition.z = THREE.MathUtils.clamp(
    cameraPosition.z,
    -worldScale / 2,
    worldScale / 2
  );
}

// Fungsi untuk memuat objek 3D dari file GLB
const loadObject = (objPath, scale, position, rotation, callback) => {
  const gltfLoader = new GLTFLoader();
  gltfLoader.load(
    objPath,
    function (gltf) {
      const object = gltf.scene;
      object.scale.set(scale, scale, scale);
      object.position.set(position.x, position.y, position.z);

      if (rotation) {
        object.rotation.set(rotation.x, rotation.y, rotation.z);
      }

      object.traverse(function (node) {
        if (node.isMesh) {
          node.castShadow = true; // Menghasilkan bayangan
          node.receiveShadow = true; // Menerima bayangan
        }
      });

      scene.add(object);

      if (callback) callback(object);

    },
    function (xhr) {
      console.log((xhr.loaded / xhr.total) * 100 + "% dimuat");
    },
    function (error) {
      console.error("Terjadi kesalahan", error);
    }
  );
};

loadObject("./model/Table.glb", 8, { x: 100, y: -10, z: 50 }, { x: 0, y: -Math.PI / 2, z: 0 });
loadObject("./model/TV.gltf", 40, { x: 100, y: 27, z: 45 }, { x: 0, y: -Math.PI, z: 0 });

// Fungsi untuk memutar ulang video pertama
function playFirstVideo() {
  const video1 = document.getElementById("video1");
  if (video1) {
    video1.currentTime = 0;
    video1.play();
  }
}

// Variabel untuk RectAreaLight
let rectAreaLight;

// Fungsi untuk menambahkan video sebagai tekstur
function addVideoTexture(videoSrc, width, height, position, rotation, id) {
  const video = document.createElement('video');
  video.id = id;
  video.src = videoSrc;
  video.loop = true;
  video.muted = true;
  video.play();

  const videoTexture = new THREE.VideoTexture(video);
  const videoMaterial = new THREE.MeshBasicMaterial({ map: videoTexture });

  const videoGeometry = new THREE.PlaneGeometry(width, height);
  const videoMesh = new THREE.Mesh(videoGeometry, videoMaterial);
  videoMesh.name = "videoMesh"; // Memberi nama objek untuk mengaksesnya nanti

  videoMesh.position.set(position.x, position.y, position.z);
  if (rotation) {
    videoMesh.rotation.set(rotation.x, rotation.y, rotation.z);
  }

  scene.add(videoMesh);

  // Tambahkan RectAreaLight di posisi video
  rectAreaLight = new THREE.RectAreaLight(0xffffff, 10, width, height);
  rectAreaLight.position.set(position.x, position.y, position.z - 1); // Sedikit di depan layar
  rectAreaLight.rotation.set(rotation.x, -rotation.y, rotation.z);
  scene.add(rectAreaLight);

  const rectLightHelper = new THREE.RectAreaLight(rectAreaLight);
  rectAreaLight.add(rectLightHelper);
}

// Fungsi untuk menghapus video dari scene
function removeVideoTexture() {
  const videoMesh = scene.getObjectByName("videoMesh");
  if (videoMesh) {
    scene.remove(videoMesh);
    videoMesh.material.map.dispose(); // Hapus texture yang ada
    videoMesh.geometry.dispose();
    videoMesh.material.dispose();
  }

  // Hapus RectAreaLight jika ada
  if (rectAreaLight) {
    scene.remove(rectAreaLight);
    rectAreaLight.dispose();
    rectAreaLight = null;
  }
}

// Fungsi untuk memperbarui video texture berdasarkan nilai onv
function updateVideoTexture() {
  if (onv) {
    addVideoTexture(
      "./model/Y2meta.app-PlayStation Studios Opening Animation-(1080p).mp4", // Path ke file video
      40, // Lebar layar TV
      25, // Tinggi layar TV
      { x: 97.9, y: 42, z: 45.1 }, // Posisi layar TV
      { x: 0, y: -Math.PI / 2, z: 0 }, // Rotasi layar TV
      "video1" // ID video untuk mengontrolnya
    );
  } else {
    removeVideoTexture();
  }
}

// Fungsi untuk toggle lampu
let lightsOn = true;
function toggleLights() {
  lightsOn = !lightsOn;
  ambientLight.visible = lightsOn;
  directionalLight.visible = lightsOn;
  pointLight.visible = lightsOn;
  if (rectAreaLight) {
    rectAreaLight.visible = lightsOn;
  }
}

// Membuat dinding
const wallGeometry = new THREE.BoxGeometry(worldScale, 190, 10);
const wallMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff }); // Ubah material ke MeshPhong untuk mendukung bayangan
const wall1 = new THREE.Mesh(wallGeometry, wallMaterial);
wall1.position.set(0, 50, -worldScale / 2);
wall1.receiveShadow = true; // Menerima bayangan
scene.add(wall1);

const wall2 = new THREE.Mesh(wallGeometry, wallMaterial);
wall2.position.set(0, 50, worldScale / 2);
wall2.receiveShadow = true; // Menerima bayangan
scene.add(wall2);

const wall3 = new THREE.Mesh(wallGeometry, wallMaterial);
wall3.position.set(worldScale / 2, 50, 0);
wall3.rotation.y = Math.PI / 2;
wall3.receiveShadow = true; // Menerima bayangan
scene.add(wall3);

const wall4 = new THREE.Mesh(wallGeometry, wallMaterial);
wall4.position.set(-worldScale / 2, 50, 0);
wall4.rotation.y = Math.PI / 2;
wall4.receiveShadow = true; // Menerima bayangan
scene.add(wall4);

// Membuat atap
const roofGeometry = new THREE.BoxGeometry(worldScale, 10, worldScale);
const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xffffff });
const roof = new THREE.Mesh(roofGeometry, roofMaterial);
roof.position.set(0, 150, 0);
roof.receiveShadow = true; // Menerima bayangan
scene.add(roof);

// Pencahayaan
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Meningkatkan intensitas cahaya ambient
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.7); // Cahaya directional
directionalLight.position.set(10, 120, 80);
directionalLight.castShadow = true; // Mengaktifkan bayangan pada directional light
scene.add(directionalLight);

directionalLight.shadow.camera.left = -worldScale / 2;
directionalLight.shadow.camera.right = worldScale / 2;
directionalLight.shadow.camera.top = worldScale / 2;
directionalLight.shadow.camera.bottom = -worldScale / 2;
directionalLight.shadow.camera.near = 0.4;
directionalLight.shadow.camera.far = 200;

const pointLight = new THREE.PointLight(0xffffff, 1.0); // Cahaya point light
pointLight.position.set(0, 100, 50);
pointLight.castShadow = true; // Mengaktifkan bayangan pada point light
pointLight.distance = 100; // Mengatur jarak dimana cahaya mulai memudar
pointLight.decay = 2; // Mengatur bagaimana cahaya memudar dengan jarak
scene.add(pointLight);

// Fungsi untuk animasi
function animate() {
  requestAnimationFrame(animate);

  updateMovement();

  renderer.render(scene, camera);
}

// Memulai animasi
animate();
