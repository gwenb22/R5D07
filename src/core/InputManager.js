import * as THREE from 'three';

export class InputManager {
    constructor(game) {
        this.game = game;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.isDragging = false;
        this.startPoint = null;
        this.intersectedFaceNormal = null;
        this.intersectedObject = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.game.renderer.domElement;
        
        // Use Capture Phase (true) to ensure we handle the event BEFORE OrbitControls
        // This prevents the camera from moving even if we disable it, because OrbitControls
        // would otherwise run first (being added first) and start its state.
        canvas.addEventListener('pointerdown', this.onPointerDown.bind(this), true);
        canvas.addEventListener('pointermove', this.onPointerMove.bind(this));
        canvas.addEventListener('pointerup', this.onPointerUp.bind(this));
        canvas.addEventListener('pointerleave', this.onPointerUp.bind(this));
    }

    getIntersects(event) {
        const rect = this.game.renderer.domElement.getBoundingClientRect();
        
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.game.camera);

        // Intersect with all cubelets
        return this.raycaster.intersectObjects(this.game.cubeManager.group.children);
    }

    onPointerDown(event) {
        if (!event.isPrimary) return;

        const intersects = this.getIntersects(event);

        if (intersects.length > 0) {
            // We hit a cubelet
            this.game.controls.enabled = false; // Disable orbit controls
            this.isDragging = true;
            this.intersectedObject = intersects[0].object;
            this.intersectedFaceNormal = intersects[0].face.normal.clone();
            
            // Transform normal to world space (rotation of cubelet matters)
            this.intersectedFaceNormal.transformDirection(this.intersectedObject.matrixWorld).round();
            
            this.startMouse = { x: this.mouse.x, y: this.mouse.y };
            
            // Important: prevent OrbitControls from potentially catching this if they use pointerdown too
            // event.stopPropagation(); // Try valid pointer capture instead if needed, but stopPropagation might be enough
        }
    }

    onPointerMove(event) {
        if (!this.isDragging) return;

        if (!event.isPrimary) return;

        const rect = this.game.renderer.domElement.getBoundingClientRect();
        const currentMouse = {
             x: ((event.clientX - rect.left) / rect.width) * 2 - 1,
             y: -((event.clientY - rect.top) / rect.height) * 2 + 1
        };

        const deltaX = currentMouse.x - this.startMouse.x;
        const deltaY = currentMouse.y - this.startMouse.y;
        
        // Min drag distance
        if (Math.abs(deltaX) < 0.05 && Math.abs(deltaY) < 0.05) return;

        // Determine Direction
        this.handleMove(deltaX, deltaY);
        
        // Reset state but KEEP CONTROLS DISABLED until release
        this.isDragging = false;
        // this.game.controls.enabled = true; // REMOVED: This was causing the camera to snap back or rotate mid-gesture
    }

    onPointerUp(event) {
        this.isDragging = false;
        this.game.controls.enabled = true; // Re-enable controls ONLY here
    }

    handleMove(dx, dy) {
        if (!this.intersectedObject || !this.intersectedFaceNormal) return;

        const normal = this.intersectedFaceNormal;
        
        // Logical Axes
        const axes = [
            new THREE.Vector3(1, 0, 0),
            new THREE.Vector3(0, 1, 0),
            new THREE.Vector3(0, 0, 1)
        ];

        // Filter out the axis parallel to the normal (we can't drag along the normal)
        const possibleDragAxes = axes.filter(a => Math.abs(a.dot(normal)) < 0.1);

        let bestDragAxis = null;
        let maxDot = -1;
        let visualDragDirection = 1; // 1 or -1 based on screen drag

        const dragVector = new THREE.Vector2(dx, dy).normalize();

        // Determine which logical axis matches the screen drag best
        possibleDragAxes.forEach(objAxis => {
            // Project axis to screen space to see how it looks
            const p1 = this.intersectedObject.position.clone();
            const p2 = this.intersectedObject.position.clone().add(objAxis);
            
            p1.project(this.game.camera);
            p2.project(this.game.camera);

            const screenAxis = new THREE.Vector2(p2.x - p1.x, p2.y - p1.y).normalize();
            
            const dot = Math.abs(screenAxis.dot(dragVector));
            
            if (dot > maxDot) {
                maxDot = dot;
                bestDragAxis = objAxis; 
                visualDragDirection = Math.sign(screenAxis.dot(dragVector));
            }
        });

        if (bestDragAxis) {
             // Rotation Axis is Cross Product of Normal and Drag Axis
             const rotationAxisVec = new THREE.Vector3().crossVectors(bestDragAxis, normal);
             // Normalize just in case, though they are orthogonal unit vectors so it should be length 1
             rotationAxisVec.normalize();
             
             // Invert direction?
             // The direction of rotation requires right-hand rule.
             // We need to correlate visual drag direction with rotation direction.
             // This is tricky. Let's start with a simplified assumption and fix if inverted.
             // Usually: visualDrag * (some factor from cross product)
             // Let's pass the raw vectors to CubeManager? No, keep logic here or clean api.
             
             // Get axis name
             const absX = Math.abs(rotationAxisVec.x);
             const absY = Math.abs(rotationAxisVec.y);
             const absZ = Math.abs(rotationAxisVec.z);
             
             let axisName = 'y';
             if (absX > 0.9) axisName = 'x';
             if (absZ > 0.9) axisName = 'z';

             // Determine Slice Index
             const pos = this.intersectedObject.userData; // {x, y, z}
             // Be careful: userData coordinates might need to be rounded if we rely on floating point, 
             // but we set them as integers (relative to offset). 
             // We stored rounded values in userData? No, we stored adjusted values.
             // Let's assume userData is kept up to date.
             
             const sliceIndex = axisName === 'x' ? pos.x : (axisName === 'y' ? pos.y : pos.z);
             
             // Determine Direction (+1 or -1)
             // This depends on the specific cross product + visual direction
             // Heuristic:
             // If we drag +X on Front (+Z), rot axis is +Y.
             // Drag +X means screen Right. Front face moves Right. 
             // Rotating Front Face Right around Y axis is -Y rotation? (Clockwise from top)
             // Let's trial and error this or use consistent math.
             
             // Simplification: Pass both determined axis and the raw drag strength/direction
             // For now, pass a direction, verify visually.
             
             this.game.cubeManager.triggerRotation(axisName, sliceIndex, visualDragDirection);
        }
    }
}
