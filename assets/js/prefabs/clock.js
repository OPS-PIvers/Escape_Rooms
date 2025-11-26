import * as THREE from 'three';
import {
    interactables
} from '../utils.js';

function createClock(scene, position = new THREE.Vector3(-4.9, 3.5, 0), rotation = new THREE.Euler(0, Math.PI / 2, 0)) {
    const clockGroup = new THREE.Group();
    clockGroup.position.copy(position);
    clockGroup.rotation.copy(rotation);

    // Clock Face Texture
    const clockCanvas = document.createElement('canvas');
    clockCanvas.width = 128;
    clockCanvas.height = 128;
    const clockCtx = clockCanvas.getContext('2d');
    
    // Transparent background
    clockCtx.clearRect(0, 0, 128, 128);
    
    // White Face Circle
    clockCtx.fillStyle = '#ffffff';
    clockCtx.beginPath();
    clockCtx.arc(64, 64, 60, 0, Math.PI * 2);
    clockCtx.fill();

    // Border
    clockCtx.strokeStyle = '#000000';
    clockCtx.lineWidth = 4;
    clockCtx.beginPath();
    clockCtx.arc(64, 64, 60, 0, Math.PI * 2);
    clockCtx.stroke();
    
    clockCtx.fillStyle = '#000000';
    for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const r = (i % 3 === 0) ? 10 : 5;
        clockCtx.fillRect(64 + Math.sin(a) * 50 - (i % 3 === 0 ? 2 : 1), 64 - Math.cos(a) * 50 - (i % 3 === 0 ? 2 : 1), (i % 3 === 0 ? 4 : 2), r);
    }
    // Hands
    const nowTime = new Date();
    const hA = (nowTime.getHours() % 12 + nowTime.getMinutes() / 60) / 12 * Math.PI * 2;
    const mA = nowTime.getMinutes() / 60 * Math.PI * 2;
    clockCtx.strokeStyle = '#000';
    clockCtx.lineWidth = 3;
    clockCtx.beginPath();
    clockCtx.moveTo(64, 64);
    clockCtx.lineTo(64 + Math.sin(hA) * 30, 64 - Math.cos(hA) * 30);
    clockCtx.stroke();
    clockCtx.lineWidth = 2;
    clockCtx.beginPath();
    clockCtx.moveTo(64, 64);
    clockCtx.lineTo(64 + Math.sin(mA) * 45, 64 - Math.cos(mA) * 45);
    clockCtx.stroke();

    const clockTex = new THREE.CanvasTexture(clockCanvas);
    const clockBody = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.05), new THREE.MeshLambertMaterial({
        color: 0xffffff
    }));
    clockBody.rotation.x = Math.PI / 2;
    clockGroup.add(clockBody);

    const clockFace = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), new THREE.MeshBasicMaterial({
        map: clockTex,
        transparent: true
    }));
    clockFace.position.z = 0.03;
    clockFace.name = "clock";
    interactables.push(clockFace);
    clockGroup.add(clockFace);
    scene.add(clockGroup);

    return clockGroup;
}

export {
    createClock
};