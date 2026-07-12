import { LobbyUI } from './scenes/LobbyUI.js';
import { MatchScene } from './scenes/MatchScene.js';

// Wait for DOM content to load before initialization
window.addEventListener('DOMContentLoaded', () => {
  console.log("System booting...");

  // Instantiate the Lobby UI, passing the transition handler callback
  const lobby = new LobbyUI((lobbyState) => {
    // lobbyState contains { playerName, selectedOutfit, selectedWeapon }

    // 1. Reveal HUD overlay elements (crosshair, stats, blocker container)
    const hudOverlay = document.getElementById('hud-overlay');
    if (hudOverlay) {
      hudOverlay.style.display = 'block';
    }

    // 2. Initialize and load into the 3D Match Scene with selected configurations
    window.matchScene = new MatchScene(lobbyState);
  });
});
