import {
    activeClues,
    hasSkeletonKey,
    initGame,
    locationMap,
    moveClue,
    questionPool,
    safeAttempts,
    setHasSkeletonKey,
    gameMode,
    winningObject,
    currentStep,
    advanceStep
} from './gameLogic.js';
import { getNextDescription, hasCyclingDescriptions } from './cyclingDescriptions.js';

export let isInteracting = false;
let currentCode = "";
export let gameWon = false;
const modal = document.getElementById('clueModal');
const modalTitle = document.getElementById('modalTitle');
const modalContent = document.getElementById('modalContent');
const optionsContainer = document.getElementById('optionsContainer');
const modalFeedback = document.getElementById('modalFeedback');
const closeBtn = document.getElementById('closeModalBtn');

// Prevent modal clicks from propagating to game elements
modal.addEventListener('click', (e) => {
    e.stopPropagation();
});

modal.addEventListener('touchstart', (e) => {
    e.stopPropagation();
}, { passive: false });

modal.addEventListener('touchend', (e) => {
    e.stopPropagation();
}, { passive: false });

// Close button handler
closeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    closeModal();
});

export function closeModal() {
    isInteracting = false;
    modal.style.display = 'none';
}

// Flavor Text Pool
const flavorTextPool = {
    "lunchbox": [
        "Smells like old egg salad...",
        "Just a few crumbs and a wrapper.",
        "An empty juice box and a note from Mom.",
        "Nothing but air and disappointment.",
        "A banana peel from the mesozoic era.",
        "Someone's sandwich is growing fuzz.",
        "It's locked. Probably for the best.",
        "An apple core and a spooky ghost story.",
        "Thermos is empty. Tragedy.",
        "Just a spoon. There is no spoon?"
    ],
    "trash": [
        "Just wadded up drafts of bad poetry.",
        "An empty soda can and some lint.",
        "Why are you digging in the trash?",
        "It's empty, thankfully.",
        "A crumpled paper that says 'The plan'. It's blank.",
        "Candy wrappers and regret.",
        "Broken pencils and shattered dreams.",
        "A receipt for a 'Time Machine'. It's expired.",
        "Banana peel. classic comedy prop.",
        "Nothing here worth getting your hands dirty for."
    ],
    "mug": [
        "Stained with years of black coffee.",
        "World's Okayest Archivist.",
        "There's some mold growing at the bottom.",
        "Empty. Need more caffeine.",
        "It says 'I hate Mondays'. Irony.",
        "Cold tea dregs.",
        "A chipped rim. Dangerous.",
        "Smells like peppermint and dust.",
        "Bone dry.",
        "It's stuck to the table. Sticky."
    ],
    "plant": [
        "It's plastic. Very convincing.",
        "Needs water. Or dusting. Or both.",
        "I think it's judging me.",
        "A fake fern. Or is it?",
        "It whispered something. Just the wind?",
        "Leaves are brown. It's dead, Jim.",
        "There's a bug on it. Eww.",
        "Photosynthesizing quietly.",
        "Do not eat the foliage.",
        "It's seen things."
    ],
    "computer": [
        "It's locked. Password hint: 'Password'.",
        "Blue Screen of Death.",
        "Just a screensaver of flying toasters.",
        "Searching for 'How to escape an archive'.",
        "404: Clue not found.",
        "System update 1 of 145...",
        "Keyboard is missing the 'Esc' key.",
        "It's running Windows 95.",
        "You have died of dysentery.",
        "A sticky note says 'Turn it off and on again'."
    ],
    "filing_cabinet": [
        "Tax returns from 1982.",
        "Mothballs and dust.",
        "Empty folders labeled 'Top Secret'.",
        "Just a ham sandwich?",
        "A file on 'UFO sightings in Duluth'.",
        "Recipes for hotdish.",
        "Overdue library book notices.",
        "Drawer is stuck. Ugh.",
        "Just paperwork. Boring paperwork.",
        "A collection of rubber bands."
    ],
    "generic": [
        "Just dust bunnies.",
        "Nothing useful here.",
        "Empty.",
        "Looks insignificant.",
        "Nothing to see here.",
        "Just clutter.",
        "Move along, nothing to see.",
        "This is not the clue you are looking for.",
        "Just a normal object. Suspiciously normal.",
        "Nope.",
        "Try looking somewhere else.",
        "It's just a thing.",
        "Why is this even here?",
        "A spider scuttles away.",
        "Totally useless.",
        "Red herring.",
        "I wonder who dusted this last?",
        "Nothing inside.",
        "Just emptiness.",
        "Keep searching!",
        "Not a clue.",
        "Just an object acting natural."
    ],
    "lamp": ["I love lamp.", "It's bright. Ow.", "Sheds some light on the situation.", "Flickering ominously.", "Just a lightbulb moment."],
    "clock": ["Time is ticking.", "Is it stopped? No, just slow.", "Tick... tock...", "Late for a very important date.", "Time flies when you're escaping."],
    "radio": ["Playing static.", "Scanning for alien signals.", "It's stuck on the polka station.", "Just white noise.", "Breaking news: You're still trapped."],
    "trophy": ["'Participation Award 1998'.", "First place in 'Being a Trophy'.", "Shiny. But useless.", "Dusty gold plastic.", "World's Best Detective? Not yet."],
    "hat": ["A fancy fedora.", "Not my size.", "M'lady.", "Hides a bad hair day.", "A detective's essential tool."],
    "briefcase": ["Locked. Probably full of papers.", "Smells like leather and business.", "Top secret documents? Nope, just a sandwich.", "Heavy.", "It's definitely not empty, but I can't open it."],
    "globe": ["I can see my house from here!", "Flat earthers beware.", "Spinning around the world.", "Where in the world is Carmen Sandiego?", "The world is your oyster."],
    "laptop": ["It's password locked.", "Sticky keys...", "Battery is dead.", "Just a reflection of a tired escapee.", "Clickety-clack."],
    "book_cluster": ["'History of Lint'. Fascinating.", "Just boring encyclopedias.", "A hollowed out book! ...Wait, no, just a book.", "Pages and pages of words.", "Dusty old tomes."],
    "picture": ["A lovely landscape.", "The eyes follow you.", "Is that a hidden safe behind it? No.", "Just art.", "A picture is worth a thousand words."],
    "fire_extinguisher": ["In case of emergency, break glass.", "Safety first!", "Heavy and red.", "Not a toy.", "Hope I don't need this."],
    "cardboard_box": ["A cat trap.", "Just an empty box.", "Fragile.", "This side up.", "What's in the box?!"],
    "keyboard": ["Sticky keys. Gross.", "QWERTY or Dvorak?", "Missing the 'Any' key.", "Someone spilled coffee on this.", "Clickety-clack."],
    "mouse": ["It's not a real mouse.", "Needs a mousepad.", "Scroll wheel is stuck.", "Double click to... do nothing.", "Squeak? No."],
    "library_books": [
        "'Advanced Filing Techniques Vol. 3'",
        "Dusty old ledgers from the 1970s.",
        "'Minnesota Tax Law: A Thriller'",
        "Heavy tomes about nothing important.",
        "'How to Escape: A Manual' - The pages are blank.",
        "Ancient encyclopedias. Smells like knowledge.",
        "'The Complete History of Paperclips'",
        "Romance novels with suspicious stains.",
        "'Dewey Decimal for Dummies'",
        "Just research materials. Very boring.",
        "A book falls out. You catch it dramatically.",
        "'Lost: One Archive Key' - It's fiction.",
        "Someone dog-eared page 42. Monsters.",
        "'Cooking with Hotdish' - Classic Minnesota.",
        "Legal documents from 1823. Fascinating."
    ],
    "library_plant": [
        "It's plastic. But it looks real from afar.",
        "Needs water. Or maybe it's fake?",
        "The leaves are suspiciously perfect.",
        "A decorative fern. Very professional.",
        "It's seen better days. Or is it new?",
        "Someone forgot to dust this.",
        "Adds a touch of nature to the room.",
        "Photosynthesis not included.",
        "The pot says 'Handle with care'.",
        "At least it can't die. Wait, is it alive?"
    ],
    "library_lamp": [
        "Provides excellent reading light.",
        "I love lamp. Library edition.",
        "The bulb flickers. Ambiance.",
        "Perfect for late night research.",
        "Surprisingly heavy for a lamp.",
        "The switch doesn't work. It's stuck on.",
        "Casts interesting shadows on the books.",
        "Moth-approved lighting solution."
    ],
    "secret_book": [
        "*Click* The bookshelf mechanism activates!",
        "The red book triggers something...",
        "A hidden mechanism engages!",
        "You hear a mechanical sound...",
        "*CLUNK* Something is moving!"
    ]
};

