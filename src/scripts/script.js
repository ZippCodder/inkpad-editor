// Set initial canvas settings...

import "../styles/style.css";

let state = {
    width: 500,
    height: 500,
    transform: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        scale: 1,
        rotation: 0
    },
    translation: {
        offsetX: 0,
        offsetY: 0
    },
    startCoord: {
        x: undefined,
        y: undefined
    },
    endCoord: {
        x: undefined,
        y: undefined
    },
    radius: 0,
    mode: 0,
    searching: false,
    palette: [
        "#E74C3C",
        "#E67E22",
        "#F1C40F",
        "#2ECC71",
        "#1ABC9C",
        "#3498DB",
        "#9B59B6"
    ],
    strokeColor: "#000000",
    lineWidth: 5,
    mousedown: false,
    drawn: false,
    erase: false,
    actionsStack: [],
    actionIndex: -1,
    prevMode: 0,
    ctrl: false, 
    touchScaleDistance: undefined, 
    touchScale: undefined,
    touchMovementDifference: {x: undefined, y: undefined}
};


const colorCode = document.querySelector(".color__code");
colorCode.innerText = state.strokeColor;

const canvas = document.getElementById("area"),
    ctx = canvas.getContext("2d", {
        willReadFrequently: true
    });

const stateCanvas = new OffscreenCanvas(state.width, state.height),
    sctx = stateCanvas.getContext("2d");
sctx.fillStyle = "white";

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const info = document.querySelector(".info__p");


window.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        document.querySelector(".loader").style.opacity = "0.0";
        document.querySelector(".loader").style.pointerEvents = "none";
    }, 5000);
});

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    state.transform.x = window.innerWidth / 2;
    state.transform.y = window.innerHeight / 2;

    drawCanvas();
});

window.addEventListener("beforeunload", (e) => {
    if (state.actionsStack.length > 1) {
        e.preventDefault();
        e.returnValue = true;
    }
});

window.addEventListener("keydown", (e) => {
    switch (e.key) {
        case "+": {
            if (state.transform.scale < 4) state.transform.scale += 0.1;
        };
        break;
        case "-": {
            if (state.transform.scale > 0.2) state.transform.scale -= 0.1;
        };
        break;
        case "z": {
            if (state.ctrl) undo();
        };
        break;
        case "x": {
            if (state.ctrl) redo();
        };
        break;
        case "Control": {
            state.ctrl = true;
        };
        break;
    }

    drawCanvas();
});

window.addEventListener("keyup", (e) => {
    if (e.key === "Control") {
        state.ctrl = false;
    }
});

function RGBtoHEX(r, g, b) {
    r = r.toString(16).length > 1 ? r.toString(16) : "0" + r.toString(16);
    g = g.toString(16).length > 1 ? g.toString(16) : "0" + g.toString(16);
    b = b.toString(16).length > 1 ? b.toString(16) : "0" + b.toString(16);
    return "#" + r + g + b;
}

document.querySelector("#fullscreen").onclick = () => {
    document.body.requestFullscreen();
};

document.querySelector("#zoom-in").onclick = () => {
    if (state.transform.scale < 4) state.transform.scale += 0.1;
    drawCanvas();
};

document.querySelector("#zoom-out").onclick = () => {
    if (state.transform.scale > 0.2) state.transform.scale -= 0.1;
    drawCanvas();
};

function drawCanvas() {
    ctx.fillStyle = "white";
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

    ctx.fillRect((state.transform.x - ((state.width * state.transform.scale) / 2)), (state.transform.y - ((state.height * state.transform.scale) / 2)), state.width * state.transform.scale, state.height * state.transform.scale);

    ctx.drawImage(stateCanvas, (state.transform.x - ((state.width * state.transform.scale) / 2)), (state.transform.y - ((state.height * state.transform.scale) / 2)), state.width * state.transform.scale, state.height * state.transform.scale);
}

drawCanvas();

