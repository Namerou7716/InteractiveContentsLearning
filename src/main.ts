import * as THREE from 'three';
import { Collisions } from './lib/collisions.js';

// Scene
const scene = new THREE.Scene();

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 15, 15);
camera.lookAt(0, 0, 0);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setClearColor(0xf0f0f0);
document.body.appendChild(renderer.domElement);

// Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
directionalLight.position.set(5, 10, 7.5);
scene.add(directionalLight);

// Ground
const groundGeometry = new THREE.PlaneGeometry(50, 50);
const groundMaterial = new THREE.MeshStandardMaterial({ color: 0xcccccc });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
scene.add(ground);

// Collision System
const collisionSystem = new Collisions();

// Player
const playerGeometry = new THREE.SphereGeometry(1, 32, 32);
const playerMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
const player = new THREE.Mesh(playerGeometry, playerMaterial);
player.position.y = 1;
scene.add(player);
const playerCollider = collisionSystem.createCircle(player.position.x, player.position.z, 1);
(player as any).collider = playerCollider;

// Obstacles
const obstacles = [];
const obstaclePositions = [
  new THREE.Vector3(-5, 1, 0),
  new THREE.Vector3(5, 1, 0),
  new THREE.Vector3(0, 1, -5),
  new THREE.Vector3(0, 1, 5),
];

const obstacleGeometry = new THREE.SphereGeometry(1.5, 32, 32);
const obstacleMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });

for (const pos of obstaclePositions) {
  const obstacle = new THREE.Mesh(obstacleGeometry, obstacleMaterial);
  obstacle.position.copy(pos);
  (obstacle as any).velocity = new THREE.Vector3(); // Add velocity
  scene.add(obstacle);
  obstacles.push(obstacle);
  const collider = collisionSystem.createCircle(pos.x, pos.z, 1.5);
  (obstacle as any).collider = collider;
}

// Mouse interaction
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 1); // Plane at y=1
const targetPosition = new THREE.Vector3();

window.addEventListener('mousemove', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  raycaster.ray.intersectPlane(plane, targetPosition);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);

  // Move player according to mouse
  player.position.x = targetPosition.x;
  player.position.z = targetPosition.z;
  playerCollider.x = player.position.x;
  playerCollider.y = player.position.z;

  // Update obstacles
  for (const obstacle of obstacles) {
    // Apply velocity
    obstacle.position.x += (obstacle as any).velocity.x;
    obstacle.position.z += (obstacle as any).velocity.z;
    (obstacle as any).collider.x = obstacle.position.x;
    (obstacle as any).collider.y = obstacle.position.z;

    // Apply damping
    (obstacle as any).velocity.multiplyScalar(0.95);
  }

  // Handle collisions
  collisionSystem.update();

  const results = collisionSystem.results;
  for (const result of results) {
    const body = result.body;
    const target = result.target;
    const overlap = result.overlap_v;

    const isPlayerBody = body === playerCollider;
    const isPlayerTarget = target === playerCollider;

    if (isPlayerBody || isPlayerTarget) {
      const obstacleCollider = isPlayerBody ? target : body;
      const obstacle = obstacles.find(o => (o as any).collider === obstacleCollider);

      if (obstacle) {
        if (isPlayerBody) {
          // Player is the body, move player back and push obstacle
          player.position.x -= overlap.x;
          player.position.z -= overlap.y;
          (obstacle as any).velocity.x += overlap.x * 0.1;
          (obstacle as any).velocity.z += overlap.y * 0.1;
        } else {
          // Player is the target, move player and push obstacle
          player.position.x += overlap.x;
          player.position.z += overlap.y;
          (obstacle as any).velocity.x -= overlap.x * 0.1;
          (obstacle as any).velocity.z -= overlap.y * 0.1;
        }

        // Update player collider after resolution
        playerCollider.x = player.position.x;
        playerCollider.y = player.position.z;
      }
    }
  }

  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});