import * as THREE from 'three';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
// import { OrbitControls } from 'three/addons/controls/OrbitControls.js'; // removed interactivity

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

let object;
let modelGroup = new THREE.Object3D(); // 🌐 Group to center pivot and rotate
scene.add(modelGroup); // Add to scene immediately

const loader = new OBJLoader();

loader.load(
    '/static/assets/logo.obj',
    (gltf) => {
       
       
        object = gltf;

        // Add the object to the modelGroup (so we rotate the group, not the object directly)
        modelGroup.add(object);

        // Material override for shiny silvery look
        object.traverse((child) => {
            if (child.isMesh) {
                const mat = new THREE.MeshStandardMaterial({
                    color: 0x0a0a0a,
                    metalness: 0.95,
                    roughness: 0.35,
                    envMapIntensity: 0.6
                });
                if (child.material && child.material.map) mat.map = child.material.map;
                child.material = mat;
            }
        });

        // Fit camera to object inside the group
        fitCameraToObject(camera, modelGroup, 1.1);

            document.getElementById('loader-wrapper').style.display = 'none';
    },
    (xhr) => {
        console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
    },
    (error) => {
        console.error('An error happened while loading GLTF:', error);
    }
);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.85;
document.getElementById('container3d').appendChild(renderer.domElement);

// Environment reflections (shiny silver)
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
const envScene = new RoomEnvironment();
const envMap = pmremGenerator.fromScene(envScene, 0.04).texture;
scene.environment = envMap;

// Lights
camera.position.z = 5;

const topLight = new THREE.DirectionalLight(0xffffff, 2.0);
topLight.position.set(5, 10, 7);
scene.add(topLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const rimLight = new THREE.DirectionalLight(0xffffff, 1.4);
rimLight.position.set(-5, -5, 5);
scene.add(rimLight);

const fillLight = new THREE.HemisphereLight(0xddeeff, 0x080820, 0.4);
scene.add(fillLight);

let rotationSpeed = 0.005
// Animate loop - 🌍 Rotate the wrapper group, not the raw object
function animate() {
    requestAnimationFrame(animate);

    if (object) {
        
        if(Math.abs(modelGroup.rotation.y) > 0.3)
            rotationSpeed = rotationSpeed * -1;
        modelGroup.rotation.y += rotationSpeed; // 🔁 Rotate around Z-axis like a globe
    }

    renderer.render(scene, camera);
}

// CTA scroll behavior
const exploreBtn = document.getElementById('exploreNow');
if (exploreBtn) {
    exploreBtn.addEventListener('click', () => {
        const secondPage = document.getElementById('secondPage');
        if (secondPage) {
            secondPage.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
}

// Fetch and render gallery
async function loadGallery() {
    try {
        const gallery = document.getElementById('gallery');
        if (!gallery) return;

        // skeletons
        gallery.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const sk = document.createElement('article');
            sk.className = 'card skeleton';
            sk.style.height = '260px';
            gallery.appendChild(sk);
        }

        const response = await fetch('/api/parts');
        const items = await response.json();

        gallery.innerHTML = '';
        items.forEach((item) => {
            const card = document.createElement('article');
            card.className = 'card';
            card.tabIndex = 0; // keyboard focus
            card.innerHTML = `
                <div class="card-media">
                    <img loading="lazy" src="${item.image}" alt="${item.name}">
                </div>
                <div class="card-content">
                    <h4 class="card-title">${item.name}</h4>
                </div>
                <div class="card-overlay">
                    <p class="card-desc">${item.desc}</p>
                </div>
            `;
            const goDetail = async () => {
                try {
                    const params = new URLSearchParams({ name: item.name });
                    const res = await fetch(`/detail?${params.toString()}`);
                    const data = await res.json();
                    window.location.href = `/detail_page?name=${encodeURIComponent(data.name)}`;
                } catch (err) {
                    console.error('Detail request failed', err);
                }
            };
            card.addEventListener('click', goDetail);
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goDetail();
                }
            });
            gallery.appendChild(card);
        });
    } catch (err) {
        console.error('Failed to load gallery', err);
    }
}

// Load gallery on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGallery);
} else {
    loadGallery();
}

animate();

// Resize
window.addEventListener('resize', () => {
    camera.aspect = 1;
    camera.updateProjectionMatrix();
});

