
export class TutorialManager {
    constructor(game) {
        this.game = game;
        this.active = false;
        this.currentStep = 0;
        this.currentScenario = null;
        
        // Define Scenarios
        this.scenarios = {
            'sexy-move': {
                name: "The 'Sexy Move' (R U R' U')",
                description: "A fundamental sequence used in many algorithms.",
                setup: [], // Start from solved or any state
                steps: [
                    { text: "Rotate the Right Face CLOCKWISE (Up)", move: { axis: 'x', index: 1, direction: -1 } }, // R (Right Up is -1 in our logic? Need to verify axis/dir)
                    // Wait, let's verify direction. 
                    // In Game.js/CubeManager.js, let's check standard notation mapping.
                    // Usually: R is x-axis, index max.
                    // If we look at right face (positive x), clockwise is... 
                    // Let's rely on standard debug logs if needed, but standard is:
                    // R: x-axis rotation.
                    { text: "Rotate the Up Face CLOCKWISE (Left)", move: { axis: 'y', index: 1, direction: -1 } }, // U
                    { text: "Rotate the Right Face COUNTER-CLOCKWISE (Down)", move: { axis: 'x', index: 1, direction: 1 } }, // R'
                    { text: "Rotate the Up Face COUNTER-CLOCKWISE (Right)", move: { axis: 'y', index: 1, direction: 1 } } // U'
                ]
            }
        };

        // We need to resolve the exact notation to our internal axis/direction.
        // Internal: 
        // 3x3: Indices are -1, 0, 1.
        // R (Right face) -> x = 1.
        // U (Up face) -> y = 1.
        // F (Front face) -> z = 1.
        // L (Left face) -> x = -1.
        // D (Down face) -> y = -1.
        // B (Back face) -> z = -1.
        
        // Direction? 
        // In three.js, positive rotation is counter-clockwise about the axis vector.
        // Axis X+ points Right. Rotation + is counter-clockwise looking from Right. 
        // So R (clockwise) = -1. R' (counter-clockwise) = 1.
        // Axis Y+ points Up. Rotation + is CCW looking from Top.
        // So U (clockwise) = -1. U' = 1.
        // Axis Z+ points Front. Rotation + is CCW looking from Front.
        // So F (clockwise) = -1. F' = 1.
        
        // Let's Refine Scenario with correct indices
        // Size 3: indices -1, 0, 1. 
        // We need to handle dynamic size? Tutorial usually implies 3x3.
    }

    startScenario(toolName) {
        console.log("TutorialManager: startScenario called with", toolName);
        if (!this.scenarios[toolName]) {
            console.error("TutorialManager: Scenario not found:", toolName);
            return;
        }
        
        console.log("Starting Scenario:", toolName);
        this.active = true;
        this.currentScenario = this.scenarios[toolName];
        this.currentStep = 0;
        
        // Reset Cube First
        console.log("TutorialManager: Resetting game...");
        this.game.reset();
        
        // Update UI
        if(this.game.uiManager) {
            console.log("TutorialManager: Showing HUD...");
            this.game.uiManager.showTutorialHUD(true);
            this.updateHUD();
        } else {
            console.error("TutorialManager: uiManager missing!");
        }
    }

    stopTutorial() {
        this.active = false;
        this.currentScenario = null;
        if(this.game.uiManager) {
            this.game.uiManager.showTutorialHUD(false);
        }
    }

    checkMove(move) {
        if (!this.active || !this.currentScenario) return;

        const expected = this.currentScenario.steps[this.currentStep].move;
        
        // move contains { axis, index, direction }
        // Verify match
        // Note: Floating point index match? stored as integer usually locally
        // But our Tutorial Def uses 1 or -1 for 3x3.
        // Let's assume 3x3 for now.
        
        const isAxisMatch = move.axis === expected.axis;
        const isIndexMatch = Math.abs(move.index - expected.index) < 0.1; 
        const isDirMatch = move.direction === expected.direction;

        if (isAxisMatch && isIndexMatch && isDirMatch) {
            console.log("Correct Move!");
            this.currentStep++;
            
            if (this.currentStep >= this.currentScenario.steps.length) {
                // Completed
                this.game.uiManager.updateTutorialInstruction("Tutorial Complete! Great job.");
                setTimeout(() => this.stopTutorial(), 3000);
            } else {
                this.updateHUD();
            }
            return true; // Correct
        } else {
            console.log("Wrong Move!");
            this.game.uiManager.updateTutorialInstruction("Oops! Try again. " + this.currentScenario.steps[this.currentStep].text, true);
            // We should ideally UNDO the user's wrong move or block it?
            // "Game" registers the move effectively.
            // If we return, maybe Game can undo it? 
            // Or we just let them fix it (by undoing manually)
            // Simpler: Allow it, but tell them to undo.
            // Even simpler for MVP: Game asks logic "isValidMove" before animating? 
            // Or just Auto-Undo.
            
            // Let's simply Auto-Undo for immediate feedback
            setTimeout(() => {
                this.game.inputManager.isAnimating = false; // Force allow
                this.game.cubeManager.triggerRotation(move.axis, move.index, -move.direction, true); // Reverse
            }, 500);
            
            return false;
        }
    }

