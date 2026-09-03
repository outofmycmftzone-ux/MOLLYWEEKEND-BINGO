let player1 = {};
let player2 = {};

let currentPlayer = 0;
let board = [];
let completed = new Array(25).fill(false);
let currentSquare = -1;
let currentPrompt = null;
let usedPrompts = [];

const lines = [
    [0,1,2,3,4],
    [5,6,7,8,9],
    [10,11,12,13,14],
    [15,16,17,18,19],
    [20,21,22,23,24],
    [0,5,10,15,20],
    [1,6,11,16,21],
    [2,7,12,17,22],
    [3,8,13,18,23],
    [4,9,14,19,24],
    [0,6,12,18,24],
    [4,8,12,16,20]
];

fetch("prompts.json")
.then(response => {
    if (!response.ok) {
        throw new Error("Prompts failed to load");
    }
    return response.json();
})
.then(data => {
    window.prompts = data;
})
.catch(error => {
    console.error(error);
});

function startGame() {

    const name1 =
        document.getElementById("player1Name").value.trim() || "Player 1";

    const name2 =
        document.getElementById("player2Name").value.trim() || "Player 2";

    player1 = {
        name:name1,
        gender:document.getElementById("player1Gender").value
    };

    player2 = {
        name:name2,
        gender:document.getElementById("player2Gender").value
    };

    currentPlayer = 0;

    board = new Array(25).fill(false);
    completed = new Array(25).fill(false);
    currentSquare = -1;
    currentPrompt = null;
    usedPrompts = [];

    document.getElementById("setup").style.display = "none";
    document.getElementById("game").style.display = "block";

    renderBoard();
    updateTurn();

    document.getElementById("promptText").textContent = "?";
    document.getElementById("promptText").className = "prompt-hidden";

    document.getElementById("promptButtons").style.display = "none";
    document.getElementById("drawButton").style.display = "block";
    document.getElementById("gameStatus").textContent = "";
}

function getCurrentPlayer() {
    return currentPlayer === 0 ? player1 : player2;
}

function updateTurn() {

    document.getElementById("currentPlayer").textContent =
        getCurrentPlayer().name;
}

function getAvailableSquares() {

    const available = [];

    for (let i = 0; i < 25; i++) {
        if (!completed[i]) {
            available.push(i);
        }
    }

    return available;
}

function getLineProgress(index) {

    let highest = 0;

    for (const line of lines) {

        if (!line.includes(index)) {
            continue;
        }

        let count = 0;

        line.forEach(square => {
            if (completed[square]) {
                count++;
            }
        });

        if (count > highest) {
            highest = count;
        }
    }

    return highest;
}

function getSquareWeight(index) {

    const progress = getLineProgress(index);

    if (progress >= 4) {
        return 0.03;
    }

    if (progress === 3) {
        return 0.2;
    }

    if (progress === 2) {
        return 0.65;
    }

    return 1;
}

function chooseSquare() {

    const available = getAvailableSquares();

    if (available.length === 0) {
        return -1;
    }

    const weighted = [];

    available.forEach(index => {

        const weight = getSquareWeight(index);

        const copies = Math.max(
            1,
            Math.round(weight * 100)
        );

        for (let i = 0; i < copies; i++) {
            weighted.push(index);
        }
    });

    return weighted[
        Math.floor(Math.random() * weighted.length)
    ];
}

function getPromptPool() {

    const player = getCurrentPlayer();

    if (!window.prompts) {
        return [];
    }

    return window.prompts.filter(prompt => {

        if (usedPrompts.includes(prompt.id)) {
            return false;
        }

        return (
            prompt.target === "both" ||
            prompt.target === player.gender
        );
    });
}

function choosePrompt() {

    let pool = getPromptPool();

    if (pool.length === 0) {

        usedPrompts = [];

        pool = window.prompts.filter(prompt => {

            const player = getCurrentPlayer();

            return (
                prompt.target === "both" ||
                prompt.target === player.gender
            );
        });
    }

    if (pool.length === 0) {
        return null;
    }

    const prompt =
        pool[Math.floor(Math.random() * pool.length)];

    usedPrompts.push(prompt.id);

    return prompt;
}

function drawPrompt() {

    if (!window.prompts) {
        document.getElementById("gameStatus").textContent =
            "Prompts are still loading.";
        return;
    }

    if (currentSquare !== -1) {
        return;
    }

    const square = chooseSquare();

    if (square === -1) {
        return;
    }

    const prompt = choosePrompt();

    if (!prompt) {
        return;
    }

    currentSquare = square;
    currentPrompt = prompt;

    renderBoard();

    const promptText =
        document.getElementById("promptText");

    promptText.textContent = prompt.text;
    promptText.className = "";

    document.getElementById("promptButtons").style.display = "block";
    document.getElementById("drawButton").style.display = "none";
}

function completeTask() {

    if (currentSquare === -1) {
        return;
    }

    completed[currentSquare] = true;

    currentSquare = -1;
    currentPrompt = null;

    document.getElementById("promptText").textContent = "?";
    document.getElementById("promptText").className = "prompt-hidden";

    document.getElementById("promptButtons").style.display = "none";

    renderBoard();

    if (checkWin()) {
        document.getElementById("drawButton").style.display = "none";
        return;
    }

    currentPlayer =
        currentPlayer === 0 ? 1 : 0;

    updateTurn();

    document.getElementById("drawButton").style.display = "block";
}

function skipTask() {

    if (currentSquare === -1) {
        return;
    }

    currentSquare = -1;
    currentPrompt = null;

    document.getElementById("promptText").textContent = "?";
    document.getElementById("promptText").className = "prompt-hidden";

    document.getElementById("promptButtons").style.display = "none";

    renderBoard();

    currentPlayer =
        currentPlayer === 0 ? 1 : 0;

    updateTurn();

    document.getElementById("drawButton").style.display = "block";
}

function renderBoard() {

    const boardElement =
        document.getElementById("board");

    boardElement.innerHTML = "";

    for (let i = 0; i < 25; i++) {

        const cell =
            document.createElement("div");

        cell.className = "cell";

        if (completed[i]) {
            cell.classList.add("completed");
            cell.textContent = "✓";
        }
        else if (i === currentSquare) {
            cell.classList.add("selected");
            cell.textContent = "!";
        }
        else {
            cell.textContent = "?";
        }

        boardElement.appendChild(cell);
    }
}

function checkWin() {

    for (const line of lines) {

        if (
            line.every(index =>
                completed[index]
            )
        ) {

            const cells =
                document.querySelectorAll(".cell");

            line.forEach(index => {
                cells[index].classList.add("win");
            });

            document.getElementById("gameStatus").textContent =
                "BINGO! " +
                player1.name +
                " & " +
                player2.name +
                " win!";

            return true;
        }
    }

    return false;
}

function newGame() {

    document.getElementById("game").style.display = "none";
    document.getElementById("setup").style.display = "block";

    document.getElementById("gameStatus").textContent = "";
}
