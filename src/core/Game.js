import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CubeManager } from './CubeManager.js';
import { InputManager } from './InputManager.js';

import { TutorialManager } from './TutorialManager.js';

export class Game {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        
        // Game State
        this.isPlaying = false;
        this.moveHistory = [];
        this.moves = 0;
        this.startTime = 0;
        this.elapsedTime = 0;
        this.size = 3;

        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x222222);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            45, 
            window.innerWidth / window.innerHeight, 
            0.1, 
            100
        );
        this.camera.position.set(6, 5, 8);
        this.camera.lookAt(0, 0, 0);

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.container.appendChild(this.renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(10, 20, 10);
        this.scene.add(directionalLight);

        // Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.enablePan = false;
        this.controls.minDistance = 3;
        this.controls.maxDistance = 20;

        // Resize handler
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // Start loop
        this.clock = new THREE.Clock();
        this.animate = this.animate.bind(this);
        
        // Cube & Input Managers will be initialized in init() or explicitly here
        // Note: constructor runs before UIManager is ready if we do it in main.
        
        this.tutorialManager = new TutorialManager(this);

        this.animate();
    }
    
    init(uiManager) {
        this.uiManager = uiManager;
        // Default start? No, wait for user.
        // Show demo cube
        this.startGame(3);
        this.isPlaying = true; // START PLAYING IMMEDIATELY
        this.controls.autoRotate = false;
    }

    startGame(size) {
        this.size = size;
        if (this.cubeManager) {
            this.scene.remove(this.cubeManager.group);
            this.scene.remove(this.cubeManager.pivot);
        }
        
        this.cubeManager = new CubeManager(size, this);
        this.inputManager = new InputManager(this); // Re-bind or just keep one
        
        this.resetGameLogic();
        this.controls.autoRotate = false;
        
        // Camera adjustments based on size
        const dist = size * 2.5 + 2;
        this.camera.position.set(dist, dist * 0.8, dist);
        this.camera.lookAt(0,0,0);
        this.controls.reset();
    }

    resetGameLogic() {
        this.moveHistory = [];
        this.moves = 0;
        this.elapsedTime = 0;
        this.startTime = Date.now();
        this.isPlaying = true;
        this.isSolved = false;
        this.isSolving = false;
        
        if (this.uiManager) {
            this.uiManager.updateMoves(0);
            this.uiManager.updateTimer(0);
        }
    }
    
    scramble() {
        if (!this.cubeManager) return;
        
        // Fix: Reset the cube to solved state physically before applying scramble.
        // Otherwise, scrambling on top of a messed cube + clearing history = unsolveable by reverse.
        this.startGame(this.size); 
        
        // Now apply scramble to the clean cube
        const scrambleMoves = this.cubeManager.scramble(20 * this.size); 
        
        this.resetGameLogic();
        
        // Populate history so we can solve it back
        // We push them in order. solve() pops from the end which is the last move made.
        // This is correct: to solve, we undo the last move first.
        this.moveHistory = scrambleMoves; 
        
        // Since we just resetGameLogic which clears history, checking consistency:
        // resetGameLogic clears history. We set it to scrambleMoves. Correct.
        // Also ensure UI is updated if needed (moves count)
        // scrambleMoves length is usually 20*size.
        // Moves count should ideally reflect the scramble complexity? 
        // Or 0? Usually 0 for a new game.
        // But if solve() relies on it...
        
        // Actually, resetGameLogic expects us to start fresh.
        // Do we want 'Moves' to show 0? Yes.
        // But history has 60 items.
        // registerMove increments count.
        // We set history manually.
    }
    
    reset() {
        this.startGame(this.size);
    }
    
    undo() {
        if (this.moveHistory.length === 0 || !this.isPlaying) return;
        
        const lastMove = this.moveHistory.pop();
        this.cubeManager.triggerRotation(lastMove.axis, lastMove.index, -lastMove.direction, true); // true = isSolving/scrambling (don't register)
        
        this.moves--;
        if (this.uiManager) this.uiManager.updateMoves(this.moves);
    }
    
    solve() {
        if (this.moveHistory.length === 0) return;
        if (this.isSolving) return; // Already solving
        
        this.isPlaying = false; // Stop timer/manual input
        this.isSolving = true;
        
        this.executeNextSolveMove();
    }
    
    executeNextSolveMove() {
        if (this.moveHistory.length === 0) {
            this.isSolving = false;
            
            // Critical check: Are we actually solved?
            if (this.cubeManager && this.cubeManager.checkWin()) {
                this.isSolved = true;
                if(this.uiManager) {
                     this.uiManager.showWin();
                     // Keep stats visible! User wanted them counted.
                     // But maybe we stop counting now.
                }
                console.log("Solve Successful: Cube is verified solved.");
            } else {
                console.error("Solve Failed: History empty but cube NOT solved. Sync error.");
            }
            return; 
        }
        
        const lastMove = this.moveHistory.pop();
        
        // Count this as a move!
        this.moves++;
        if (this.uiManager) this.uiManager.updateMoves(this.moves);
        
        // Trigger move. The 'true' flag prevents registering this move back to history.
        this.cubeManager.triggerRotation(lastMove.axis, lastMove.index, -lastMove.direction, true);
    }

    onRotationComplete() {
        // Called by CubeManager when rotation finishes
        if (this.isSolving) {
            // Slight delay for visual pacing
            setTimeout(() => this.executeNextSolveMove(), 10);
            return;
        }

        if (this.isPlaying) {
             const win = this.cubeManager.checkWin();
             if (win) {
                 this.isPlaying = false;
                 this.isSolved = true;
                 if(this.uiManager) this.uiManager.showWin();
             }
        }
    }

    registerMove(axis, index, direction) {
        if (!this.isPlaying) return;
        this.moves++;
        this.moveHistory.push({ axis, index, direction });
        if (this.uiManager) this.uiManager.updateMoves(this.moves);

        // Tutorial Check
        if (this.tutorialManager && this.tutorialManager.active) {
            this.tutorialManager.checkMove({ axis, index, direction });
        }
    }

    animate() {
        requestAnimationFrame(this.animate);
        
        const delta = this.clock.getDelta();

        if (this.controls) {
            this.controls.update();
        }
        
        if (this.cubeManager) {
            this.cubeManager.update(delta);
        }

        // Update Timer if Playing OR Solving
        if (this.isPlaying || this.isSolving) {
            this.elapsedTime += delta;
            if (this.uiManager) this.uiManager.updateTimer(this.elapsedTime);
        }

        this.renderer.render(this.scene, this.camera);
    }
    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}
