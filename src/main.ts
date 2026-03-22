import * as THREE from 'three';
import { FractalRenderer, getOptimalResolution } from './renderer/FractalRenderer';
import { FractalEngine } from './engine/FractalEngine';
import { UIController } from './ui/UIController';
import { bindTouchEvents } from './ui/EventBindings';
import { SIDEBAR_WIDTH_PX, RESIZE_DEBOUNCE_MS, BREAKPOINT_TABLET } from './constants';

// Initialize Three.js scene
const canvas = document.getElementById('canvas');
if (!canvas) {
  throw new Error('Fatal: Could not find #canvas element in the DOM. Ensure index.html contains <div id="canvas"></div>.');
}
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });

/** Determine whether the viewport is in desktop mode (sidebar is visible inline). */
function isDesktop(): boolean {
  return window.innerWidth >= BREAKPOINT_TABLET;
}

/** Compute the effective canvas width based on current viewport. */
function getCanvasWidth(): number {
  return isDesktop() ? window.innerWidth - SIDEBAR_WIDTH_PX : window.innerWidth;
}

renderer.setSize(getCanvasWidth(), window.innerHeight);
renderer.setClearColor(0x000000);
renderer.outputColorSpace = THREE.SRGBColorSpace;
canvas.appendChild(renderer.domElement);

camera.position.z = 2;

// Initialize FractalEngine
const fractalEngine = new FractalEngine();
const fractalRenderer = new FractalRenderer(scene, renderer);
const uiController = new UIController(fractalEngine, fractalRenderer);

// ---- Touch interactions (pinch-to-zoom, pan, double-tap reset) ----
bindTouchEvents(renderer.domElement, uiController);

// ---- Responsive controls toggle ----
const controlsEl = document.getElementById('controls');
const toggleBtn = document.getElementById('controls-toggle');
const backdrop = document.getElementById('controls-backdrop');

function openControls(): void {
  controlsEl?.classList.add('controls-open');
  backdrop?.classList.add('visible');
}

function closeControls(): void {
  controlsEl?.classList.remove('controls-open');
  backdrop?.classList.remove('visible');
}

function toggleControls(): void {
  if (controlsEl?.classList.contains('controls-open')) {
    closeControls();
  } else {
    openControls();
  }
}

toggleBtn?.addEventListener('click', toggleControls);
backdrop?.addEventListener('click', closeControls);

// Close controls panel when switching to desktop breakpoint
const desktopQuery = window.matchMedia(`(min-width: ${BREAKPOINT_TABLET}px)`);
desktopQuery.addEventListener('change', (e: MediaQueryListEvent) => {
  if (e.matches) {
    // Entering desktop — ensure panel is not in "open" overlay state
    closeControls();
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

// Handle window resize with debounce
let resizeTimeout: ReturnType<typeof setTimeout>;
window.addEventListener('resize', () => {
  const width = getCanvasWidth();
  const height = window.innerHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width, height);

  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    const optimal = getOptimalResolution(width, height);
    fractalRenderer.setResolution(optimal.width, optimal.height);
    uiController.triggerRender();
  }, RESIZE_DEBOUNCE_MS);
});

animate();

console.log('FractalEngine initialized');
