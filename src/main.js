import './style.css'
import { Game } from './core/Game.js'; // Explicit extension
import { UIManager } from './ui/UIManager.js';

// Inject HTML
document.querySelector('#app').innerHTML = `
  <!-- Canvas Container -->
  <div id="game-container"></div>
  
  <!-- UI Layer that sits on top -->
  <div class="ui-overlay" id="game-ui">
      <div class="hud-top">
          <div id="timer">00:00</div>
          <div id="moves">Moves: 0</div>
      </div>
      
      <div class="win-overlay" id="win-message">SOLVED!</div>

      <div class="controls-bottom">
          <button id="btn-scramble">Scramble</button>
          <button id="btn-undo">Undo</button>
          <button id="btn-solve">Solve</button> 
          <button id="btn-reset">Reset</button>
          <button id="btn-menu">Menu</button>
          <button id="btn-help">Help</button>
      </div>
  </div>

  <div class="menu-overlay hidden" id="main-menu">
      <div class="menu-content">
          <div class="menu-title">RUBIK'S CUBE 3D</div>
          <h3>Select Difficulty</h3>
          <div class="difficulty-select">
              <button class="difficulty-btn" data-size="2">2x2</button>
              <button class="difficulty-btn active" data-size="3">3x3</button>
              <button class="difficulty-btn" data-size="4">4x4</button>
          </div>
          <button class="start-btn" id="btn-start">START GAME</button>
      </div>
  </div>

  <div class="tutorial-overlay hidden" id="tutorial-overlay">
      <div class="tutorial-content">
          <div class="tutorial-tabs">
              <button class="tab-btn active" data-tab="controls">Controls</button>
              <button class="tab-btn" data-tab="solve">Solving Guide</button>
          </div>
          
          <div id="tab-controls" class="tab-content active">
              <h2>How to Play</h2>
              <ul>
                  <li><strong>Rotate Cube:</strong> Left click on a face and drag to rotate it.</li>
                  <li><strong>Rotate Camera:</strong> Click and drag on the background to rotate the view.</li>
                  <li><strong>Scramble:</strong> Randomizes the cube.</li>
                  <li><strong>Undo:</strong> Reverses the last move.</li>
                  <li><strong>Solve:</strong> Automatically solves the cube.</li>
              </ul>
          </div>

          <div id="tab-solve" class="tab-content">
              <h2>Interactive Solving Guide</h2>
              <div class="solve-intro">
                  <p>Learn to solve a scrambled cube!</p>
                  <p>We will scramble the cube for you, then guide you step-by-step to solve it using reverse moves.</p>
                  <button id="btn-start-interactive" class="action-btn">Start Guided Solve</button>
              </div>
          </div>
          
          <button class="close-tutorial-btn" id="btn-close-tutorial">Close</button>
      </div>
  </div>

  <div id="tutorial-hud" class="tutorial-hud hidden">
      <div class="hud-instruction" id="hud-instruction">
          Rotate the Right Face...
      </div>
      <button id="btn-quit-tutorial" class="hud-quit">Quit Tutorial</button>
  </div>
`;

console.log('DOM Injected via main.js');

console.log('DOM Injected via main.js');

try {
    // HMR Safety: Dispose previous game if it exists
    if (window.game) {
        console.log("Disposing previous game instance...");
        // If we had a dispose method, we'd call it.
        // For now, simple re-init.
        // window.game.dispose(); 
    }

    // Initialize Game
    const game = new Game('game-container');
    const ui = new UIManager(game);
    game.init(ui);
    window.game = game;

    console.log('Game Re-initialized SUCCESSFULLY');
    console.log('Main.js script completed.');
} catch (error) {
    console.error("FATAL ERROR during Game Initialization:", error);
    document.body.innerHTML += `<div style="position:fixed;top:0;left:0;color:red;z-index:9999;background:rgba(0,0,0,0.8);padding:20px;">FATAL ERROR: ${error.message}</div>`;
}
