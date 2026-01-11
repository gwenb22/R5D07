# Rubik's Cube 3D Interactive

Un simulateur de Rubik's Cube 3D interactif et réaliste, développé avec **Three.js** et **Vite**. Ce projet inclut un tutoriel interactif, un solveur automatique, et est compatible mobile.

![Rubik's Cube Demo](./public/screenshot.png) *(Note: Ajouter une capture d'écran ici si souhaité)*

## 🚀 Fonctionnalités

### 🎮 Gameplay Interactif
- **Rotation 3D Fluide** : Faites pivoter le cube et les faces avec la souris ou le tactile.
- **Contrôles Complets** : Mélangez (Scramble), Annulez (Undo), Résolvez (Solve), et Réinitialisez (Reset) le cube à tout moment.
- **Support Mobile** : Jouable sur smartphone et tablette grâce à la gestion du tactile et au verrouillage du défilement.

### 🎓 Tutoriel Interactif
- **Guide Pas-à-Pas** : Apprenez à résoudre le cube avec un mode guidé interactif.
- **Mode Scénarisé** : Le cube se mélange automatiquement et le système vous guide mouvement par mouvement pour le résoudre (revers de mélange).
- **HUD Dynamique** : Instructions en temps réel affichées à l'écran.

### ⏱️ Statistiques
- **Compteur de Mouvements** : Suivez votre efficacité.
- **Chronomètre** : Mesurez votre vitesse de résolution.
- **Stats Actives** : Les compteurs continuent de tourner même pendant la résolution automatique pour refléter l'effort total.

## 🛠️ Installation et Lancement

1.  **Prérequis** : Node.js installé.
2.  **Cloner le projet** :
    ```bash
    git clone <votre-repo-url>
    cd R5D07
    ```
3.  **Installer les dépendances** :
    ```bash
    npm install
    ```
4.  **Lancer le serveur de développement** :
    ```bash
    npm run dev
    ```
5.  **Accéder à l'application** : Ouvrez `http://localhost:5173/` dans votre navigateur.

## 📦 Build pour Production

Pour générer les fichiers statiques optimisés pour la mise en ligne :
```bash
npm run build
```
Les fichiers seront dans le dossier `dist/`.

## 🧩 Technologies

-   **Three.js** : Moteur de rendu 3D.
-   **Vite** : Outil de build rapide.
-   **JavaScript (ES6+)** : Logique de jeu POO (Programmation Orientée Objet).
    -   `Game.js` : Contrôleur principal.
    -   `CubeManager.js` : Gestion de la géométrie et des rotations 3D.
    -   `InputManager.js` : Gestion des interactions souris/tactile via Raycasting.
    -   `TutorialManager.js` : Système de scénarios interactifs.
    -   `UIManager.js` : Interface utilisateur.

## 📱 Support Mobile

L'application utilise `touch-action: none` pour garantir une expérience fluide sur tactile, empêchant le navigateur d'interférer avec les gestes de rotation du cube.

---
Développé dans le cadre du cours "R5.07 Dispositifs Interactifs".
