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
camera.position.y = 20;
camera.position.z = -30; // Menempatkan kamera sedikit di atas permukaan

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

let dog;

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
    //   toggleLights(); // Toggle lampu ketika tombol 'i' ditekan
      video.play();
      addVideoTexture();
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
let previousCameraPosition = new THREE.Vector3();
function updateMovement() {
  previousCameraPosition.copy(controls.getObject().position);

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

  // Periksa tabrakan
  if (checkCollision(cameraPosition)) {
    // Jika bertabrakan, kembalikan kamera ke posisi sebelumnya
    cameraPosition.copy(previousCameraPosition);
  }
  // dog.position.x = camera.position.x
  // dog.position.y = 12
  // dog.position.z = camera.position.z-100
}

// Array untuk menyimpan bounding box objek
let boundingBoxes = [];

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

      // Tambahkan bounding box untuk objek
      const box = new THREE.Box3().setFromObject(object);
      boundingBoxes.push(box);

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

dog = loadObject("./model/dog/source/dog.glb", 50, {x: camera.position.x, y: 12, z: camera.position.z-100}, {x: 0, y: 0, z: 0});

loadObject("./model/KeyBoard.glb", 50, { x: 150, y: 33, z: 121 }, { x: 0, y: Math.PI / 2, z: 0 });
loadObject("./model/bed.glb", 10, { x: -110, y: -55, z: 80 }, { x: 0, y: 0, z: 0 });
// loadObject("./model/sofa.glb", 15, { x: 100, y: -0, z: -60 }, { x: 0, y: 3.2, z: 0 });
// loadObject("./model/PS5.glb", 17, { x: 150, y: 30, z: 80 }, { x: 0, y: 0, z: 0 });
loadObject("./model/pc.glb", 1, { x: 145, y: 35, z: 145 }, { x: 0, y: 2, z: 0 });
// loadObject("./model/Table.glb", 10, { x: 100, y: -15, z: -140 }, { x: 0, y: 0, z: 0 });
// TV 1
// loadObject("./model/TV.gltf", 30, { x: 100, y: 33, z: -135 }, { x: 0, y: -7.8, z: 0 });
loadObject("./model/chair.gltf", 100, { x: 115, y: 3, z: 130 }, { x: 0, y: 2, z: 0 });
loadObject("./model/copia.glb", 50, { x: 120, y: 13, z: 110 }, { x: 0, y: 2, z: 0 });
// loadObject("./model/Tables.glb", 70, { x: 150, y: 0, z: 123 }, { x: 0, y: Math.PI, z: 0 });
loadObject("./model/Office Chair.glb", 100, { x: 100, y: 3, z: -150 }, { x: 0, y: Math.PI, z: 0 });
// TV 2
// loadObject("./model/TV.gltf", 30, { x: 160, y: 35, z: 123 }, { x: 0, y: 15.8, z: 0 });
loadObject("./model/Table.glb", 10, { x: -154, y: -15, z: -20 }, { x: 0, y: Math.PI / 2, z: 0 });
loadObject("./model/aquarium.glb", 0.1, { x: -154, y: 41, z: -20 }, { x: 0, y: Math.PI , z: 0 });
// loadObject("./model/sofa.gltf", 40, { x: 100, y: 0, z: 45 }, { x: 0, y: Math.PI, z: 0 });
// loadObject("./model/sofa.gltf", 40, { x: 100, y: 0, z: 45 }, { x: 0, y: -Math.PI/2, z: 0 });
const fishList = [];
loadObject("./model/fish.glb", 1, { x: -180, y: 52, z: -7 }, { x: 0, y: Math.PI / 2 , z: 0 }, (loadedFish) => {
    fishList.push({ fish: loadedFish, direction: Math.PI / 2 });
  });
  // Ikan 2
  loadObject("./model/fish.glb", 1, { x: -180, y: 60, z: -18 }, { x: 0, y: Math.PI / 2 , z: 0 }, (loadedFish) => {
    fishList.push({ fish: loadedFish, direction: Math.PI / 2 });
  });
  // Ikan 3
  loadObject("./model/fish.glb", 1, { x: -130, y: 52, z: -35 }, { x: 0, y: -Math.PI / 2 , z: 0 }, (loadedFish) => {
    fishList.push({ fish: loadedFish, direction: -Math.PI / 2 });
  });
  // Ikan 4
  loadObject("./model/fish.glb", 1, { x: -130, y: 56, z: -25 }, { x: 0, y: -Math.PI / 2 , z: 0 }, (loadedFish) => {
    fishList.push({ fish: loadedFish, direction: -Math.PI / 2 });
  });