function triggerVictory(finalTimeStr) {
    gameWon = true;
    modal.style.display = 'none';
    isInteracting = false;
    setTimeout(() => {
        document.getElementById('victoryModal').style.display = 'flex';
        document.getElementById('victoryTime').textContent = `TIME LEFT: ${finalTimeStr}`;
    }, 500);
}


function getFlavorText(objName) {
    let key = "generic";
    if (objName.includes("filing_cabinet")) key = "filing_cabinet";
    else if (objName.includes("book_cluster")) key = "book_cluster";
    else if (objName.includes("library_books")) key = "library_books";
    else if (objName.includes("library_plant")) key = "library_plant";
    else if (objName.includes("library_lamp")) key = "library_lamp";
    else if (objName.includes("library_globe")) key = "globe";
    else if (objName.includes("library_briefcase")) key = "briefcase";
    else if (objName.includes("lamp")) key = "lamp";
    else if (flavorTextPool[objName]) key = objName;

    const pool = flavorTextPool[key];
    return pool[Math.floor(Math.random() * pool.length)];
}

export function showModal(objName, {
    doorPivot,
    finalTimeStr
}) {
    // --- DOOR INTERACTION ---
    if (objName === "door") {
        if (gameMode === "code_door") {
            currentCode = "";
            renderKeypad("DOOR LOCK");
            modal.style.display = 'block';
            isInteracting = true;
            return;
        }
        if (gameMode === "access_cards") {
            const solvedCount = activeClues.filter(c => c.solved).length;
            if (solvedCount >= 4) {
                triggerVictory(document.getElementById('victoryTime') ? document.getElementById('victoryTime').textContent : "00:00");
            } else {
                modalTitle.textContent = "ACCESS DENIED";
                modalContent.innerHTML = `<p>Security Door.</p><p>Requires 4 Access Cards.</p><p>Cards Found: ${solvedCount} / 4</p>`;
                optionsContainer.innerHTML = "";
                modalFeedback.textContent = "";
                modal.style.display = 'block';
                isInteracting = true;
            }
            return;
        }
        if (gameMode === "trail") {
            if (currentStep >= 4) {
                triggerVictory(document.getElementById('victoryTime') ? document.getElementById('victoryTime').textContent : "00:00");
            } else {
                const nextObj = Object.keys(locationMap).find(key => locationMap[key] === currentStep);
                const niceName = nextObj ? nextObj.replace(/_/g, ' ').toUpperCase() : "FIRST CLUE";
                modalTitle.textContent = "LOCKED";
                modalContent.innerHTML = `<p>The door is sealed.</p><p>Hint: Look for the <strong>${niceName}</strong>.</p>`;
                optionsContainer.innerHTML = "";
                modal.style.display = 'block';
                isInteracting = true;
            }
            return;
        }
        if (gameMode === "hidden_key") {
            if (hasSkeletonKey) { // Set by finding the object
                triggerVictory(document.getElementById('victoryTime') ? document.getElementById('victoryTime').textContent : "00:00");
            } else {
                modalTitle.textContent = "LOCKED";
                modalContent.innerHTML = "<p>Locked. The key is hidden somewhere in this room.</p>";
                optionsContainer.innerHTML = "";
                modalFeedback.textContent = "";
                modal.style.display = 'block';
                isInteracting = true;
            }
            return;
        }
        // Classic
        if (hasSkeletonKey) {
            triggerVictory(document.getElementById('victoryTime') ? document.getElementById('victoryTime').textContent : "00:00");
        } else {
            modalTitle.textContent = "LOCKED";
            modalContent.innerHTML = "<p>The door is locked tight.</p><p>It requires a specific key.</p>";
            optionsContainer.innerHTML = "";
            modalFeedback.textContent = "";
            modal.style.display = 'block';
            isInteracting = true;
        }
        return;
    }

    // --- SAFE INTERACTION ---
    if (objName === "safe") {
        if (gameMode === "classic") {
            currentCode = "";
            renderKeypad("SAFE LOCK");
            modal.style.display = 'block';
            isInteracting = true;
        } else {
            modalTitle.textContent = "SAFE";
            modalContent.innerHTML = "<p>It seems inactive or empty in this mission.</p>";
            optionsContainer.innerHTML = "";
            modalFeedback.textContent = "";
            modal.style.display = 'block';
            isInteracting = true;
        }
        return;
    }

    // --- OBJECT INTERACTION ---
    modalFeedback.textContent = "";
    optionsContainer.innerHTML = "";
    
    let qIndex = -1;
    let slotIndex = -1; // Only for tracking solved state in activeClues
    
    if (gameMode === "trail") {
        slotIndex = locationMap[objName];
        if (slotIndex !== null && slotIndex !== undefined) {
            if (slotIndex > currentStep) {
                modalTitle.textContent = "LOCKED";
                modalContent.innerHTML = "<p>You need a clue to open this.</p><p>Solve previous puzzles first.</p>";
                optionsContainer.innerHTML = "";
                modal.style.display = 'block';
                isInteracting = true;
                return;
            }
            if (slotIndex < currentStep) {
                modalTitle.textContent = "COMPLETED";
                modalContent.innerHTML = "<p>You already solved this puzzle.</p>";
                optionsContainer.innerHTML = "";
                modal.style.display = 'block';
                isInteracting = true;
                return;
            }
        }
    }
    
    if (gameMode === "hidden_key") {
        qIndex = locationMap[objName];
    } else {
        slotIndex = locationMap[objName];
        if (slotIndex !== null && slotIndex !== undefined) {
            const clue = activeClues[slotIndex];
            qIndex = clue.qIndex;
            if (clue.solved) {
                modalTitle.textContent = "SOLVED";
                let msg = "";
                if (gameMode === "access_cards") msg = "You already found the Access Card here.";
                else msg = `You found a number: ${clue.digit}`;
                modalContent.innerHTML = `<p>${msg}</p>`;
                modal.style.display = 'block';
                isInteracting = true;
                return;
            }
        }
    }

    if (qIndex === -1 || qIndex === null || qIndex === undefined) {
        // --- COMPUTER PASSWORD ENTRY ---
        if (objName === "computer") {
            renderPasswordEntry();
            modal.style.display = 'block';
            isInteracting = true;
            return;
        }

        // Cycling descriptions or fallback flavor text
        const displayName = objName.replace(/_/g, ' ').toUpperCase();
        modalTitle.textContent = displayName;
        
        // Use cycling descriptions if available, otherwise fallback to flavor text
        let description;
        if (hasCyclingDescriptions(objName)) {
            description = getNextDescription(objName);
        } else {
            description = getFlavorText(objName);
        }
        
        modalContent.innerHTML = `<p>${description}</p>`;
        modal.style.display = 'block';
        isInteracting = true;
    } else {
        // Show Question
        const qData = questionPool[qIndex];
        if (!qData) {
             modalContent.innerHTML = "<p>Error: Missing Question Data</p>"; // Safety
        } else {
            modalTitle.textContent = qData.t;
            modalContent.innerHTML = `<div class='question-box'><strong>${qData.q}</strong></div>`;

            const options = qData.o.map((text, idx) => ({
                text,
                isCorrect: idx === qData.c
            }));
            options.sort(() => Math.random() - 0.5);

            options.forEach((opt) => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.textContent = opt.text;
                btn.onclick = () => handleAnswer(slotIndex, opt.isCorrect, btn, objName);
                optionsContainer.appendChild(btn);
            });
        }
        modal.style.display = 'block';
        isInteracting = true;
    }
}