let currentRotationSpeed = 0.005;

// Scroll-driven via keyframed path
const landingSection = document.querySelector('.landing-page');
const headerEl = document.querySelector('.header');
const rightSectionEl = document.querySelector('.right');

function getLandingHeight() {
    return landingSection ? landingSection.offsetHeight : window.innerHeight;
}

function getFinalOffsets() {
    // Dock behind the right section if present
    const gap = 12;
    if (rightSectionEl) {
        const r = rightSectionEl.getBoundingClientRect();
        // position near the upper-left quadrant of the right card
        const x = Math.max(0, Math.floor(r.left + gap));
        const y = Math.max(0, Math.floor(r.top + gap - 50));
        return { x, y };
    }  
    // Fallback to header alignment
    const h1 = headerEl ? headerEl.querySelector('h1') : null;
    if (h1) {
        const rect = h1.getBoundingClientRect();
        const x = Math.max(0, Math.floor(rect.right + gap));
        const y = 0;
        return { x, y };
    }
    const cs = headerEl ? getComputedStyle(headerEl) : null;
    const padLeft = cs ? parseInt(cs.paddingLeft || '0', 10) : 0;
    return { x: padLeft, y: 0 };
}

function lerp(a, b, t) { return a + (b - a) * t; }

function cubicBezier(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return u*u*u*p0 + 3*u*u*t*p1 + 3*u*t*t*p2 + t*t*t*p3;
}

function sampleSCurve(t) {
    const w = window.innerWidth;
    const h = window.innerHeight;
    // Start at center (0,0) relative to container origin
    const startX = 0;
    const startY = 0;
    // End near right panel area; exact docking handled after landing
    const endX = 0.38 * w;
    const endY = -0.04 * h;
    // Two control points to create a smoother S-curve
    const c1x = 0.14 * w, c1y = -0.16 * h;
    const c2x = 0.26 * w, c2y = 0.08 * h;

    // Ease-in-out for smoother speed along the curve
    const te = 0.5 - 0.5 * Math.cos(Math.PI * t);

    const tx = cubicBezier(startX, c1x, c2x, endX, te);
    const ty = cubicBezier(startY, c1y, c2y, endY, te);
    return { tx, ty };
}

function applyPathAt(progress) {
    const clamped = Math.max(0, Math.min(progress, 1));
    const k = sampleSCurve(clamped);

    // Keep constant scale; no shrinking
    if (object) modelGroup.scale.setScalar(1);

    if (clamped < 1) {
        const container = document.getElementById('container3d');
        container.style.transform = `translate(${Math.round(k.tx)}px, ${Math.round(k.ty)}px)`;
    }
}

function onScroll() {
    const landingHeight = getLandingHeight() - 400;
    const scrollY = window.scrollY;

    if (scrollY < landingHeight) {
        const progress = scrollY / landingHeight;
        applyPathAt(progress);

        const container = document.getElementById('container3d');
        container.style.position = 'absolute';
        container.style.top = '0';
        container.style.left = '0';
    } else {
        // Beyond landing: track behind the right section
        const container = document.getElementById('container3d');
        const { x, y } = getFinalOffsets();
        applyPathAt(1);
        container.style.position = 'fixed';
        container.style.top = '0';
        container.style.left = '0';
        container.style.transform = `translate(${x}px, ${y}px)`;
    }
}

window.addEventListener('scroll', onScroll);
window.addEventListener('resize', () => {
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    onScroll();
});

onScroll();

// Fit camera to object
function fitCameraToObject(camera, object3D, offset = 1.25) {
    const boundingBox = new THREE.Box3().setFromObject(object3D);
    const center = new THREE.Vector3();
    const size = new THREE.Vector3();
    boundingBox.getCenter(center);
    boundingBox.getSize(size);

    const maxSize = Math.max(size.x, size.y, size.z);
    const fov = camera.fov * (Math.PI / 180);
    let cameraZ = Math.abs(maxSize / (2 * Math.tan(fov / 2)));
    cameraZ *= offset;

    camera.position.set(center.x, center.y, cameraZ);
    camera.near = cameraZ / 100;
    camera.far = cameraZ * 100;
    camera.updateProjectionMatrix();

    camera.lookAt(center);
}