function mouseDownEvent(mouseX, mouseY, e) {
    state.mousedown = true;

    switch (state.mode) {
        case 0: {
            ctx.beginPath();
            ctx.moveTo(mouseX, mouseY);

            let lineX = mouseX - (state.transform.x - state.width / 2);
            let lineY = mouseY - (state.transform.y - state.height / 2);

            lineX = ((lineX - state.width / 2) / state.transform.scale) + state.width / 2;
            lineY = ((lineY - state.height / 2) / state.transform.scale) + state.height / 2;

            sctx.beginPath();
            sctx.moveTo(lineX, lineY);
        };
        break;
        case 1: {
            state.middleCoord = {
                x: mouseX,
                y: mouseY
            };

            state.translation.offsetX = state.transform.x - state.middleCoord.x;
            state.translation.offsetY = state.transform.y - state.middleCoord.y;
        };
        break;
        case 2: {
            state.searching = true;
        };
        break;
    }
     state.startCoord.x = mouseX;
     state.startCoord.y = mouseY;

     if (e.touches && e.touches.length === 2) {
      state.touchScaleDistance = Math.sqrt(Math.pow(e.touches[0].pageX - e.touches[1].pageX, 2) + Math.pow(e.touches[0].pageY - e.touches[1].pageY, 2));
      state.touchScale = state.transform.scale;

      let touchCenterPoint = {x: (e.touches[0].pageX + e.touches[1].pageX)/2, y: (e.touches[0].pageY + e.touches[1].pageY)/2};

      state.touchMovementDifference = {x: touchCenterPoint.x - state.transform.x, y: touchCenterPoint.y - state.transform.y};
     }
}

canvas.addEventListener("mousedown", (e) => {
 mouseDownEvent(e.pageX, e.pageY, e);
});
canvas.addEventListener("touchstart", (e) => {
 mouseDownEvent(e.touches[0].pageX, e.touches[0].pageY, e);
});