loadObject("./model/Table.glb", 8, { x: 150, y: -10, z: 50 }, { x: 0, y: -Math.PI / 2, z: 0 });
loadObject("./model/TV.gltf", 40, { x: 150, y: 27, z: 45 }, { x: 0, y: -Math.PI, z: 0 });
loadObject("./model/sofa.glb", 18, { x: -10, y: 0, z: 45 }, { x: 0, y: Math.PI/2, z: 0 });
// loadObject("./model/sofa.gltf", 40, { x: 100, y: 0, z: 45 }, { x: 0, y: Math.PI, z: 0 });
// loadObject("./model/sofa.gltf", 40, { x: 100, y: 0, z: 45 }, { x: 0, y: -Math.PI/2, z: 0 });

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
let spins;

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
  rectAreaLight = new THREE.RectAreaLight(0xffffff, 5, width, height);
  rectAreaLight.position.set(position.x, position.y, position.z + 1); // Sedikit di depan layar
  rectAreaLight.rotation.set(rotation.x, -rotation.y, rotation.z);
  scene.add(rectAreaLight);

  const rectLightHelper = new THREE.RectAreaLight(rectAreaLight);
  rectAreaLight.add(rectLightHelper);

}

function addlayar(videoSrc, width, height, position, rotation, id) {
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
    videoMesh.name = "bioskop"; // Memberi nama objek untuk mengaksesnya nanti
  
    videoMesh.position.set(position.x, position.y, position.z);
    if (rotation) {
      videoMesh.rotation.set(rotation.x, rotation.y, rotation.z);
    }
  
    scene.add(videoMesh);
  
    // Tambahkan RectAreaLight di posisi video
    spins = new THREE.RectAreaLight(0xffff00, 1, width, height);
    spins.position.set(position.x, position.y, position.z + 1); // Sedikit di depan layar
    spins.rotation.set(rotation.x, -rotation.y, rotation.z);
    scene.add(spins);
  
    const rectLightHelper = new THREE.RectAreaLight(spins);
    spins.add(rectLightHelper);
  
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

  const pa = scene.getObjectByName("v1");
  if (pa) {
    scene.remove(pa);
    pa.material.map.dispose(); // Hapus texture yang ada
    pa.geometry.dispose();
    pa.material.dispose();
  }

  // Hapus RectAreaLight jika ada
  if (spins) {
    scene.remove(spins);
    spins.dispose();
    spins = null;
  }
}

// Fungsi untuk memperbarui video texture berdasarkan nilai onv
function updateVideoTexture() {
  if (onv) {
    addVideoTexture(
      "./model/Y2meta.app-PlayStation Studios Opening Animation-(1080p).mp4", // Path ke file video
      40, // Lebar layar TV
      25, // Tinggi layar TV
      { x: 147.99, y: 42, z: 45.1 }, // Posisi layar TV
      { x: 0, y: -Math.PI / 2, z: 0 }, // Rotasi layar TV
      "video1" // ID video untuk mengontrolnya
    );
    addlayar(
        "./model/vidio", // Path ke file video
          400, // Lebar layar TV
          400, // Tinggi layar TV
          { x: 0, y: 1000, z: -0.1 }, // Posisi layar TV
          { x: -Math.PI / 2, y: 0, z: 0 }, // Rotasi layar TV
          "v1" // ID video untuk mengontrolnya)
      )
  } else {
    removeVideoTexture();
  }
}