// ---- Search UX ----
const searchInput = document.getElementById('partSearch');
const suggestionsEl = document.getElementById('suggestions');
const thresholdInput = document.getElementById('threshold');
const thresholdValueEl = document.getElementById('thresholdValue');
const doSearchBtn = document.getElementById('doSearch');
const secondPageEl = document.getElementById('secondPage');

function debounce(fn, delay) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(null, args), delay);
    };
}

function renderSuggestions(items) {
    if (!suggestionsEl) return;
    if (!items || items.length === 0) {
        suggestionsEl.innerHTML = '';
        suggestionsEl.classList.remove('visible');
        return;
    }
    suggestionsEl.innerHTML = items.map((name) => `<button type="button" data-name="${name}">${name}</button>`).join('');
    suggestionsEl.classList.add('visible');
    Array.from(suggestionsEl.querySelectorAll('button')).forEach((btn) => {
        btn.addEventListener('click', () => {
            const n = btn.getAttribute('data-name');
            if (searchInput) searchInput.value = n || '';
            suggestionsEl.classList.remove('visible');
        });
    });
}

const fetchSuggestions = debounce(async (q) => {
    try {
        const resp = await fetch(`/api/parts_suggest?q=${encodeURIComponent(q)}`);
        const data = await resp.json();
        renderSuggestions(data.items || []);
    } catch (e) {
        console.error('suggestions failed', e);
    }
}, 200);

function updateSliderFill() {
    if (!thresholdInput) return;
    const v = Math.max(0, Math.min(1, Number(thresholdInput.value)));
    const pct = Math.round(v * 100);
    const green = '#2ecc71';
    const rest = 'linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.06))';
    thresholdInput.style.background = `linear-gradient(90deg, ${green} 0% ${pct}%, rgba(255,255,255,0.12) ${pct}%)`;
}

if (thresholdInput && thresholdValueEl) {
    thresholdInput.addEventListener('input', () => {
        thresholdValueEl.textContent = Number(thresholdInput.value).toFixed(2);
        updateSliderFill();
    });
    // initialize on load
    updateSliderFill();
}

if (searchInput) {
    searchInput.addEventListener('input', (e) => {
        const val = e.target.value || '';
        if (val.trim().length >= 3) {
            fetchSuggestions(val.trim());
        } else if (suggestionsEl) {
            suggestionsEl.classList.remove('visible');
            suggestionsEl.innerHTML = '';
        }
    });
    searchInput.addEventListener('blur', () => {
        setTimeout(() => suggestionsEl && suggestionsEl.classList.remove('visible'), 150);
    });
}

function goToSearch() {
    const name = (searchInput && searchInput.value) ? searchInput.value.trim() : '';
    const thr = (thresholdInput && thresholdInput.value) ? thresholdInput.value : '0.5';
    const params = new URLSearchParams({ name, threshold: thr });
    window.location.href = `/search_result?${params.toString()}`;
}

if (doSearchBtn) {
    doSearchBtn.addEventListener('click', goToSearch);
}

// Focus search when second page comes into view
if (secondPageEl && searchInput) {
    const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                try {
                    searchInput.focus({ preventScroll: true });
                    searchInput.select();
                } catch (_) {
                    searchInput.focus();
                }
            }
        });
    }, { root: null, threshold: 0.55 });
    io.observe(secondPageEl);
}


function startTypingAnimation() {
    const element = document.querySelector('h3.typewriter');
    if (!element) return;
  
    const text = element.textContent;
    element.textContent = '';
    let i = 0;
  
    function type() {
      if (i < text.length) {
        element.textContent += text.charAt(i);
        i++;
        setTimeout(type, 100); // typing delay
      }
    }
    type();
  }
  

  const loaderWrapper = document.getElementById('loader-wrapper');

// Function to trigger loader hide after animation completes current cycle
function hideLoaderAfterIteration() {
    // Remove infinite looping by setting animation-iteration-count to 1
    loaderWrapper.style.animationIterationCount = '1';

    // Listen for animationend on one of the letters or the loader itself
    loaderWrapper.addEventListener('animationend', function handler() {
        loaderWrapper.style.display = 'none';
        loaderWrapper.removeEventListener('animationend', handler);
    });
}