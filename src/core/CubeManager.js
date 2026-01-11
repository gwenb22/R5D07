import * as THREE from 'three';

export class CubeManager {
    constructor(size = 3, game) {
        this.size = size;
        this.game = game;
        this.scene = game.scene;
        this.cubelets = [];
        this.pivot = new THREE.Object3D(); // For rotating groups
        this.scene.add(this.pivot);
        
        // Group to hold the entire cube
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // Standard Colors (R, L, U, D, F, B)
        // Right: Red, Left: Orange, Up: White, Down: Yellow, Front: Green, Back: Blue
        this.colors = {
            R: 0xB90000, 
            L: 0xFF5900, 
            U: 0xFFFFFF, 
            D: 0xFFD500, 
            F: 0x009E60, 
            B: 0x0045AD,
            Core: 0x282828 // Internal black plastic
        };

        this.generateCube();
    }

    generateCube() {
        // Clear existing
        while(this.group.children.length > 0){ 
            this.group.remove(this.group.children[0]); 
        }
        this.cubelets = [];

        const offset = (this.size - 1) / 2;
        const geometry = new THREE.BoxGeometry(0.95, 0.95, 0.95); 
        // 0.95 to leave a small gap between cubelets for realism

        for(let x = 0; x < this.size; x++) {
            for(let y = 0; y < this.size; y++) {
                for(let z = 0; z < this.size; z++) {
                    
                    // Arrays of materials for each face: +x, -x, +y, -y, +z, -z
                    // By default, all faces are black (internal)
                    const materials = Array(6).fill(new THREE.MeshStandardMaterial({ 
                        color: this.colors.Core,
                        roughness: 0.6,
                        metalness: 0.1
                    }));

                    // Coloring external faces
                    // Right (+x)
                    if (x === this.size - 1) materials[0] = this.createSticker(this.colors.R);
                    // Left (-x)
                    if (x === 0) materials[1] = this.createSticker(this.colors.L);
                    // Up (+y)
                    if (y === this.size - 1) materials[2] = this.createSticker(this.colors.U);
                    // Down (-y)
                    if (y === 0) materials[3] = this.createSticker(this.colors.D);
                    // Front (+z)
                    if (z === this.size - 1) materials[4] = this.createSticker(this.colors.F);
                    // Back (-z)
                    if (z === 0) materials[5] = this.createSticker(this.colors.B);

                    const mesh = new THREE.Mesh(geometry, materials);
                    
                    // Position
                    mesh.position.set(x - offset, y - offset, z - offset);
                    
                    // Store logical coordinates
                    mesh.userData = { 
                        x: x - offset, 
                        y: y - offset, 
                        z: z - offset,
                        isCubelet: true
                    };

                    this.group.add(mesh);
                    this.cubelets.push(mesh);
                }
            }
        }
    }

