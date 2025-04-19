import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class Scene {
    constructor() {
        this.container = document.getElementById('canvas-container');
        this.width = this.container.clientWidth;
        this.height = this.container.clientHeight;
        
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        
        // Animation properties
        this.animations = [];
        this.clock = new THREE.Clock();
        this.lastUpdateTime = 0;
        
        // Scroll properties
        this.currentSection = 0;
        this.sections = document.querySelectorAll('.section');
        this.animatedDivs = document.querySelectorAll('.animated-div');
        this.lastScrollTop = 0;
        this.scrollDirection = 'down';
        
        // Cube properties
        this.cubes = [];
        this.originalPositions = [];
        
        // Particle system properties
        this.particles = null;
        this.particleCount = 2000;
        
        this.init();
        this.createObjects();
        this.createParticles();
        this.setupControls();
        this.setupScroll();
        this.animate();
        this.handleResize();
        
        // Start random animations
        this.startRandomAnimations();
    }

    init() {
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.container.appendChild(this.renderer.domElement);
        
        this.camera.position.set(0, 2, 5);
        this.camera.lookAt(0, 0, 0);
        
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(1, 1, 1);
        this.scene.add(directionalLight);
    }

    random(min, max) {
        return Math.random() * (max - min) + min;
    }

    createRandomAnimation(cube, originalPosition) {
        const duration = this.random(2000, 4000);
        const startTime = this.clock.getElapsedTime() * 1000;
        
        const targetPosition = {
            x: originalPosition.x + this.random(-2, 2),
            y: originalPosition.y + this.random(-2, 2),
            z: originalPosition.z + this.random(-2, 2)
        };
        
        const targetRotation = {
            x: this.random(-Math.PI, Math.PI),
            y: this.random(-Math.PI, Math.PI),
            z: this.random(-Math.PI, Math.PI)
        };

        const startPosition = cube.position.clone();
        const startRotation = {
            x: cube.rotation.x,
            y: cube.rotation.y,
            z: cube.rotation.z
        };

        return {
            cube,
            startTime,
            duration,
            startPosition,
            targetPosition,
            startRotation,
            targetRotation,
            originalPosition: originalPosition.clone(),
            update: (currentTime) => {
                const progress = Math.min((currentTime - startTime) / duration, 1);
                const easeProgress = this.easeInOutCubic(progress);

                // Position animation
                cube.position.x = this.lerp(startPosition.x, targetPosition.x, easeProgress);
                cube.position.y = this.lerp(startPosition.y, targetPosition.y, easeProgress);
                cube.position.z = this.lerp(startPosition.z, targetPosition.z, easeProgress);

                // Rotation animation
                cube.rotation.x = this.lerp(startRotation.x, targetRotation.x, easeProgress);
                cube.rotation.y = this.lerp(startRotation.y, targetRotation.y, easeProgress);
                cube.rotation.z = this.lerp(startRotation.z, targetRotation.z, easeProgress);

                // If animation is complete, create a new one
                if (progress >= 1) {
                    const newAnimation = this.createRandomAnimation(cube, originalPosition);
                    this.animations.push(newAnimation);
                    return false;
                }
                return true;
            }
        };
    }

    lerp(start, end, progress) {
        return start + (end - start) * progress;
    }

    easeInOutCubic(x) {
        return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
    }

    startRandomAnimations() {
        this.cubes.forEach((cube, index) => {
            const animation = this.createRandomAnimation(cube, this.originalPositions[index]);
            this.animations.push(animation);
        });
    }

    createObjects() {
        const colors = [0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 0xff00ff];
        const geometry = new THREE.BoxGeometry(1, 1, 1);

        colors.forEach((color, index) => {
            const material = new THREE.MeshPhongMaterial({ 
                color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 100
            });
            const cube = new THREE.Mesh(geometry, material);
            
            const angle = (index / colors.length) * Math.PI * 2;
            const radius = 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            cube.position.set(x, 0, z);
            this.originalPositions.push(new THREE.Vector3(x, 0, z));
            this.cubes.push(cube);
            this.scene.add(cube);
        });
    }

    createParticles() {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);
        const colors = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const radius = 5 + Math.random() * 5;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            
            positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = radius * Math.cos(phi);
            
            colors[i * 3] = Math.random();
            colors[i * 3 + 1] = Math.random();
            colors[i * 3 + 2] = Math.random();
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });

        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }

    setupControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enabled = false;
    }

    setupScroll() {
        let isScrolling = false;
        let scrollTimeout;

        window.addEventListener('scroll', () => {
            const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
            this.scrollDirection = scrollTop > this.lastScrollTop ? 'down' : 'up';
            this.lastScrollTop = scrollTop;

            if (!isScrolling) {
                isScrolling = true;
                this.handleScroll();
            }

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isScrolling = false;
            }, 100);
        });

        // Initial check for visible sections
        this.checkVisibleSections();
    }

    handleScroll() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition + windowHeight * 0.5 >= sectionTop && 
                scrollPosition <= sectionBottom) {
                this.currentSection = index;
                this.animateSection(index);
            }
        });
    }

    animateSection(index) {
        const section = this.sections[index];
        const animatedDiv = section.querySelector('.animated-div');
        
        if (animatedDiv) {
            // Always add active class to trigger animations
            animatedDiv.classList.add('active');
            
            // Trigger 3D cube animation for this section
            this.animateCubesForSection(index);
        }
    }

    animateCubesForSection(index) {
        // Clear existing animations
        this.animations = [];
        
        this.cubes.forEach((cube, cubeIndex) => {
            const delay = cubeIndex * 200;
            setTimeout(() => {
                const animation = this.createRandomAnimation(
                    cube,
                    this.originalPositions[cubeIndex]
                );
                this.animations.push(animation);
            }, delay);
        });
    }

    checkVisibleSections() {
        const scrollPosition = window.scrollY;
        const windowHeight = window.innerHeight;
        
        this.sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionBottom = sectionTop + section.offsetHeight;
            
            if (scrollPosition + windowHeight * 0.5 >= sectionTop && 
                scrollPosition <= sectionBottom) {
                this.animateSection(index);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const currentTime = this.clock.getElapsedTime() * 1000;
        
        // Update animations
        this.animations = this.animations.filter(animation => {
            const isActive = animation.update(currentTime);
            if (!isActive) {
                // Create new random animation when the current one completes
                const newAnimation = this.createRandomAnimation(
                    animation.cube,
                    animation.originalPosition
                );
                this.animations.push(newAnimation);
            }
            return isActive;
        });
        
        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += 0.001;
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i] += (Math.random() - 0.5) * 0.01;
                positions[i + 1] += (Math.random() - 0.5) * 0.01;
                positions[i + 2] += (Math.random() - 0.5) * 0.01;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        window.addEventListener('resize', () => {
            this.width = this.container.clientWidth;
            this.height = this.container.clientHeight;
            
            this.camera.aspect = this.width / this.height;
            this.camera.updateProjectionMatrix();
            
            this.renderer.setSize(this.width, this.height);
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new Scene();
}); 