function mouseUpEvent(mouseX, mouseY) {
    switch (state.mode) {
        case 0: {
            if (state.drawn) pushAction();
        };
        break;
        case 2: {
            state.searching = false;
            state.mode = state.prevMode;
            dropper.style.background = "rgba(0,0,0,0.6)";

            drawCanvas();

            if (state.colorPicked) {
                let color = RGBtoHEX(...state.colorPicked);
                colorCode.innerText = color;
                ctx.strokeStyle = color;
                sctx.strokeStyle = color;
                state.strokeColor = color;
                pickr.setColor(color);
            }
        };
        break;
        case 3: {
            drawCanvas();

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.lineCap = "round";
            ctx.strokeStyle = state.strokeColor;
            ctx.moveTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.stroke();

            let startX = state.startCoord.x - (state.transform.x - state.width / 2);
            let startY = state.startCoord.y - (state.transform.y - state.height / 2);
            startX = ((startX - state.width / 2) / state.transform.scale) + state.width / 2;
            startY = ((startY - state.height / 2) / state.transform.scale) + state.height / 2;

            let endX = state.endCoord.x - (state.transform.x - state.width / 2);
            let endY = state.endCoord.y - (state.transform.y - state.height / 2);
            endX = ((endX - state.width / 2) / state.transform.scale) + state.width / 2;
            endY = ((endY - state.height / 2) / state.transform.scale) + state.height / 2;

            sctx.beginPath();
            sctx.lineWidth = state.lineWidth;
            sctx.lineCap = "round";
            sctx.strokeStyle = state.strokeColor;
            sctx.moveTo(startX, startY);
            sctx.lineTo(endX, endY);
            sctx.stroke();

            state.startCoord.x = undefined;
            state.startCoord.y = undefined;
            state.endCoord.x = undefined;
            state.endCoord.y = undefined;

            if (state.drawn) pushAction();
        }
        break;
        case 4: {
            drawCanvas();

            state.endCoord.x = mouseX;
            state.endCoord.y = mouseY;

            state.radius = Math.round(
                Math.sqrt(
                    Math.pow(state.startCoord.x - state.endCoord.x, 2) +
                    Math.pow(state.startCoord.y - state.endCoord.y, 2)
                )
            );

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.strokeStyle = state.strokeColor;
            ctx.lineCap = "round";
            ctx.arc(
                state.startCoord.x / state.transform.scale,
                state.startCoord.y / state.transform.scale,
                state.radius / state.transform.scale,
                0,
                2 * Math.PI
            );
            ctx.stroke();


            let startX = state.startCoord.x - (state.transform.x - state.width / 2);
            let startY = state.startCoord.y - (state.transform.y - state.height / 2);

            startX = ((startX - state.width / 2) / state.transform.scale) + state.width / 2;
            startY = ((startY - state.height / 2) / state.transform.scale) + state.height / 2;

            sctx.beginPath();
            sctx.lineWidth = state.lineWidth;
            sctx.strokeStyle = state.strokeColor;
            sctx.lineCap = "round";
            sctx.arc(
                startX,
                startY,
                state.radius / state.transform.scale,
                0,
                2 * Math.PI
            );
            sctx.stroke();

            state.startCoord.x = undefined;
            state.startCoord.y = undefined;
            state.endCoord.x = undefined;
            state.endCoord.y = undefined;

            if (state.drawn) pushAction();
        };
        break;
        case 5: {
            drawCanvas();

            state.endCoord.x = mouseX;
            state.endCoord.y = mouseY;

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.strokeStyle = state.strokeColor;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.moveTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.lineTo(state.startCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.lineTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.stroke();

            sctx.beginPath();
            sctx.lineWidth = state.lineWidth;
            sctx.strokeStyle = state.strokeColor;
            sctx.lineJoin = "round";
            sctx.lineCap = "round";


            let startX = state.startCoord.x - (state.transform.x - state.width / 2);
            let startY = state.startCoord.y - (state.transform.y - state.height / 2);
            startX = ((startX - state.width / 2) / state.transform.scale) + state.width / 2;
            startY = ((startY - state.height / 2) / state.transform.scale) + state.height / 2;

            let endX = state.endCoord.x - (state.transform.x - state.width / 2);
            let endY = state.endCoord.y - (state.transform.y - state.height / 2);
            endX = ((endX - state.width / 2) / state.transform.scale) + state.width / 2;
            endY = ((endY - state.height / 2) / state.transform.scale) + state.height / 2;

            sctx.moveTo(startX, startY);
            sctx.lineTo(endX, startY);
            sctx.lineTo(endX, endY);
            sctx.lineTo(startX, endY);
            sctx.lineTo(startX, startY);
            sctx.stroke();

            state.startCoord.x = undefined;
            state.startCoord.y = undefined;
            state.endCoord.x = undefined;
            state.endCoord.y = undefined;

            if (state.drawn) pushAction();
        };
        break;
    }
    state.mousedown = false;
    drawCanvas();
}

window.addEventListener("mouseup", (e) => {
 mouseUpEvent(e.pageX, e.pageY);
});
window.addEventListener("touchend", (e) => {
 mouseUpEvent(state.endCoord.x, state.endCoord.y);
});

function mouseMoveEvent(mouseX, mouseY, e) {
    if (!state.mousedown) return;

    if (e.touches && e.touches.length === 2) {
     let currentTouchScaleDistance = Math.sqrt(Math.pow(e.touches[0].pageX - e.touches[1].pageX, 2) + Math.pow(e.touches[0].pageY - e.touches[1].pageY, 2)), result = (state.touchScale - 1) + (currentTouchScaleDistance / state.touchScaleDistance);

     let touchMovementCurrent = {x: (e.touches[0].pageX + e.touches[1].pageX)/2, y: (e.touches[0].pageY + e.touches[1].pageY)/2};

     state.transform.x = touchMovementCurrent.x - state.touchMovementDifference.x;
     state.transform.y = touchMovementCurrent.y - state.touchMovementDifference.y;
     
     if (result > 0.2 && result < 5) state.transform.scale = result;

     drawCanvas();
   
     return;
    }

    switch (state.mode) {
        case 0: {
            ctx.scale(state.transform.scale, state.transform.scale);

            ctx.strokeStyle = state.strokeColor;
            ctx.lineWidth = state.lineWidth;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.lineTo(mouseX / state.transform.scale, mouseY / state.transform.scale);
            ctx.stroke();

            ctx.resetTransform();


            let lineX = mouseX - (state.transform.x - state.width / 2);
            let lineY = mouseY - (state.transform.y - state.height / 2);

            lineX = ((lineX - state.width / 2) / state.transform.scale) + state.width / 2;
            lineY = ((lineY - state.height / 2) / state.transform.scale) + state.height / 2;

            sctx.strokeStyle = state.strokeColor;
            sctx.lineWidth = state.lineWidth;
            sctx.lineCap = "round";
            sctx.lineJoin = "round";
            sctx.lineTo(lineX, lineY);
            sctx.stroke();

            sctx.resetTransform();
        };
        break;
        case 1: {
            state.middleCoord = {
                x: mouseX,
                y: mouseY
            };

            state.transform.x = state.middleCoord.x + state.translation.offsetX;
            state.transform.y = state.middleCoord.y + state.translation.offsetY;

            drawCanvas();
        };
        break;
        case 2: {
            drawCanvas();

            let imgData = ctx.getImageData(mouseX, mouseY, 1, 1);
            state.colorPicked = Object.values(imgData.data);

            ctx.beginPath();
            ctx.arc(mouseX, mouseY - 50, 20, 0, 2 * Math.PI);
            ctx.fillStyle = `rgba(${state.colorPicked[0]},${state.colorPicked[1]},${state.colorPicked[2]},${state.colorPicked[3]})`;
            ctx.strokeStyle = "black";
            ctx.lineWidth = "1";
            ctx.fill();
            ctx.stroke();
        };
        break;
        case 3: {
            drawCanvas();

            ctx.scale(state.transform.scale, state.transform.scale);

            state.endCoord.x = mouseX;
            state.endCoord.y = mouseY;

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.strokeStyle = state.strokeColor;
            ctx.lineCap = "round";
            ctx.moveTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.stroke();

            ctx.resetTransform();
        }
        break;
        case 4: {
            drawCanvas();

            ctx.scale(state.transform.scale, state.transform.scale);

            state.endCoord.x = mouseX;
            state.endCoord.y = mouseY;

            state.radius = Math.round(
                Math.sqrt(
                    Math.pow(state.startCoord.x - state.endCoord.x, 2) +
                    Math.pow(state.startCoord.y - state.endCoord.y, 2)
                )
            );

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.strokeStyle = state.strokeColor;
            ctx.lineCap = "round";
            ctx.arc(
                state.startCoord.x / state.transform.scale,
                state.startCoord.y / state.transform.scale,
                state.radius / state.transform.scale,
                0,
                2 * Math.PI
            );
            ctx.stroke();

            ctx.resetTransform();
        };
        break;
        case 5: {
            drawCanvas();

            state.endCoord.x = mouseX;
            state.endCoord.y = mouseY;

            ctx.scale(state.transform.scale, state.transform.scale);

            ctx.beginPath();
            ctx.lineWidth = state.lineWidth;
            ctx.strokeStyle = state.strokeColor;
            ctx.lineJoin = "round";
            ctx.lineCap = "round";
            ctx.moveTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.lineTo(state.endCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.lineTo(state.startCoord.x / state.transform.scale, state.endCoord.y / state.transform.scale);
            ctx.lineTo(state.startCoord.x / state.transform.scale, state.startCoord.y / state.transform.scale);
            ctx.stroke();

            ctx.resetTransform();
        };
        break;
    }

    if (state.mode === 0 || state.mode === 3 || state.mode === 4 || state.mode === 5) state.drawn = true;
}

window.addEventListener("mousemove", (e) => {
 mouseMoveEvent(e.pageX, e.pageY, e);
});
window.addEventListener("touchmove", (e) => {
 mouseMoveEvent(e.touches[0].pageX, e.touches[0].pageY, e);
});

/* USER SETTINGS...*/

const pickr = Pickr.create({
    el: ".pickr",
    theme: "monolith", // or 'monolith', or 'nano'
    alwaysShow: true,
    autoReposition: true,
    defaultRepresentation: "HEX",
    appClass: ".color-picker",
    default: state.strokeColor,
    swatches: [
        "#E74C3C",
        "#E67E22",
        "#F1C40F",
        "#2ECC71",
        "#1ABC9C",
        "#3498DB",
        "#9B59B6",
        "#000000"
    ],
    components: {
        preview: true,
        hue: true,
        interaction: {
            input: true,
            save: true
        }
    }
});

pickr.on("change", (color) => {
    state.erase = false;
    eraser.style.background = "rgba(0,0,0,0.6)";

    color = `#${color.toHEXA().join("").toUpperCase()}`;
    colorCode.innerText = color;
    ctx.strokeStyle = color;
    sctx.strokeStyle = color;
    state.strokeColor = color;
});

// Enable color selection from canvas...

const dropper = document.querySelector(".dropper");
dropper.addEventListener("click", () => {
    dropper.style.background = "dodgerblue";

    if (state.mode !== 2) state.prevMode = state.mode;
    state.mode = 2;
});

const tools = document.querySelector("#tools");
let toolsOpen = false;

tools.addEventListener("click", () => {
    if (!toolsOpen) {
        document.querySelector(".dropper").style.top = "4em";
        document.querySelector(".save").style.top = "8em";
        document.querySelector(".shapes").style.top = "12em";
        document.querySelector(".move").style.top = "16em";
        document.querySelector(".undo").style.top = "20em";
        document.querySelector(".redo").style.top = "24em";
        toolsOpen = true;
    } else {
        document.querySelector(".dropper").style.top = "0em";
        document.querySelector(".save").style.top = "0em";
        document.querySelector(".shapes").style.top = "0em";
        document.querySelector(".move").style.top = "0em";
        document.querySelector(".undo").style.top = "0em";
        document.querySelector(".redo").style.top = "0em";
        toolsOpen = false;
    }
});

const swatchesAdd = document.querySelector(".swatches__add");
const swatchesColors = document.querySelector(".swatches__colors");

state.palette.forEach((s) => {
    let color = s;
    let swatch = document.createElement("div");
    swatch.setAttribute("class", "swatches__colors__swatch");
    swatch.style.background = color;
    swatch.setAttribute("data-color", color);
    swatch.addEventListener("click", (e) => {

        state.erase = false;
        eraser.style.background = "rgba(0,0,0,0.6)";

        let c = swatch.getAttribute("data-color");
        colorCode.innerText = c;
        ctx.strokeStyle = c;
        sctx.strokeStyle = c;
        state.strokeColor = c;
        pickr.setColor(c);
    });
    swatchesColors.appendChild(swatch);
});

swatchesAdd.addEventListener("click", () => {
    if (swatchesColors.childNodes.length < 100) {
        if (!state.palette.includes(state.strokeColor)) {

            state.palette.push(state.strokeColor);
            let swatch = document.createElement("div");
            swatch.setAttribute("class", "swatches__colors__swatch");
            swatch.style.background = state.strokeColor;
            swatch.setAttribute("data-color", state.strokeColor);
            swatch.addEventListener("click", (e) => {
                let color = swatch.getAttribute("data-color");
                colorCode.innerText = color;
                ctx.strokeStyle = color;
                sctx.strokeStyle = color;
                state.strokeColor = color;
                pickr.setColor(color);
            });
            if (swatchesColors.hasChildNodes()) {
                swatchesColors.insertBefore(swatch, swatchesColors.childNodes[0]);
            } else {
                swatchesColors.appendChild(swatch);
            }
        } else {
            /* alert(
              "That color already exists! Please select another to add to your palette."
            ); */
        }
    } else {
        alert("Sorry, You have a limit of 100 custom colors!");
    }
});

// enable pen size changing...

const penInput = document.querySelector("#pen-input");
const penSizes = document.querySelectorAll(".pen__size");
let currentSize = document.querySelector(".pen__size--selected"); 

penSizes.forEach(size => {
 size.addEventListener("click", () => {
  state.lineWidth = size.getAttribute("data-size");
  penInput.value = size.getAttribute("data-size");

  size.classList.add("pen__size--selected");
  if (currentSize && size !== currentSize) currentSize.classList.remove("pen__size--selected");
  currentSize = size; 
 });
});

penInput.addEventListener("change", function() {
 state.lineWidth = penInput.value;
});

// Enable translation state.mode for desktop

const move = document.querySelector(".move");

move.addEventListener("click", () => {
    if (state.mode !== 1) {
        state.prevMode = (state.mode === 1) ? 0 : state.mode;
        state.mode = 1;
        move.style.background = "dodgerblue";
        disableShapes();
    } else {
        state.mode = (state.prevMode !== 1) ? state.prevMode : 0;
        move.style.background = "rgba(0,0,0,0.6)";
    }
});

// Enable eraser state.mode...

const eraser = document.querySelector(".eraser");
let previousColor;

eraser.addEventListener("click", () => {
    if (!state.erase) {
        previousColor = state.strokeColor;
        state.strokeColor = "white";
        state.erase = true;
        eraser.style.background = "dodgerblue";
    } else {
        state.strokeColor = previousColor;
        state.erase = false;
        eraser.style.background = "rgba(0,0,0,0.6)";
    }
});

// download image...
let saveModal = document.querySelector(".download");
let saveButton = document.querySelector("#save-button");
let url,
    Mtype = document.querySelector("#type");

Mtype.onchange = save;

document.querySelector(".save").onclick = toggleSave;

function toggleSave() {
    if (saveModal.style.display !== "flex") {
        saveModal.style.display = "flex";
        save();
        return;
    }

    saveModal.style.display = "none";
}

/// download canvas...

function save() {
    state.transform.x = window.innerWidth / 2;
    state.transform.y = window.innerHeight / 2;

    if (!Mtype.selectedIndex) {
        sctx.fillRect(0, 0, state.width, state.height);
    } else {
        sctx.clearRect(0, 0, state.width, state.height);
    }

    sctx.drawImage(state.actionsStack[state.actionIndex], 0, 0);

    drawCanvas();

    createImageBitmap(
        sctx.getImageData(0, 0, state.width, state.height)
    ).then((bm) => {
        stateCanvas
            .convertToBlob({
                type: (!Mtype.selectedIndex) ? "image/jpeg" : "image/png"
            })
            .then((blob) => {
                url = URL.createObjectURL(blob);
                saveButton.setAttribute("href", url);
                saveButton.setAttribute("download", titleDisplay.value);
                saveModal.style.display = "flex";
            })
            .catch((err) => {
                console.log(err);
            });
    });
}

function exitSave() {
    saveModal.style.display = "none";
    url = undefined;
}

document.querySelector("#save-modal-exit").onclick = exitSave;

// Shape functions...

let shapes = document.querySelector(".shapes");
let sOptions = document.querySelector(".shapes__options");
let shapesOpen = false;
let Line = document.querySelector(".line");
let Circle = document.querySelector(".circle");
let Square = document.querySelector(".square");

Line.onclick = line;  
Circle.onclick = circle;
Square.onclick = square; 

function disableShapes() {
    document.querySelectorAll(".shape").forEach((s) => {
        s.style.background = "rgba(0,0,0,0)";
    });
}

shapes.addEventListener("click", () => {
    move.style.background = "rgba(0,0,0,0.6)";

    if (!shapesOpen) {
        shapes.style.background = "dodgerblue";
        sOptions.style.display = "grid";
        shapesOpen = true;
    } else {
        sOptions.style.display = "none";
        shapes.style.background = "rgba(0,0,0,0.6)";
        shapesOpen = false;
        state.mode = 0;
        disableShapes();
    }
});

function line() {
    state.mode = 3;
    disableShapes();
    Line.style.background = "dodgerblue";
    dropper.style.background = "rgba(0,0,0,0.6)";
}

function circle() {
    state.mode = 4;
    disableShapes();
    Circle.style.background = "dodgerblue";
    dropper.style.background = "rgba(0,0,0,0.6)";
}

function square() {
    state.mode = 5;
    disableShapes();
    Square.style.background = "dodgerblue";
    dropper.style.background = "rgba(0,0,0,0.6)";
}


// Undo and redo functionality
const undoButton = document.querySelector(".undo");
const redoButton = document.querySelector(".redo");

function pushAction() {
    createImageBitmap(stateCanvas, 0, 0, state.width, state.height).then(currentAction => {

        if (state.actionIndex + 1 !== state.actionsStack.length) {
            state.actionsStack.splice(state.actionIndex + 1, state.actionsStack.length - state.actionIndex);
        }

        state.actionsStack.push(currentAction);
        state.actionIndex++;
        state.drawn = false;
    });
}

undoButton.onclick = undo;
redoButton.onclick = redo;

function undo() {
    if (state.actionIndex > 0) {
        sctx.clearRect(0, 0, state.width, state.height);

        state.actionIndex--;
        let newFrame = state.actionsStack[state.actionIndex];

        sctx.drawImage(newFrame, 0, 0, state.width, state.height);
        drawCanvas();
    }
}

function redo() {
    if (state.actionIndex < state.actionsStack.length - 1) {
        sctx.clearRect(0, 0, state.width, state.height);

        state.actionIndex++;
        let newFrame = state.actionsStack[state.actionIndex];

        sctx.drawImage(newFrame, 0, 0, state.width, state.height);
        drawCanvas();
    }
}

pushAction();

// document creation functionality

const documentModal = document.querySelector(".document");
const documentTitle = document.querySelector("#document-title");
const documentWidth = document.querySelector("#document-width");
const documentHeight = document.querySelector("#document-height");
const titleDisplay = document.querySelector("#info-title");
const createDocumentButton = document.querySelector("#create-document");
const newDocumentButton = document.querySelector("#new-document");
const documentExitButton = document.querySelector("#document-modal-exit");

newDocumentButton.onclick = function() {
  documentModal.style.display = "flex";
}

createDocumentButton.onclick = createDocument;
documentExitButton.onclick = exitDocument;

function exitDocument() {
  documentModal.style.display = "none";
}

function createDocument() {

    if (state.actionsStack.length === 1 || confirm("Your current work will be erased. Are sure you want to create a new document?")) {
        state = {
            width: documentWidth.value,
            height: documentHeight.value,
            transform: {
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                scale: 1,
                rotation: 0
            },
            translation: {
                offsetX: 0,
                offsetY: 0
            },
            startCoord: {
                x: undefined,
                y: undefined,
            },
            endCoord: {
                x: undefined,
                y: undefined
            },
            radius: 0,
            mode: 0,
            searching: false,
            palette: [
                "#E74C3C",
                "#E67E22",
                "#F1C40F",
                "#2ECC71",
                "#1ABC9C",
                "#3498DB",
                "#9B59B6"
            ],
            strokeColor: "#000000",
            lineWidth: 5,
            mousedown: false,
            erase: false,
            actionsStack: [],
            actionIndex: -1,
            prevMode: 0
        };

        stateCanvas.width = documentWidth.value;
        stateCanvas.height = documentHeight.value;
        sctx.clearRect(0, 0, stateCanvas.width, stateCanvas.height);
        sctx.fillStyle = "white";

        titleDisplay.value = documentTitle.value;
        documentTitle.value = "Untitled Artwork";
        documentWidth.value = 500;
        documentHeight.value = 500;

        pushAction();
    }
    exitDocument();
    drawCanvas();
}
