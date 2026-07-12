const fs = require('fs');
let matchScene = fs.readFileSync('src/scenes/MatchScene.js', 'utf8');

// Update isMobile
matchScene = matchScene.replace(
  /this\.isMobile = \('ontouchstart' in window \|\| navigator\.maxTouchPoints > 0\) && window\.innerWidth < 1024;/,
  'this.isMobile = window.innerWidth < 1024;'
);

// Update event listeners from touch to pointer
const touchBlockRegex = /if \(joystickContainer && joystickThumb\) \{[\s\S]*?const switchPovBtn = document\.getElementById\('touch-pov-btn'\);\s+if \(switchPovBtn\) \{\s+switchPovBtn\.addEventListener\('touchstart', \(e\) => \{\s+e\.preventDefault\(\);\s+this\.cycleCameraMode\(\);\s+\}\);\s+\}\s+\}/;

const newBlock = `if (joystickContainer && joystickThumb) {
        let joystickTouchId = null;
        let startX = 0;
        let startY = 0;
        const maxDist = 50;

        joystickContainer.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (joystickTouchId !== null) return;

          joystickTouchId = e.pointerId;
          this.joystickActive = true;

          const rect = joystickContainer.getBoundingClientRect();
          startX = rect.left + rect.width / 2;
          startY = rect.top + rect.height / 2;
          joystickContainer.setPointerCapture(e.pointerId);
        });

        joystickContainer.addEventListener('pointermove', (e) => {
          e.preventDefault();
          if (joystickTouchId !== e.pointerId) return;

          const dx = e.clientX - startX;
          const dy = e.clientY - startY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          let finalX = dx;
          let finalY = dy;
          if (dist > maxDist) {
            finalX = (dx / dist) * maxDist;
            finalY = (dy / dist) * maxDist;
          }

          joystickThumb.style.transform = \`translate(\${finalX}px, \${finalY}px)\`;

          this.joystickVector.x = finalX / maxDist;
          this.joystickVector.y = finalY / maxDist;
        });

        const resetJoystick = (e) => {
          if (e.pointerId === joystickTouchId) {
            joystickTouchId = null;
            this.joystickActive = false;
            this.joystickVector.set(0, 0);
            joystickThumb.style.transform = 'translate(0px, 0px)';
          }
        };

        joystickContainer.addEventListener('pointerup', resetJoystick);
        joystickContainer.addEventListener('pointercancel', resetJoystick);
      }

      const lookZone = document.getElementById('touch-look-zone');
      if (lookZone) {
        let lookTouchId = null;
        let lastTouchX = 0;
        let lastTouchY = 0;

        lookZone.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (lookTouchId !== null) return;

          lookTouchId = e.pointerId;
          lastTouchX = e.clientX;
          lastTouchY = e.clientY;
          lookZone.setPointerCapture(e.pointerId);
        });

        lookZone.addEventListener('pointermove', (e) => {
          e.preventDefault();
          if (lookTouchId !== e.pointerId) return;

          const dx = e.clientX - lastTouchX;
          const dy = e.clientY - lastTouchY;

          const touchSensitivity = 0.0035 * this.sensitivityMultiplier;
          this.cameraYaw -= dx * touchSensitivity;
          this.cameraPitch -= dy * touchSensitivity;
          this.cameraPitch = Math.max(-1.1, Math.min(0.35, this.cameraPitch));

          lastTouchX = e.clientX;
          lastTouchY = e.clientY;
        });

        const resetLook = (e) => {
          if (e.pointerId === lookTouchId) {
            lookTouchId = null;
          }
        };

        lookZone.addEventListener('pointerup', resetLook);
        lookZone.addEventListener('pointercancel', resetLook);
      }

      const fireBtn = document.getElementById('touch-fire-btn');
      if (fireBtn) {
        fireBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.touchFiring = true;
          this.fireActiveWeapon();
          fireBtn.setPointerCapture(e.pointerId);
        });
        fireBtn.addEventListener('pointerup', (e) => {
          e.preventDefault();
          this.touchFiring = false;
        });
        fireBtn.addEventListener('pointercancel', (e) => {
          e.preventDefault();
          this.touchFiring = false;
        });
      }

      const switchWeaponBtn = document.getElementById('touch-weapon-switch');
      if (switchWeaponBtn) {
        switchWeaponBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          const keys = Object.keys(this.weaponConfigs);
          const currentIndex = keys.indexOf(this.selectedWeapon);
          const nextIndex = (currentIndex + 1) % keys.length;
          this.switchWeapon(keys[nextIndex]);
        });
      }

      const switchPovBtn = document.getElementById('touch-pov-btn');
      if (switchPovBtn) {
        switchPovBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          this.cycleCameraMode();
        });
      }`;

matchScene = matchScene.replace(touchBlockRegex, newBlock);

// Update HUD
const oldHud = `// 2. Active Weapon
    if (this.hudWeaponName) {
      const config = this.weaponConfigs[this.selectedWeapon];
      this.hudWeaponName.innerText = config ? config.name : 'Unknown';
    }`;
    
const newHud = `// 2. Active Weapon
    if (this.hudWeaponName) {
      const config = this.weaponConfigs[this.selectedWeapon];
      this.hudWeaponName.innerText = config ? config.name : 'Unknown';
    }
    const touchWeaponLabel = document.getElementById('touch-weapon-label');
    if (touchWeaponLabel) {
      const config = this.weaponConfigs[this.selectedWeapon];
      const abbrev = config ? config.name.split(' ').map(w => w[0]).join('') : 'NXT';
      touchWeaponLabel.innerText = abbrev;
    }`;

matchScene = matchScene.replace(oldHud, newHud);

fs.writeFileSync('src/scenes/MatchScene.js', matchScene);

let indexHtml = fs.readFileSync('index.html', 'utf8');
indexHtml = indexHtml.replace(
  '<span class="weapon-label">NXT</span>',
  '<span class="weapon-label" id="touch-weapon-label">NXT</span>'
);
fs.writeFileSync('index.html', indexHtml);
console.log('Update successful');
