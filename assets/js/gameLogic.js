const questionPool = [{
    t: "Flour Power",
    q: "Which city was the 'Flour Milling Capital of the World'?",
    o: ["Duluth", "Minneapolis", "St. Paul", "Rochester"],
    c: 1
}, {
    t: "Fur Trade",
    q: "Which animal pelt was most prized by Voyageurs?",
    o: ["Bear", "Deer", "Beaver", "Wolf"],
    c: 2
}, {
    t: "Iron Giants",
    q: "Name the largest Iron Range in MN.",
    o: ["Mesabi", "Cuyuna", "Vermilion", "Gunflint"],
    c: 0
}, {
    t: "State Seal",
    q: "The phrase 'L'Etoile du Nord' means:",
    o: ["Land of Lakes", "Star of the North", "True North", "Cold Waters"],
    c: 1
}, {
    t: "First People",
    q: "Which group lived in MN forests before the Ojibwe arrived?",
    o: ["Dakota", "Iroquois", "Apache", "Inuit"],
    c: 0
}, {
    t: "Water Source",
    q: "Lake Itasca is the source of which river?",
    o: ["Minnesota", "St. Croix", "Mississippi", "Red"],
    c: 2
}, {
    t: "Early Politics",
    q: "Who was Minnesota's first state governor?",
    o: ["Alexander Ramsey", "Henry Sibley", "Knute Nelson", "Hubert Humphrey"],
    c: 1
}, {
    t: "Transport",
    q: "What was the Red River Cart known for?",
    o: ["Its speed", "Its squeaky wheels", "Its iron frame", "Floating"],
    c: 1
}, {
    t: "Conflict",
    q: "The US-Dakota War took place in which year?",
    o: ["1812", "1862", "1900", "1776"],
    c: 1
}, {
    t: "Immigration",
    q: "Which European group settled heavily in MN in the late 1800s?",
    o: ["Italians", "Scandinavians", "Spanish", "Greeks"],
    c: 1
}, {
    t: "Civil War",
    q: "MN was the first state to offer troops to the Union. Which regiment is famous?",
    o: ["1st Minnesota", "Iron Brigade", "Rough Riders", "Green Mountain Boys"],
    c: 0
}, {
    t: "Folklore",
    q: "Who is the legendary giant lumberjack of MN folklore?",
    o: ["Pecos Bill", "John Henry", "Paul Bunyan", "Johnny Appleseed"],
    c: 2
}, {
    t: "Geography",
    q: "What is the largest lake entirely within Minnesota?",
    o: ["Mille Lacs", "Red Lake", "Leech Lake", "Lake Minnetonka"],
    c: 1
}, {
    t: "Capital City",
    q: "Which city is the capital of Minnesota?",
    o: ["Minneapolis", "St. Paul", "Duluth", "Bloomington"],
    c: 1
}, {
    t: "Territory",
    q: "Before statehood, MN was a territory. In what year did it become a territory?",
    o: ["1849", "1858", "1800", "1890"],
    c: 0
}];

let activeClues = [{
    digit: 1,
    qIndex: 0,
    solved: false
}, {
    digit: 8,
    qIndex: 1,
    solved: false
}, {
    digit: 5,
    qIndex: 2,
    solved: false
}, {
    digit: 8,
    qIndex: 3,
    solved: false
}];
let hasSkeletonKey = false;
let safeAttempts = 3;

// Expanded locations list
const locations = [
    "computer", "filing_cabinet_1", "filing_cabinet_2", "filing_cabinet_3", "papers", "safe",
    "briefcase", "mug", "hat", "lamp",
    "globe", "radio", "typewriter", "plant", "trophy", "clock", "trash", "lunchbox",
    "picture", "desk_lamp", "cardboard_box", "fire_extinguisher",
    "book_cluster_1", "book_cluster_2", "book_cluster_3", "book_cluster_4",
    "keyboard", "mouse", "open_book"
];

let locationMap = {};

function initGame() {
    locations.forEach(loc => locationMap[loc] = null);
    questionPool.sort(() => 0.5 - Math.random());
    for (let i = 0; i < 4; i++) {
        activeClues[i].qIndex = i;
        activeClues[i].solved = false;
    }
    const shuffledLocs = [...locations].sort(() => 0.5 - Math.random());
    for (let i = 0; i < 4; i++) {
        locationMap[shuffledLocs[i]] = i;
    }
    safeAttempts = 3;
}

function moveClue(slotIndex, fromObjName) {
    const emptyLocs = locations.filter(loc => locationMap[loc] === null && loc !== fromObjName);
    if (emptyLocs.length > 0) {
        const newLoc = emptyLocs[Math.floor(Math.random() * emptyLocs.length)];
        locationMap[newLoc] = slotIndex;
        locationMap[fromObjName] = null;

        const usedQIndices = activeClues.map(c => c.qIndex);
        const availableQIndices = [];
        for (let i = 0; i < questionPool.length; i++) {
            if (!usedQIndices.includes(i)) availableQIndices.push(i);
        }
        if (availableQIndices.length > 0) {
            const newQIndex = availableQIndices[Math.floor(Math.random() * availableQIndices.length)];
            activeClues[slotIndex].qIndex = newQIndex;
        }
        return newLoc;
    }
    return null;
}

function setHasSkeletonKey(value) {
    hasSkeletonKey = value;
}
// We need to export the variables themselves so other modules can mutate them
export {
    questionPool,
    activeClues,
    hasSkeletonKey,
    setHasSkeletonKey,
    safeAttempts,
    locations,
    locationMap,
    initGame,
    moveClue
};