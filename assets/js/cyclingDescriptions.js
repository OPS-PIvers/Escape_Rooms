// Cycling Description System for Office Escape Room
// Provides immersive, lived-in descriptions that cycle through on each interaction

// Description state tracking
const descriptionState = new Map();

// Initialize or get description state for an object
function getDescriptionState(objName) {
    if (!descriptionState.has(objName)) {
        descriptionState.set(objName, {
            currentIndex: 0,
            descriptions: getDescriptionsForObject(objName)
        });
    }
    return descriptionState.get(objName);
}

// Get next description in cycle for an object
function getNextDescription(objName) {
    const state = getDescriptionState(objName);
    const description = state.descriptions[state.currentIndex];
    
    // Cycle to next description
    state.currentIndex = (state.currentIndex + 1) % state.descriptions.length;
    
    return description;
}

// Reset description cycling for an object (useful for testing)
function resetDescriptionCycle(objName) {
    if (descriptionState.has(objName)) {
        descriptionState.get(objName).currentIndex = 0;
    }
}

// Get rich, immersive descriptions for each office object
function getDescriptionsForObject(objName) {
    const descriptionSets = {
        "desk": [
            "A heavy mahogany executive desk, scarred with years of important decisions and spilled coffee.",
            "The desk surface is neatly organized except for one persistent coffee ring stain.",
            "You notice faint scratch marks where countless laptops and papers have been shuffled.",
            "The desk drawers bear the marks of hurried hands - brass handles worn smooth with use.",
            "This desk has seen countless deadlines, negotiations, and probably a few tears.",
            "The wood grain tells stories of late nights and early mornings spent chasing targets.",
            "A prestigious workspace that commands respect - and occasional nap attempts during long meetings.",
            "The desk's polished surface reflects the room perfectly, showing someone actually maintains it."
        ],
        
        "chair": [
            "An ergonomic leather chair that's molded perfectly to someone's sitting habits.",
            "The chair swivels smoothly, suggesting it gets plenty of use during long work sessions.",
            "You notice faint scuff marks on the base from years of enthusiastic rolling around the office.",
            "The leather shows creases where someone leans back to think during important calls.",
            "This chair has supported its owner through countless video conferences and deadline panics.",
            "The hydraulic lift still works perfectly - someone invested in quality back support.",
            "Armrests show wear where elbows have rested during intense concentration sessions.",
            "The chair's wheels have carved tiny paths into the floor mat below."
        ],
        
        "computer": [
            "A high-end workstation with multiple monitors displaying complex spreadsheets and code.",
            "The screen shows a half-written email about quarterly projections, cursor blinking impatiently.",
            "You notice sticky notes around the monitor: 'CALL SARAH', 'REVIEW BUDGET', 'COFFEE???'.",
            "The computer hums with processing power, currently running what appears to be financial modeling software.",
            "A browser tab shows competitor analysis - someone's doing their homework thoroughly.",
            "The keyboard has that satisfying worn-in feel where the most-used keys are slightly faded.",
            "Background wallpaper is a serene mountain landscape - a mental escape from corporate life.",
            "The system tray shows notifications from 17 different apps - this person is connected to everything."
        ],
        
        "keyboard": [
            "A mechanical keyboard with satisfyingly clicky keys that begs to be typed on.",
            "The WASD keys are noticeably more worn than others - someone's a gamer after hours.",
            "You spot crumbs between the keys - evidence of lunch eaten during urgent work sessions.",
            "The keyboard has that satisfying matte finish that only comes from years of dedicated use.",
            "Someone spilled coffee on the spacebar last week - the faint stain tells the story.",
            "The escape key is polished to a shine from frequent use during stressful moments.",
            "Keyboard feet are deployed - this user prefers the ergonomic angled typing position.",
            "The number pad shows minimal wear - calculations are apparently not this person's job."
        ],
        
        "mouse": [
            "A precision gaming mouse with customizable RGB lighting currently set to corporate blue.",
            "The mouse pad shows a worn smooth spot where the cursor spends most of its time.",
            "Left click button is slightly more worn than right - someone's doing a lot of selection work.",
            "The mouse glides effortlessly across its pad, suggesting regular cleaning and maintenance.",
            "You notice the DPI settings are cranked high - this person values speed over precision.",
            "The cable has that perfect memory coil that only comes from being properly managed.",
            "Mouse feet are still in good condition - someone recently invested in replacement skates.",
            "The scroll wheel has a satisfying tactile click that's been used thousands of times."
        ],
        
        "secret_globe": [
            "A beautiful antique globe with slightly outdated political boundaries - charmingly retro.",
            "The globe spins smoothly, showing wear along the equator from frequent spinning.",
            "You notice someone's marked several locations with tiny pins - vacation destinations perhaps?",
            "The globe's base is heavy brass, suggesting quality craftsmanship and expensive taste.",
            "Antarctica is surprisingly detailed on this globe - the cartographer was thorough.",
            "The globe shows ocean currents and trade winds - this is more than just decorative.",
            "Someone's drawn a tiny heart over Paris - romantic or just loves croissants?",
            "The rotation mechanism is surprisingly smooth for such an old-looking object."
        ],
        
        "trash": [
            "An elegant mesh trash can that's surprisingly empty for a busy office.",
            "You see the usual office debris: crumpled drafts, coffee cup sleeves, and failed print jobs.",
            "The trash can contains evidence of someone's attempt at healthy eating - a salad container.",
            "At the bottom you spot a crumpled sticky note with what looks like a phone number.",
            "The mesh design allows you to see layers of office history in the accumulated papers.",
            "Someone's been doing spring cleaning - the can is lined with a fresh bag.",
            "You notice the remains of a protein bar wrapper - someone's fueling late nights.",
            "The trash can sits on a protective mat - someone cares about their office floor."
        ],
        
        "lamp": [
            "An adjustable desk lamp with warm LED lighting that creates a cozy work atmosphere.",
            "The lamp's arm is positioned perfectly over the desk's main workspace.",
            "You notice the lamp has three brightness settings - currently on 'focused work'.",
            "The lamp's base is heavy enough to prevent tipping, even when fully extended.",
            "Someone's written tiny measurements on the lamp's adjustment joints - precise positioning.",
            "The LED bulb is still bright after years of use - quality lighting investment.",
            "The power cord is neatly managed with clips - this person appreciates cable organization.",
            "The lamp's shade is slightly warm to the touch - it's been on for a while."
        ],
        
        "filing_cabinet": [
            "A sturdy four-drawer filing cabinet that's clearly seen decades of document management.",
            "The top drawer is slightly ajar, suggesting frequent access to active files.",
            "You notice the drawers are labeled with precise categories: 'Q1 Reports', 'Client Files', etc.",
            "The cabinet's surface reflects the overhead lights - someone polishes it regularly.",
            "Drawer handles show brass patina from years of human contact.",
            "The cabinet doesn't wobble even when multiple drawers are open - quality construction.",
            "You spot a tiny key in the top lock - security is taken seriously here.",
            "The cabinet sits on coasters to protect the floor - thoughtful office maintenance."
        ],
        
        "sofa": [
            "A comfortable leather sofa that's seen its share of power naps and informal meetings.",
            "One cushion is more compressed than the others - a favorite spot for deep thinking.",
            "The sofa's leather shows subtle creases where people have sat during long conversations.",
            "You notice a faint coffee stain on one armrest - evidence of animated discussions.",
            "The sofa faces away from the desk - clearly intended for relaxation, not work.",
            "Throw pillows are arranged just-so, suggesting someone with an eye for detail.",
            "The sofa's legs have felt pads to protect the floor - considerate office design.",
            "This sofa has definitely hosted some important deal celebrations and stress-relief sessions."
        ],
        
        "armchair": [
            "A plush armchair that invites you to sit and stay awhile.",
            "The chair's upholstery shows a subtle wear pattern where people lean back to contemplate.",
            "One armrest has a faint ring stain from countless coffee mugs during reading sessions.",
            "The chair sits at the perfect angle for both conversation and solitude.",
            "You notice the cushion maintains its shape despite regular use - quality foam.",
            "The chair's fabric has a sophisticated texture that feels expensive to the touch.",
            "This chair has positioned to take advantage of the room's natural light.",
            "The chair's sturdy construction suggests it's been here through multiple office redesigns."
        ],
        
        "coffee_table": [
            "A glass-topped coffee table that elegantly displays its contents without visual clutter.",
            "The table's surface is perfectly clean except for one fingerprint - someone wiped it recently.",
            "The table sits at the perfect height for both working laptops and resting feet.",
            "You notice the glass is thick and beveled at the edges - quality craftsmanship.",
            "The table's metal frame has a brushed finish that doesn't show fingerprints easily.",
            "Coasters are arranged neatly on the surface - someone cares about their furniture.",
            "The table's height creates a perfect sight line when sitting in the surrounding chairs.",
            "This table has clearly been chosen for both form and function in equal measure."
        ],
        
        "tv": [
            "A large flat-screen TV that's currently displaying a serene nature documentary.",
            "The TV is mounted at the perfect viewing height for someone sitting on the sofa.",
            "You notice the screen is completely dust-free - someone cleans it regularly.",
            "The TV's speakers are surprisingly good for a built-in system - quality entertainment.",
            "The TV has minimal bezels, creating an immersive viewing experience.",
            "A streaming device is hidden behind, suggesting someone who values clean aesthetics.",
            "The TV's reflections show it's positioned to avoid glare from the windows.",
            "This TV has clearly been chosen for both casual viewing and impressive presentations."
        ],
        
        "floor_lamp": [
            "An elegant floor lamp that provides ambient lighting for the sitting area.",
            "The lamp's extended arm creates a perfect pool of light over the coffee table.",
            "You notice the lamp has a dimmer switch - someone values adjustable atmosphere.",
            "The lamp's weighted base ensures stability even when fully extended.",
            "The lamp's shade diffuses light perfectly, creating a warm, inviting glow.",
            "The lamp's cord is neatly tucked along the baseboard - attention to detail matters here.",
            "The lamp's height creates visual balance with the surrounding furniture.",
            "This lamp clearly serves both functional and decorative purposes in the room's design."
        ],
        
        "coffee_cup": [
            "A ceramic coffee mug with the company logo, still warm to the touch.",
            "The mug shows faint lipstick marks - someone's been taking coffee breaks seriously.",
            "You notice a slight chip near the rim - this mug has seen years of daily use.",
            "The coffee stains inside suggest someone who likes their brew strong and frequent.",
            "The mug's handle fits perfectly in your hand - ergonomic design matters.",
            "The bottom shows ring marks from countless mornings placed on this table.",
            "This mug has clearly been someone's trusted companion through many deadlines.",
            "The company logo is slightly faded - this mug predates the current branding."
        ],
        
        "newspaper": [
            "Today's financial newspaper, open to the stock market pages.",
            "The newspaper shows sections that have been carefully read - someone stays informed.",
            "You notice the crossword puzzle is half-completed in pencil - methodical thinking.",
            "The business section has circled articles about competitors - strategic research.",
            "The newspaper's edges are slightly rumpled from being carried in a briefcase.",
            "Someone's underlined key paragraphs with a ruler - precise information gathering.",
            "The newspaper shows today's date - this is current, not decorative.",
            "This newspaper suggests someone who values traditional media in a digital world."
        ],
        
        "remote": [
            "A sleek universal remote control that's been programmed for multiple devices.",
            "The remote's most-used buttons show slight wear - TV and volume control.",
            "You notice the batteries are fresh - someone who comes prepared.",
            "The remote sits perfectly aligned with the table's edge - attention to detail.",
            "The remote's backlight feature suggests someone who watches TV in various lighting.",
            "The buttons have satisfying tactile feedback - quality user experience design.",
            "This remote clearly controls more than just the TV - sophisticated home entertainment.",
            "The remote's placement suggests it's used frequently but always returned to its spot."
        ],
        
        "plant": [
            "A lush green plant that brings life to the corporate environment.",
            "The plant's leaves are perfectly dusted - someone cares about their green companions.",
            "You notice the soil is moist but not waterlogged - experienced plant parent.",
            "The plant's pot matches the office decor - coordinated design choices.",
            "The plant shows new growth - it's thriving in this environment.",
            "The plant's position suggests it gets optimal natural light.",
            "This plant has clearly been chosen for its air-purifying properties as well as looks.",
            "The plant's healthy appearance suggests someone with a nurturing touch."
        ],
        
        "picture": [
            "An abstract painting that adds sophisticated color to the neutral office walls.",
            "The painting's frame is high-quality hardwood - investment in office aesthetics.",
            "You notice the painting is hung at the perfect height for viewing from a seated position.",
            "The painting's colors complement the office furniture - coordinated interior design.",
            "The painting's style suggests someone with artistic sensibilities.",
            "The painting is perfectly level - precision in installation matters here.",
            "This painting creates a focal point that draws the eye and conversation.",
            "The artwork suggests someone who values creativity even in a corporate setting."
        ],
        
        "coat_rack": [
            "A wooden coat rack with several empty hooks, ready for visitors.",
            "The rack's top shelf holds a forgotten umbrella - prepared for all weather.",
            "You notice one hook is more worn than others - the owner's preferred spot.",
            "The rack's wood polish shows regular maintenance - quality care for office furnishings.",
            "The rack's base is heavy to prevent tipping even with multiple heavy coats.",
            "This rack suggests someone who expects and welcomes guests.",
            "The rack's placement near the door is practical and thoughtful.",
            "The rack's design matches the office's executive aesthetic."
        ],
        
        "briefcase": [
            "A leather briefcase that's seen countless business trips and important meetings.",
            "The briefcase's combination locks are set to a memorable date - personal security.",
            "You notice scuff marks from being dragged through airports - well-traveled.",
            "The briefcase's handle shows wear from being carried through countless corridors.",
            "The leather has developed a rich patina that only comes from years of use.",
            "This briefcase has clearly been chosen for both security and style.",
            "The briefcase's corners are reinforced - someone who plans for the long term.",
            "This briefcase suggests someone who means business and values quality tools."
        ],
        
        "safe": [
            "A heavy-duty safe that suggests someone values security and privacy.",
            "The safe's combination dial shows slight wear from frequent access.",
            "You notice the safe is bolted to the floor - serious security measures.",
            "The safe's door seal is intact - it's been properly maintained.",
            "The safe's finish is scratch-resistant - quality construction.",
            "This safe has clearly been chosen for more than just document storage.",
            "The safe's placement suggests it's meant to be found by those who know where to look.",
            "The safe's size suggests it holds more than just papers - valuable assets within."
        ],
        
        "notepad": [
            "A yellow legal notepad filled with handwritten notes and doodles.",
            "The notepad shows various handwriting styles - multiple people have contributed.",
            "You notice phone numbers and email addresses - important business contacts.",
            "The notepad's pages are slightly coffee-stained - authentic office life.",
            "The notepad has several pages torn out - active note-taking in progress.",
            "The handwriting suggests someone who writes quickly but legibly.",
            "This notepad contains the raw material of business decisions and brainstorming.",
            "The notepad's spiral binding is bent - it's been carried around and used frequently."
        ],
        
        "bookshelf": [
            "A sturdy wooden bookshelf filled with business literature and personal interests.",
            "The books are organized by both subject and size - methodical arrangement.",
            "You notice some books have bookmarks in them - active reading in progress.",
            "The bookshelf's shelves are slightly bowed under the weight of knowledge.",
            "The books show varying degrees of wear - favorites and references identified.",
            "The bookshelf's wood finish matches the desk furniture - coordinated office design.",
            "This bookshelf contains both professional resources and personal growth materials.",
            "The bookshelf's organization suggests someone who values both knowledge and order."
        ],
        
        "bookshelf_0_shelf_0": [
            "The top shelf contains leather-bound classics and prestigious business books.",
            "You notice a collection of leadership books with worn spines - frequently referenced.",
            "The books are arranged alphabetically by author - someone's very organized.",
            "This shelf holds the most impressive titles - clearly for show and substance.",
            "You spot several first editions - this collector values quality over quantity.",
            "The books on this shelf show minimal wear - more for decoration than daily use.",
            "This shelf contains the kind of books that impress visitors and clients.",
            "The arrangement suggests someone who wants to project intellectual authority."
        ],
        
        "bookshelf_0_shelf_1": [
            "This shelf holds technical manuals and industry reference materials.",
            "You notice several books with sticky notes marking important pages.",
            "The books here show more wear than the shelf above - these are actually used.",
            "This shelf contains the practical knowledge that keeps the business running.",
            "You spot several certifications and professional guides - continuous learning.",
            "The books here are more functional than decorative - working references.",
            "This shelf contains the tools of the trade - essential industry knowledge.",
            "The arrangement suggests someone who stays current in their field."
        ],
        
        "bookshelf_0_shelf_2": [
            "This middle shelf holds personal development and psychology books.",
            "You notice books about productivity and leadership - self-improvement focus.",
            "The books here show moderate wear - regular but careful reading.",
            "This shelf contains materials for personal and professional growth.",
            "You spot several bestselling business authors - keeping up with trends.",
            "The books suggest someone invested in becoming a better leader and person.",
            "This shelf reveals the owner's interest in understanding human behavior.",
            "The selection shows someone who believes in continuous self-improvement."
        ],
        
        "bookshelf_0_shelf_3": [
            "The bottom shelf holds oversized books and photo albums.",
            "You notice several coffee table books about art and architecture.",
            "This shelf contains items that are too large for the shelves above.",
            "You spot family photo albums with worn bindings - treasured memories.",
            "The books here suggest interests beyond business - cultured and well-rounded.",
            "This shelf holds the personal treasures that don't fit the professional narrative.",
            "The arrangement shows someone with diverse interests and rich personal life.",
            "This bottom shelf reveals the human side behind the professional facade."
        ],
        
        "secret_bookshelf_shelf_0": [
            "This top shelf contains mysterious leather-bound volumes with no titles.",
            "You notice the books here have an unusual quality - they're not what they seem.",
            "This shelf holds books that appear to be decorative props.",
            "The books have uniform bindings - clearly chosen for appearance over content.",
            "You notice one book is slightly out of place - perhaps it's the trigger.",
            "This shelf contains the illusion of knowledge rather than actual books.",
            "The arrangement suggests someone who values appearances and secrets.",
            "These books might be hollowed out - perfect hiding places."
        ],
        
        "secret_bookshelf_shelf_1": [
            "This shelf holds antique-looking books with faded gold lettering.",
            "You notice the books here are arranged too perfectly - staged for effect.",
            "This shelf contains props that create the illusion of a working library.",
            "The books have a uniform age - clearly purchased together for decoration.",
            "You spot one book that looks newer than the others - the trigger mechanism.",
            "This shelf maintains the secret bookshelf's cover as a legitimate library.",
            "The arrangement suggests attention to detail in maintaining the deception.",
            "These books serve a dual purpose - decoration and concealment."
        ],
        
        "secret_bookshelf_shelf_2": [
            "This shelf holds legal texts and reference volumes.",
            "You notice these books are actually real - mixed in with the props.",
            "This shelf contains legitimate reading material among the decoys.",
            "The books here show some wear - actually read and referenced.",
            "You spot tax codes and business law texts - practical resources.",
            "This shelf suggests someone who needs quick access to legal references.",
            "The mix of real and fake books creates perfect camouflage.",
            "This shelf contains the knowledge that might be needed in a hurry."
        ],
        
        "secret_bookshelf_shelf_3": [
            "The bottom shelf holds technical manuals and engineering texts.",
            "You notice books about mechanics and construction - relevant to the secret door.",
            "This shelf contains knowledge about how things work - fitting for a secret mechanism.",
            "The books here are well-used and practical - not for show.",
            "You spot books about home security and safe construction - preparation.",
            "This shelf reveals the practical mind behind the secret bookshelf design.",
            "The selection suggests someone who plans carefully and executes precisely.",
            "These books might contain the very principles used to create this hidden room."
        ],
        
        "bookshelf_2_shelf_0": [
            "This top shelf holds financial and investment books.",
            "You notice titles about market analysis and portfolio management.",
            "The books here show sophisticated understanding of finance.",
            "This shelf contains the knowledge that builds and maintains wealth.",
            "You spot several economic texts and market histories - deep understanding.",
            "The books suggest someone who manages money wisely and professionally.",
            "This shelf reveals the financial acumen behind the business success.",
            "The selection shows someone who understands both theory and practice of finance."
        ],
        
        "bookshelf_2_shelf_1": [
            "This shelf holds technology and innovation books.",
            "You notice books about digital transformation and future trends.",
            "The books here suggest someone forward-thinking and tech-savvy.",
            "This shelf contains knowledge about staying current in a digital world.",
            "You spot books about AI and automation - preparing for the future.",
            "The selection suggests someone who embraces technological change.",
            "This shelf reveals the innovative mindset behind business strategy.",
            "These books show someone who understands technology's role in modern business."
        ],
        
        "bookshelf_2_shelf_2": [
            "This shelf holds marketing and branding books.",
            "You notice books about consumer psychology and brand strategy.",
            "The books here show understanding of how to build and maintain reputation.",
            "This shelf contains knowledge about reaching and influencing people.",
            "You spot classic marketing texts alongside modern digital marketing guides.",
            "The selection suggests someone who knows how to position and sell effectively.",
            "This shelf reveals the marketing mind behind the business's public face.",
            "These books show someone who understands both traditional and digital marketing."
        ],
        
        "bookshelf_2_shelf_3": [
            "The bottom shelf holds biographies of successful business leaders.",
            "You notice books about entrepreneurs and industry pioneers.",
            "This shelf contains inspiration from those who've already succeeded.",
            "The books here show someone learning from the best in the business.",
            "You spot biographies of tech founders and traditional business leaders.",
            "This shelf suggests someone who studies success to replicate it.",
            "The selection reveals admiration for innovation and leadership excellence.",
            "These books show someone who believes in learning from others' experiences."
        ],
        
        "bookshelf_3_shelf_0": [
            "This top shelf holds fiction and literature for relaxation.",
            "You notice classic novels and literary fiction - escape from business pressures.",
            "The books here show someone who values culture and storytelling.",
            "This shelf contains the mental escape from the stresses of work.",
            "You spot award-winning novels and critically acclaimed literature.",
            "The selection suggests someone with refined literary tastes.",
            "This shelf reveals the need for balance between work and cultural enrichment.",
            "These books show someone who understands the importance of mental breaks."
        ],
        
        "bookshelf_3_shelf_1": [
            "This shelf holds history books and biographies.",
            "You notice books about different eras and historical figures.",
            "The books here suggest someone interested in learning from the past.",
            "This shelf contains perspective gained from understanding history.",
            "You spot military history and political biographies - leadership lessons.",
            "The selection suggests someone who believes history repeats itself.",
            "This shelf reveals the historical context behind current business decisions.",
            "These books show someone who understands the value of historical perspective."
        ],
        
        "bookshelf_3_shelf_2": [
            "This shelf holds travel books and photography collections.",
            "You notice books about exotic destinations and cultural experiences.",
            "The books here suggest someone with wanderlust and global perspective.",
            "This shelf contains dreams of future adventures and past travels.",
            "You spot photography books showing beautiful landscapes and cityscapes.",
            "The selection suggests someone who appreciates beauty and different cultures.",
            "This shelf reveals the desire to explore beyond the office walls.",
            "These books show someone who values experiences over material possessions."
        ],
        
        "bookshelf_3_shelf_3": [
            "The bottom shelf holds hobbies and personal interest books.",
            "You notice books about cooking, gardening, and other recreational activities.",
            "The books here show someone with diverse interests beyond work.",
            "This shelf contains the activities that provide work-life balance.",
            "You spot books about wine collecting and gourmet cooking - refined tastes.",
            "The selection suggests someone who cultivates personal interests seriously.",
            "This shelf reveals the well-rounded personality behind the professional.",
            "These books show someone who understands the importance of personal fulfillment."
        ],
        
        "pen_0": [
            "A blue ballpoint pen with the company logo, slightly chewed on the cap.",
            "The pen writes smoothly despite obvious signs of nervous chewing.",
            "You notice the ink is running low - this pen gets used frequently.",
            "The pen's clip is slightly bent from being carried in pockets.",
            "This pen has clearly been the trusted tool for countless signatures.",
            "The pen shows wear patterns that suggest right-handed use.",
            "This pen has probably signed more documents than most people see in a lifetime.",
            "The pen's comfortable grip suggests it was chosen for long writing sessions."
        ],
        
        "pen_1": [
            "A red ballpoint pen, perfect for editing and marking important documents.",
            "The pen's tip shows heavy use - someone's been doing lots of corrections.",
            "You notice the ink is vibrant and fresh - recently replaced.",
            "The pen's body is pristine compared to the blue one - used less frequently.",
            "This pen has clearly been the tool for important annotations and edits.",
            "The pen's precision tip suggests someone who values accuracy.",
            "This pen has probably marked up countless contracts and proposals.",
            "The pen's condition suggests it's brought out for important corrections only."
        ],
        
        "pen_2": [
            "A black fountain pen with elegant gold trim, clearly a premium writing instrument.",
            "The pen's nib shows fine wear - someone who appreciates quality writing tools.",
            "You notice the pen is carefully maintained - cleaned and stored properly.",
            "The pen's weight suggests quality materials and craftsmanship.",
            "This pen is clearly reserved for special documents and important signatures.",
            "The pen's elegant design suggests someone with refined tastes.",
            "This pen has probably signed the most important deals and agreements.",
            "The pen's condition shows it's treasured and well-cared-for."
        ],
        
        "shredder": [
            "A heavy-duty paper shredder that's clearly seen its share of confidential documents.",
            "The shredder's bin is full of cross-cut paper fragments - recent activity.",
            "You notice the shredder has multiple security settings - serious document destruction.",
            "The shredder's motor housing is warm - it's been used recently.",
            "This shredder suggests someone who values privacy and security.",
            "The shredder's cutting blades are well-maintained - regular oiling and cleaning.",
            "You spot the shredder has jam protection - quality equipment for important work.",
            "The shredder's placement suggests it's used frequently but kept out of sight."
        ],
        
        "armchair": [
            "A plush armchair that invites you to sit and stay awhile.",
            "The chair's upholstery shows a subtle wear pattern where people lean back to contemplate.",
            "One armrest has a faint ring stain from countless coffee mugs during reading sessions.",
            "The chair sits at the perfect angle for both conversation and solitude.",
            "You notice the cushion maintains its shape despite regular use - quality foam.",
            "The chair's fabric has a sophisticated texture that feels expensive to the touch.",
            "This chair has positioned to take advantage of the room's natural light.",
            "The chair's sturdy construction suggests it's been here through multiple office redesigns."
        ],
        
        "tv": [
            "A large flat-screen TV that's currently displaying a serene nature documentary.",
            "The TV is mounted at the perfect viewing height for someone sitting on the sofa.",
            "You notice the screen is completely dust-free - someone cleans it regularly.",
            "The TV's speakers are surprisingly good for a built-in system - quality entertainment.",
            "The TV has minimal bezels, creating an immersive viewing experience.",
            "A streaming device is hidden behind, suggesting someone who values clean aesthetics.",
            "The TV's reflections show it's positioned to avoid glare from the windows.",
            "This TV has clearly been chosen for both casual viewing and impressive presentations."
        ],
        
        "floor_lamp": [
            "An elegant floor lamp that provides ambient lighting for the sitting area.",
            "The lamp's extended arm creates a perfect pool of light over the coffee table.",
            "You notice the lamp has a dimmer switch - someone values adjustable atmosphere.",
            "The lamp's weighted base ensures stability even when fully extended.",
            "The lamp's shade diffuses light perfectly, creating a warm, inviting glow.",
            "The lamp's cord is neatly tucked along the baseboard - attention to detail matters here.",
            "The lamp's height creates visual balance with the surrounding furniture.",
            "This lamp clearly serves both functional and decorative purposes in the room's design."
        ]
    };
    
    // Return descriptions for the object, or generic descriptions if not found
    return descriptionSets[objName] || [
        "This object sits quietly, waiting to be discovered.",
        "It has a certain quality that draws your attention.",
        "There's something familiar about this item, though you can't quite place it.",
        "The object seems to have its own story to tell.",
        "You wonder about the significance of this particular item.",
        "There's more to this object than meets the eye.",
        "The item seems to belong here, yet stands out in some way.",
        "You have a feeling this object might be important somehow."
    ];
}

// Check if an object has cycling descriptions available
function hasCyclingDescriptions(objName) {
    const descriptions = getDescriptionsForObject(objName);
    return descriptions.length > 1;
}

// Export the cycling description system
export {
    getNextDescription,
    resetDescriptionCycle,
    hasCyclingDescriptions,
    getDescriptionState
};