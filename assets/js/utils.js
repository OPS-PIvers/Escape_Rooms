import * as THREE from 'three';

const interactables = [];

function createBox(w, h, d, matOrColor, x, y, z, parent, rX = 0, rY = 0, rZ = 0, name = null) {
    const geo = new THREE.BoxGeometry(w, h, d);
    const material = (typeof matOrColor === 'number') ? new THREE.MeshLambertMaterial({
        color: matOrColor
    }) : matOrColor;
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(x, y, z);
    mesh.rotation.set(rX, rY, rZ);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    if (name) {
        mesh.name = name;
        interactables.push(mesh);
    }
    parent.add(mesh);
    return mesh;
}

export {
    createBox,
    interactables
};