    createSticker(color) {
        return new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.2,
            metalness: 0.0,
            polygonOffset: true,
            polygonOffsetFactor: -1, // Helps with z-fighting if we had separate sticker meshes, but here we just use materials
        });
    }

        // Helper to see if valid coordinates
    isValid(x, y, z) {
        // Implement logical check if needed
    }

    triggerRotation(axis, index, direction, isSolving = false) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        // Register move if not solving and not scrambling (we can flag scrambling simply or just not register)
        // If isSolving is true, we don't register move.
        // What about Scrambling? createSticker uses internal?
        // Let's assume input triggered rotation calls this without isSolving.
        if (!isSolving) {
            this.game.registerMove(axis, index, direction);
        }

        this.currentRotation = {
            axis: axis,
            index: index,
            direction: direction, // 1 or -1
            currentAngle: 0,
            targetAngle: (Math.PI / 2) * direction,
            speed: isSolving ? 25.0 : 5.0 // Much faster if solving
        };

        // 1. Identification: Find all cubelets in this slice
        this.activeSlice = this.cubelets.filter(c => Math.abs(c.userData[axis] - index) < 0.1);

        // 2. Grouping: Attach them to the pivot
        this.pivot.rotation.set(0,0,0);
        this.pivot.position.set(0,0,0);
        
        // We need to attach cubelets to pivot without moving them visually
        // Standard Three.js attach implementation pattern
        this.activeSlice.forEach(cube => {
            this.pivot.attach(cube);
        });
    }

    update(delta) {
        if (!this.isAnimating) return;

        const rot = this.currentRotation;
        const step = rot.speed * delta * Math.sign(rot.targetAngle);
        
        rot.currentAngle += step;

        // Check completion
        let finished = false;
        if ((rot.direction > 0 && rot.currentAngle >= rot.targetAngle) ||
            (rot.direction < 0 && rot.currentAngle <= rot.targetAngle)) {
            
            // Cap to exact target
            const overflow = rot.currentAngle - rot.targetAngle;
            this.pivot.rotation[rot.axis] += step - overflow; // Fill remainder
            finished = true;
        } else {
            this.pivot.rotation[rot.axis] += step;
        }

        if (finished) {
            this.isAnimating = false;
            this.finalizeRotation();
        }
    }

    finalizeRotation() {
        if (!this.activeSlice) return;

        this.pivot.updateMatrixWorld();
        
        // Detach everything back to the main group, creating new transforms
        this.activeSlice.forEach(cube => {
            this.group.attach(cube);
            
            // Important: We must update the logical coordinates (userData)
            // Round position to nearest integers (or halves)
            cube.position.x = Math.round(cube.position.x * 2) / 2;
            cube.position.y = Math.round(cube.position.y * 2) / 2;
            cube.position.z = Math.round(cube.position.z * 2) / 2;
            
            // Update internal state representation
            cube.userData.x = cube.position.x;
            cube.userData.y = cube.position.y;
            cube.userData.z = cube.position.z;
        });

        this.pivot.rotation.set(0,0,0);
        this.activeSlice = [];
        
        // Callback to game
        if (this.game.onRotationComplete) {
            this.game.onRotationComplete();
        }
    }
    
    scramble(moveCount = 20) {
        // Return the sequence of moves that were performed
        const movesValues = [];
        
        for(let i=0; i<moveCount; i++) {
            const axes = ['x', 'y', 'z'];
            const axis = axes[Math.floor(Math.random() * 3)];
            
            const limit = (this.size - 1) / 2;
            const randomCube = this.cubelets[Math.floor(Math.random() * this.cubelets.length)];
            const index = randomCube.userData[axis];
            
            const dir = Math.random() > 0.5 ? 1 : -1;
            
            this.executeRotationInstant(axis, index, dir);
            movesValues.push({ axis, index, direction: dir });
        }
        
        return movesValues;
    }

    executeRotationInstant(axis, index, dir) {
        // Group
        const slice = this.cubelets.filter(c => Math.abs(c.userData[axis] - index) < 0.1);
        
        this.pivot.rotation.set(0,0,0);
        this.pivot.position.set(0,0,0);
        
        slice.forEach(c => this.pivot.attach(c));
        
        // Rotate
        this.pivot.rotation[axis] += (Math.PI / 2) * dir;
        this.pivot.updateMatrixWorld();
        
        // Detach
        slice.forEach(c => {
            this.group.attach(c);
            c.position.x = Math.round(c.position.x * 2) / 2;
            c.position.y = Math.round(c.position.y * 2) / 2;
            c.position.z = Math.round(c.position.z * 2) / 2;
            
            c.rotation.x = Math.round(c.rotation.x / (Math.PI/2)) * (Math.PI/2);
            c.rotation.y = Math.round(c.rotation.y / (Math.PI/2)) * (Math.PI/2);
            c.rotation.z = Math.round(c.rotation.z / (Math.PI/2)) * (Math.PI/2);
            
            c.updateMatrix();

            c.userData.x = c.position.x;
            c.userData.y = c.position.y;
            c.userData.z = c.position.z;
        });

        this.pivot.rotation.set(0,0,0);
    }

    checkWin() {
        // Check all 6 faces of the overall cube
        const limit = (this.size - 1) / 2;
        const axes = [
            { axis: 'x', val: limit,  matIndex: 0 }, // Right (+x)
            { axis: 'x', val: -limit, matIndex: 1 }, // Left (-x)
            { axis: 'y', val: limit,  matIndex: 2 }, // Up (+y)
            { axis: 'y', val: -limit, matIndex: 3 }, // Down (-y)
            { axis: 'z', val: limit,  matIndex: 4 }, // Front (+z)
            { axis: 'z', val: -limit, matIndex: 5 }, // Back (-z)
        ];

        for (let face of axes) {
            // Get all cubelets on this face
            const faceCubelets = this.cubelets.filter(c => Math.abs(c.userData[face.axis] - face.val) < 0.1);
            
            // We need to check the color of the sticker pointing in the face direction.
            // Problem: Material index is static 0..5, but mesh is rotated.
            // We need to find which LOCAL face aligns with the WORLD face direction.
            
            // World Direction of the face
            const worldDir = new THREE.Vector3();
            worldDir[face.axis] = Math.sign(face.val); // +1 or -1
            
            // Check first cubelet's color on this face to establish the target
            let targetColorHex = null;

            for (let cube of faceCubelets) {
                 // For this cube, find which local face normal aligns with worldDir
                 // Cube rotation
                 const rotation = cube.quaternion;
                 
                 // Check all 6 local normals
                 // Locals: +x, -x, +y, -y, +z, -z
                 // Normals in local space
                 const normals = [
                     new THREE.Vector3(1,0,0), new THREE.Vector3(-1,0,0),
                     new THREE.Vector3(0,1,0), new THREE.Vector3(0,-1,0),
                     new THREE.Vector3(0,0,1), new THREE.Vector3(0,0,-1)
                 ];
                 
                 let foundMatIndex = -1;
                 
                 for(let i=0; i<6; i++) {
                     const localN = normals[i].clone();
                     localN.applyQuaternion(rotation); // Transform to world
                     if (localN.dot(worldDir) > 0.9) { // Pointing in same direction
                         foundMatIndex = i;
                         break;
                     }
                 }
                 
                 if (foundMatIndex === -1) return false; // Should not happen
                 
                 // Get color
                 const mat = cube.material[foundMatIndex]; 
                 // Note: we created unique materials for each sticker? 
                 // Actually in generateCube we reused materials or created new ones?
                 // "materials[0] = this.createSticker(this.colors.R);" -> Create new material instance
                 
                 const colorHex = mat.color.getHex();
                 
                 // Ignore "Core" color (black) - though face cubelets should have colored stickers
                 if (colorHex === this.colors.Core) return false; // Should have a sticker
                 
                 if (targetColorHex === null) {
                     targetColorHex = colorHex;
                 } else {
                     if (colorHex !== targetColorHex) return false; // Mismatch on this face
                 }
            }
        }
        
        return true;
    }
}