function resetGameLogic() {
    modalTitle.textContent = "SYSTEM RESET";
    modalContent.innerHTML = "<h2 style='color:red'>SECURITY LOCKOUT</h2><p>Too many failed attempts.</p><p>Clues have been relocated. Codes reset.</p>";
    optionsContainer.innerHTML = "";

    // Reset internals
    initGame();

    setTimeout(() => {
        modal.style.display = 'none';
        // controls.lock();
        isInteracting = false;
    }, 3000);
}

function checkKeypadCode() {
    if (currentCode === "1858") {
        if (gameMode === "code_door") {
            triggerVictory(document.getElementById('victoryTime') ? document.getElementById('victoryTime').textContent : "00:00"); 
        } else {
            modalTitle.textContent = "SAFE UNLOCKED";
            modalContent.innerHTML = "<h2 style='color:#4caf50'>SUCCESS</h2><p>The safe opens.</p><p>Inside, you find an old <strong>SKELETON KEY</strong>.</p>";
            setHasSkeletonKey(true);
            optionsContainer.innerHTML = "";
            const takeBtn = document.createElement('button');
            takeBtn.className = 'option-btn';
            takeBtn.textContent = "TAKE KEY";
            takeBtn.onclick = () => {
                modal.style.display = 'none';
                isInteracting = false;
            };
            optionsContainer.appendChild(takeBtn);
        }
    } else {
        safeAttempts--;
        if (safeAttempts <= 0) {
            resetGameLogic();
        } else {
            modalFeedback.style.color = 'red';
            modalFeedback.textContent = "INVALID CODE";
            currentCode = "";
            renderKeypad(gameMode === "code_door" ? "DOOR LOCK" : "SAFE LOCK");
        }
    }
}


