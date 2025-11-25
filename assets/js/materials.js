import * as THREE from 'three';

const colors = {
    wall: 0xebe5ce,
    trim: 0x4e342e,
    floor: 0x5d4037,
    shelf: 0x263238,
    cork: 0x8d6e63
};

// Computer Screen Texture
const compCanvas = document.createElement('canvas');
compCanvas.width = 512;
compCanvas.height = 512;
const cCtx = compCanvas.getContext('2d');
cCtx.fillStyle = '#000000';
cCtx.fillRect(0, 0, 512, 512);
cCtx.fillStyle = '#002200';
cCtx.font = '20px monospace';
for (let i = 0; i < 20; i++) {
    cCtx.fillText(Math.random().toString(2).substring(2), 10, 30 + i * 24);
}
cCtx.fillStyle = '#00ffcc';
cCtx.font = 'bold 40px "Share Tech Mono", monospace';
cCtx.textAlign = 'center';
cCtx.shadowColor = '#00ffcc';
cCtx.shadowBlur = 20;
cCtx.fillText("SYSTEM LOCKED", 256, 200);
cCtx.font = '20px "Share Tech Mono", monospace';
cCtx.fillText("MN HISTORY ARCHIVE", 256, 250);
cCtx.strokeStyle = '#00ffcc';
cCtx.lineWidth = 5;
cCtx.strokeRect(50, 140, 412, 150);

const mat = {
    wall: new THREE.MeshStandardMaterial({
        color: colors.wall,
        roughness: 0.9
    }),
    floor: new THREE.MeshStandardMaterial({
        color: colors.floor,
        roughness: 0.8
    }),
    shelf: new THREE.MeshLambertMaterial({
        color: colors.shelf
    }),
    woodDark: new THREE.MeshStandardMaterial({
        color: 0x3e2723,
        roughness: 0.7
    }),
    woodOld: new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 0.9
    }),
    chrome: new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.6,
        roughness: 0.4
    }),
    leather: new THREE.MeshStandardMaterial({
        color: 0x4e342e,
        roughness: 0.4
    }),
    glass: new THREE.MeshBasicMaterial({
        color: 0x88ccff,
        opacity: 0.1,
        transparent: true
    }),
    trim: new THREE.MeshLambertMaterial({
        color: colors.trim
    }),
    paper: new THREE.MeshLambertMaterial({
        color: 0xfffdf0
    }),
    rug: new THREE.MeshStandardMaterial({
        color: 0x5d4037,
        roughness: 1.0
    }),
    door: new THREE.MeshStandardMaterial({
        color: 0x3e2723
    }),
    cork: new THREE.MeshStandardMaterial({
        color: colors.cork,
        roughness: 1.0
    }),
    safe: new THREE.MeshStandardMaterial({
        color: 0x333333,
        metalness: 0.7,
        roughness: 0.3
    }),
    screenOn: new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(compCanvas)
    }),
    cabinet: new THREE.MeshStandardMaterial({
        color: 0x777777,
        metalness: 0.4,
        roughness: 0.5
    }),
    bookColors: [0x3e2723, 0x263238, 0x1b5e20, 0x880e4f, 0xbf360c, 0x004d40],
    gold: new THREE.MeshStandardMaterial({
        color: 0xffd700,
        metalness: 0.8,
        roughness: 0.2
    }),
    plantGreen: new THREE.MeshLambertMaterial({
        color: 0x2e7d32
    }),
    trashCan: new THREE.MeshStandardMaterial({
        color: 0x555555,
        metalness: 0.5
    })
};

export {
    colors,
    mat
};