// Fungsi untuk toggle lampu
let lightsOn = false;
function toggleLights() {
  lightsOn = !lightsOn;
  ambientLight.visible = lightsOn;
  directionalLight.visible = lightsOn;
  pointLight.visible = lightsOn;
  

  if (rectAreaLight) {
    rectAreaLight.visible = lightsOn;
    spins.visible = lightsOn;
  }
}
const fishSpeed = 0.2;
function updateFishMovement() {
    fishList.forEach((fishObj) => {
      const fish = fishObj.fish;
      const direction = fishObj.direction;
  
      if (direction === Math.PI / 2) {
        fish.position.z -= fishSpeed;
        if (fish.position.z <= -40) {
          fish.rotation.y = -Math.PI / 2;
          fish.position.x = -130;
          fish.position.z = -35;
          fishObj.direction = -Math.PI / 2;
        }
      } else {
        fish.position.z += fishSpeed;
        if (fish.position.z >= -7) {
          fish.rotation.y = Math.PI / 2;
          fish.position.x = -180;
          fish.position.z = -7;
          fishObj.direction = Math.PI / 2;
        }
      }
    });
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
const wa1 = new THREE.Box3().setFromObject(wall1);
boundingBoxes.push(wa1);
const wa2 = new THREE.Box3().setFromObject(wall2);
boundingBoxes.push(wa2);
const wa3 = new THREE.Box3().setFromObject(wall3);
boundingBoxes.push(wa3);
const wa4 = new THREE.Box3().setFromObject(wall4);
boundingBoxes.push(wa4);


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

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5); // Cahaya directional
directionalLight.position.set(10, 120, 80);
directionalLight.castShadow = true; // Mengaktifkan bayangan pada directional light
scene.add(directionalLight);

directionalLight.shadow.camera.left = -worldScale / 2;
directionalLight.shadow.camera.right = worldScale / 2;
directionalLight.shadow.camera.top = worldScale / 2;
directionalLight.shadow.camera.bottom = -worldScale / 2;
directionalLight.shadow.camera.near = 0.4;
directionalLight.shadow.camera.far = 200;

const pointLight = new THREE.PointLight(0xffffff, 0.3); // Cahaya point light
pointLight.position.set(0, 100, 50);
pointLight.castShadow = true; // Mengaktifkan bayangan pada point light
pointLight.distance = 100; // Mengatur jarak dimana cahaya mulai memudar
pointLight.decay = 2; // Mengatur bagaimana cahaya memudar dengan jarak
scene.add(pointLight);

// Fungsi untuk memeriksa tabrakan antara kamera dan objek
function checkCollision(cameraPosition) {
  const cameraBox = new THREE.Box3().setFromCenterAndSize(
    cameraPosition,
    new THREE.Vector3(3, 10, 3) // Ukuran bounding box kamera
  );

  for (const box of boundingBoxes) {
    if (cameraBox.intersectsBox(box)) {
      return true;
    }
  }
  return false;
}

let dogDirection = 1; // 1 untuk ke kanan, -1 untuk ke kiri
const dogSpeed = 0.1; // Kecepatan berjalan anjing
const dogTurnAngle = Math.PI / 2; // Sudut putar anjing
const dogBoundary = worldScale / 2 - 10; // Batas pergerakan anjing

function moveDog() {
  if (dog) {
    // Perbarui posisi anjing
    dog.position.x += dogSpeed * dogDirection;

    // Jika anjing mencapai batas, putar dan ubah arah
    if (Math.abs(dog.position.x) > dogBoundary) {
      dogDirection *= -1; // Ubah arah
      dog.rotation.y += dogTurnAngle; // Putar anjing 90 derajat
    }
  }
}


// Fungsi untuk animasi
function animate() {
  requestAnimationFrame(animate);

  updateMovement();
  updateFishMovement();
  moveDog();

  renderer.render(scene, camera);
}

// Memulai animasi
animate();