function handleAnswer(slotIndex, isCorrect, btnElement, objName) {
    const allBtns = document.querySelectorAll('.option-btn');
    allBtns.forEach(b => b.disabled = true);
    if (isCorrect) {
        btnElement.classList.add('correct');
        modalFeedback.style.color = "#4caf50";
        
        if (gameMode === "hidden_key") {
            if (objName === winningObject) {
                modalFeedback.innerHTML = `CORRECT! <br><strong>YOU FOUND THE HIDDEN KEY!</strong>`;
                setHasSkeletonKey(true); 
                // Add "Exit" button
                const exitBtn = document.createElement('button');
                exitBtn.className = 'option-btn';
                exitBtn.style.backgroundColor = "#4caf50";
                exitBtn.style.marginTop = "10px";
                exitBtn.textContent = "GO TO DOOR";
                exitBtn.onclick = () => { closeModal(); };
                optionsContainer.appendChild(exitBtn);
            } else {
                modalFeedback.innerHTML = `CORRECT! <br>But the key is not here. Keep looking!`;
            }
        } else if (gameMode === "access_cards") {
            modalFeedback.innerHTML = `CORRECT! <br>You found an <strong>ACCESS CARD</strong>.`;
            activeClues[slotIndex].solved = true;
        } else if (gameMode === "trail") {
            const nextStep = advanceStep();
            if (nextStep >= 4) {
                 modalFeedback.innerHTML = `CORRECT! <br><strong>CHAIN COMPLETE! ESCAPE UNLOCKED!</strong>`;
                 const exitBtn = document.createElement('button');
                 exitBtn.className = 'option-btn';
                 exitBtn.textContent = "ESCAPE";
                 exitBtn.style.backgroundColor = "#4caf50";
                 exitBtn.style.marginTop = "10px";
                 exitBtn.onclick = () => { triggerVictory("00:00"); };
                 optionsContainer.appendChild(exitBtn);
            } else {
                 const nextObj = Object.keys(locationMap).find(key => locationMap[key] === nextStep);
                 const niceName = nextObj ? nextObj.replace(/_/g, ' ').toUpperCase() : "NEXT CLUE";
                 modalFeedback.innerHTML = `CORRECT! <br>New Clue: <strong>Check the ${niceName}</strong>`;
            }
        } else {
            modalFeedback.innerHTML = `CORRECT! <br>You found a number: <strong>${activeClues[slotIndex].digit}</strong>`;
            activeClues[slotIndex].solved = true;
        }
    } else {
        btnElement.classList.add('wrong');
        modalFeedback.style.color = "#e57373";
        if (gameMode !== "hidden_key") {
            moveClue(slotIndex, objName);
            modalFeedback.innerHTML = `WRONG! The clue has vanished.<br>You must find it again elsewhere.`;
        } else {
            modalFeedback.innerHTML = `WRONG!`;
        }
    }
}

