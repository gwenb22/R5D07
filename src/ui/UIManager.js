
export class UIManager {
    constructor(game) {
        console.log("UIManager Initializing...");
        this.game = game;
        
        // Elements
        this.startBtn = document.getElementById('btn-start');
        this.scrambleBtn = document.getElementById('btn-scramble');
        this.undoBtn = document.getElementById('btn-undo');
        this.solveBtn = document.getElementById('btn-solve');
        this.resetBtn = document.getElementById('btn-reset');
        this.menuBtn = document.getElementById('btn-menu');
        this.helpBtn = document.getElementById('btn-help');
        
        this.startInteractiveBtn = document.getElementById('btn-start-interactive');
        this.quitTutorialBtn = document.getElementById('btn-quit-tutorial');
        this.tutorialHud = document.getElementById('tutorial-hud');
        this.hudInstruction = document.getElementById('hud-instruction');

        this.mainMenu = document.getElementById('main-menu');
        this.gameUI = document.getElementById('game-ui');
        this.winMessage = document.getElementById('win-message');
        this.tutorialOverlay = document.getElementById('tutorial-overlay');
        this.closeTutorialBtn = document.getElementById('btn-close-tutorial');
        
        this.timerEl = document.getElementById('timer');
        this.movesEl = document.getElementById('moves');
        
        this.diffBtns = document.querySelectorAll('.difficulty-btn');
        
        if (this.startBtn) {
            this.bindEvents();
            // SKIP MENU - START IMMEDIATELY
            this.showGameUI();
        } else {
            console.error("UIManager: Start Button not found!");
        }
    }

    showTutorialHUD(show) {
        if (!this.tutorialHud) return;
        if (show) {
            this.tutorialHud.classList.remove('hidden');
            this.hideTutorial(); // Close overlay when starting HUD
        } else {
            this.tutorialHud.classList.add('hidden');
        }
    }

    updateTutorialInstruction(text, isError = false) {
        if (!this.hudInstruction) return;
        this.hudInstruction.textContent = text;
        this.hudInstruction.style.color = isError ? '#ff3333' : 'white';
    }

    bindEvents() {
        this.startBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Start Clicked');
            const activeBtn = document.querySelector('.difficulty-btn.active');
            const size = activeBtn ? parseInt(activeBtn.dataset.size) : 3;
            this.game.startGame(size);
            this.showGameUI();
        });

        this.scrambleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Scramble Clicked');
            this.game.scramble();
        });
        
        this.undoBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Undo Clicked');
            this.game.undo();
        });
        
        this.solveBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log('Solve Clicked');
            this.game.solve();
        });
        
        this.resetBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.game.reset();
        });
        
        this.menuBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showMainMenu();
            if (this.game.controls) this.game.controls.autoRotate = true;
        });

        if (this.helpBtn) {
            this.helpBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showTutorial();
            });
        }

        if (this.closeTutorialBtn) {
            this.closeTutorialBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideTutorial();
            });
        }

        if (this.startInteractiveBtn) {
            this.startInteractiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                console.log("UIManager: Start Interactive Clicked");
                // Close menu/tutorial overlay
                this.hideTutorial();
                if (this.game.tutorialManager) {
                     console.log("UIManager: Calling tutorialManager.startGuidedSolve");
                     this.game.tutorialManager.startGuidedSolve(8); // Start with 8 moves for a quick but real test
                } else {
                     console.error("UIManager: game.tutorialManager is missing!");
                }
            });
        }

        if (this.quitTutorialBtn) {
            this.quitTutorialBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.game.tutorialManager.stopTutorial();
            });
        }

        this.diffBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.diffBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    showGameUI() {
        if(this.mainMenu) this.mainMenu.classList.add('hidden');
        if(this.gameUI) this.gameUI.classList.remove('hidden');
        if(this.winMessage) this.winMessage.classList.remove('visible');
    }

    showMainMenu() {
        if(this.mainMenu) this.mainMenu.classList.remove('hidden');
        if(this.winMessage) this.winMessage.classList.remove('visible');
    }

    showTutorial() {
        if(this.tutorialOverlay) {
            this.tutorialOverlay.classList.remove('hidden');
            // Init tabs
            if(!this.tabsInit) {
                const tabs = this.tutorialOverlay.querySelectorAll('.tab-btn');
                const contents = this.tutorialOverlay.querySelectorAll('.tab-content');
                
                tabs.forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Deactivate all
                        tabs.forEach(t => t.classList.remove('active'));
                        contents.forEach(c => c.classList.remove('active'));
                        
                        // Activate clicked
                        tab.classList.add('active');
                        const targetId = `tab-${tab.dataset.tab}`;
                        const targetContent = document.getElementById(targetId);
                        if(targetContent) targetContent.classList.add('active');
                    });
                });
                this.tabsInit = true;
            }
        }
    }

    hideTutorial() {
        if(this.tutorialOverlay) this.tutorialOverlay.classList.add('hidden');
    }

    showWin() {
        if(this.winMessage) {
            this.winMessage.classList.add('visible');
            setTimeout(() => {
                this.winMessage.classList.remove('visible');
            }, 3000); // Hide after 3 seconds
        }
    }

    updateTimer(time) {
        if (!this.timerEl) return;
        const m = Math.floor(time / 60).toString().padStart(2, '0');
        const s = (Math.floor(time) % 60).toString().padStart(2, '0');
        this.timerEl.textContent = `${m}:${s}`;
    }

    updateMoves(count) {
        if (!this.movesEl) return;
        this.movesEl.textContent = `Moves: ${count}`;
    }
}