    startGuidedSolve(difficulty = 10) {
        console.log("TutorialManager: Starting Guided Solve with moves:", difficulty);
        
        // 1. Generate Scramble
        // We use game.cubeManager to get valid moves, but we want to apply them too.
        // Let's manually generate moves to ensure we have the exact data.
        const moves = [];
        const size = this.game.size;
        const indices = []; // For 3x3: -1, 0, 1. But we only rotate faces usually (-1, 1).
        // Let's assume standard face rotations for tutorial (index -1 or 1 for 3x3).
        
        // Valid indices for faces
        const maxIndex = Math.floor(size / 2);
        // We only want outer faces for simplicity? Or all? Standard scramble uses all.
        // Let's stick to outer faces for 3x3 tutorial simplicity (R, L, U, D, F, B).
        const validIndices = [-maxIndex, maxIndex]; 
        
        for (let i = 0; i < difficulty; i++) {
            const axisIdx = Math.floor(Math.random() * 3);
            const axis = ['x', 'y', 'z'][axisIdx];
            const index = validIndices[Math.floor(Math.random() * validIndices.length)];
            const direction = Math.random() > 0.5 ? 1 : -1;
            
            moves.push({ axis, index, direction });
        }
        
        // 2. Apply Scramble (Fast/Instant)
        // We can just call triggerRotation fast.
        // Or manipulate state directly? triggerRotation is safer for sync.
        console.log("Applying Scramble...");
        moves.forEach(m => {
             this.game.cubeManager.triggerRotation(m.axis, m.index, m.direction, true); // true = isSolving (no history, no anim delay ideally)
        });
        // Note: multiple triggers at once might cause animation overlap issues if not handled.
        // CubeManager.triggerRotation handles flags.
        // For instant scramble, we might want a dedicated method, but let's rely on the game's loop.
        // WE MUST WAIT for scramble to finish before starting tutorial? 
        // Actually, if we pass isSolving=true, it might be fast?
        // Let's assume clear slate for now.

        // 3. Generate Solution (Reverse)
        const solutionSteps = [];
        for (let i = moves.length - 1; i >= 0; i--) {
            const m = moves[i];
            const reverseDir = -m.direction;
            solutionSteps.push({
                text: this.generateMoveText(m.axis, m.index, reverseDir),
                move: { axis: m.axis, index: m.index, direction: reverseDir }
            });
        }
        
        this.active = true;
        this.currentScenario = {
            name: "Guided Solve",
            setup: moves,
            steps: solutionSteps
        };
        this.currentStep = 0;
        
        // Update UI
        if(this.game.uiManager) {
            this.game.uiManager.showTutorialHUD(true);
            this.updateHUD();
        }
    }

    generateMoveText(axis, index, direction) {
        // Map to R, L, U, D, F, B
        // 3x3: Index 1 is R/U/F. Index -1 is L/D/B.
        // Axis X: 1=Right, -1=Left
        // Axis Y: 1=Up, -1=Down
        // Axis Z: 1=Front, -1=Back
        
        let face = "";
        if (axis === 'x') face = index > 0 ? "Right (Red)" : "Left (Orange)";
        if (axis === 'y') face = index > 0 ? "Up (White)" : "Down (Yellow)";
        if (axis === 'z') face = index > 0 ? "Front (Green)" : "Back (Blue)";
        
        // Direction
        // +1 is Counter-Clockwise (usually)
        // -1 is Clockwise
        const dirText = direction === -1 ? "Clockwise" : "Counter-Clockwise";
        
        return `Rotate ${face} Face ${dirText}`;
    }

    updateHUD() {
         const step = this.currentScenario.steps[this.currentStep];
         const progress = `(${this.currentStep + 1}/${this.currentScenario.steps.length})`;
         this.game.uiManager.updateTutorialInstruction(`${step.text} ${progress}`);
    }
}