function renderKeypad(title = "SAFE LOCK") {
    modalTitle.textContent = title;

    const solvedCount = activeClues.filter(c => c.solved).length;
    const allSolved = solvedCount === 4;

    // Gather collected digits
    let collectedDigits = activeClues.filter(c => c.solved).map(c => c.digit);
    collectedDigits.sort(); // Sort for display so order isn't clear

    let html = "";
    if (!allSolved) {
        html += `<p style="color:#e57373">LOCK DISABLED. MISSING DATA.</p>`;
        html += `<p>COLLECT ALL 4 NUMBERS TO ACTIVATE.</p>`;
        html += `<p>COLLECTED: [ ${collectedDigits.join(" ")} ]</p>`;
        modalContent.innerHTML = html;
        optionsContainer.innerHTML = "";
        return;
    }

    // All solved
    html += `<p>ENTER 4-DIGIT PASSCODE</p>`;
    html += `<p>AVAILABLE NUMBERS: [ ${collectedDigits.join(" - ")} ]</p>`;

    if (safeAttempts <= 1) {
        html += `<p style="color:#ffb74d; font-style:italic; border:1px solid #ffb74d; padding:5px;">HINT: A year of beginning.</p>`;
    }

    html += `<div id="codeDisplay">${currentCode.padEnd(4, '_')}</div>
             <p style="font-size:14px; color:#e57373;">ATTEMPTS REMAINING: ${safeAttempts}</p>`;
    modalContent.innerHTML = html;

    const kpDiv = document.createElement('div');
    kpDiv.id = "keypad";
    for (let i = 1; i <= 9; i++) {
        const btn = document.createElement('div');
        btn.className = 'key-btn';
        btn.textContent = i;
        btn.onclick = () => handleKeypad(i);
        kpDiv.appendChild(btn);
    }
    const clearBtn = document.createElement('div');
    clearBtn.className = 'key-btn';
    clearBtn.textContent = "C";
    clearBtn.onclick = () => {
        currentCode = "";
        renderKeypad(title);
    };
    kpDiv.appendChild(clearBtn);
    const zeroBtn = document.createElement('div');
    zeroBtn.className = 'key-btn';
    zeroBtn.textContent = "0";
    zeroBtn.onclick = () => handleKeypad(0);
    kpDiv.appendChild(zeroBtn);
    const enterBtn = document.createElement('div');
    enterBtn.className = 'key-btn';
    enterBtn.textContent = "E";
    enterBtn.style.color = '#4caf50';
    enterBtn.onclick = () => checkKeypadCode();
    kpDiv.appendChild(enterBtn);
    modalContent.appendChild(kpDiv);
    optionsContainer.innerHTML = "";
    modalFeedback.textContent = "";
}

function handleKeypad(num) {
    const allSolved = activeClues.every(c => c.solved);
    if (!allSolved) return;

    if (currentCode.length < 4) {
        currentCode += num;
        const displayEl = document.getElementById('codeDisplay');
        if (displayEl) displayEl.textContent = currentCode.padEnd(4, '_');
    }
}

// Computer password system
let computerUnlocked = false;
const COMPUTER_PASSWORD = "admin"; // Change this to any password you want

function renderPasswordEntry() {
    modalTitle.textContent = "COMPUTER LOGIN";

    if (computerUnlocked) {
        modalContent.innerHTML = `
            <div style="color: #4caf50; text-align: center; margin: 20px 0;">
                <h3>✓ SYSTEM UNLOCKED</h3>
                <p>Access Granted</p>
                <p style="margin-top: 15px; font-size: 14px; color: #aaa;">
                    Computer files accessed successfully.
                </p>
            </div>
        `;
        optionsContainer.innerHTML = "";
        modalFeedback.textContent = "";
        return;
    }

    modalContent.innerHTML = `
        <div style="text-align: center;">
            <p>ENTER PASSWORD:</p>
            <input type="password" id="computerPassword"
                   style="width: 100%; padding: 10px; font-size: 16px;
                          background: #1a1a1a; color: #fff; border: 2px solid #4a4a4a;
                          border-radius: 4px; text-align: center; font-family: monospace;
                          margin: 10px 0;"
                   placeholder="Password"
                   autocomplete="off">
        </div>
    `;

    optionsContainer.innerHTML = "";

    // Create submit button
    const submitBtn = document.createElement('button');
    submitBtn.className = 'option-btn';
    submitBtn.textContent = 'LOGIN';
    submitBtn.style.backgroundColor = '#4a4a4a';
    submitBtn.onclick = checkComputerPassword;
    optionsContainer.appendChild(submitBtn);

    modalFeedback.textContent = "";

    // Allow Enter key to submit
    setTimeout(() => {
        const input = document.getElementById('computerPassword');
        if (input) {
            input.focus();
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    checkComputerPassword();
                }
            });
        }
    }, 100);
}

function checkComputerPassword() {
    const input = document.getElementById('computerPassword');
    if (!input) return;

    const enteredPassword = input.value;

    if (enteredPassword === COMPUTER_PASSWORD) {
        computerUnlocked = true;
        modalFeedback.style.color = '#4caf50';
        modalFeedback.textContent = '✓ ACCESS GRANTED';

        // Re-render with success state
        setTimeout(() => {
            renderPasswordEntry();
        }, 800);
    } else {
        modalFeedback.style.color = '#e57373';
        modalFeedback.textContent = '✗ INVALID PASSWORD';
        input.value = '';
        input.focus();
    }
}
