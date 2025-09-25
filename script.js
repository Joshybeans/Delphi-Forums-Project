const canvas = document.getElementById('mainCanvas');
const canvasCtx = canvas.getContext('2d');

class Vector2 {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
};

class MouseEvent {
    type;
    position;

    constructor(type, position) {
        this.type = type;
        this.position = position;
    }
};

class TextBox {
    position;
    size;
    text;
    margin = 10;
    bodyColor = '#000000';
    textColor = '#6600ff';
    children = [];
    visible = true;
    toggled = false;
    entered = false;

    constructor(position = new Vector2(0, 0), size = new Vector2(10, 10), text = '') { 
        this.position = position;
        this.size = size;
        this.text = text;
    }

    draw() {
        if(!this.visible) {
            return
        }
        let metrics
        let textSize
        canvasCtx.fillStyle = this.bodyColor;
        canvasCtx.fillRect(this.position.x, this.position.y, this.size.x, this.size.y);
        canvasCtx.fillStyle = this.textColor;
        canvasCtx.font = Math.min(this.size.x / 3, this.size.y / 3) + 'px Arial';
        metrics = canvasCtx.measureText(this.text);
        textSize = new Vector2(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
        canvasCtx.fillText(this.text, this.position.x + (this.size.x - Math.min(textSize.x, this.size.x - this.margin)) / 2, this.position.y + (this.size.y + textSize.y) / 2, this.size.x - this.margin);
    }

    containsPoint(point) {
        if(point.x >= this.position.x && point.x <= this.position.x + this.size.x && point.y >= this.position.y && point.y <= this.position.y + this.size.y) {
            return true;
        }
        return false;
    }

    isEntered() {
        if(!this.visible) {
            return;
        }

        this.entered = true;

        let color = hexToRGB(this.bodyColor);
        color[0] = Math.min(color[0] + 50, 255);
        color[1] = Math.min(color[1] + 50, 255);
        color[2] = Math.min(color[2] + 50, 255);
        this.bodyColor = RGBToHex(color);
    }

    isExited() {
        if(!this.visible) {
            return;
        }

        this.entered = false;

        let color = hexToRGB(this.bodyColor);
        color[0] = Math.max(color[0] - 50, 0);
        color[1] = Math.max(color[1] - 50, 0);
        color[2] = Math.max(color[2] - 50, 0);
        this.bodyColor = RGBToHex(color);
    }

    isPressed() {
        if(!this.visible) {
            return;
        }

        let color = hexToRGB(this.bodyColor);
        color[0] = Math.max(color[0] - 25, 0);
        color[1] = Math.max(color[1] - 25, 0);
        color[2] = Math.max(color[2] - 25, 0);
        this.bodyColor = RGBToHex(color);
    }

    isReleased() {
        if(!this.visible) {
            return;
        }

        if(this.toggled) {
            let color = hexToRGB(this.bodyColor);
            color[0] = Math.min(color[0] + 25, 255);
            color[1] = Math.min(color[1] + 25, 255);
            color[2] = Math.min(color[2] + 25, 255);
            this.bodyColor = RGBToHex(color);
        } else {
            this.bodyColor = '#000000';
        }
    }

    isClicked() {
        if(!this.visible) {
            return;
        }

        if(this.toggled) {
            this.toggled = false;
            this.bodyColor = '#000000';
            for(let item of this.children) {
                item.visible = false;
            }
        } else {
            this.toggled = true;
            this.bodyColor = '#66ff66';
            for(let item of this.children) {
                item.visible = true;
            }
        }
        
        this.isEntered();
    }

    addChild(item) {
        this.children.push(item);
    }
};

function hexToRGB(hexCode) {
    let colorArr = [];
    colorArr.push(parseInt(hexCode.slice(1, 3), 16));
    colorArr.push(parseInt(hexCode.slice(3, 5), 16));
    colorArr.push(parseInt(hexCode.slice(5, 7), 16));
    return colorArr;
}

function RGBToHex(colorArr) {
    let hexCode = '#';
    hexCode += colorArr[0].toString(16).padStart(2, '0');
    hexCode += colorArr[1].toString(16).padStart(2, '0');;
    hexCode += colorArr[2].toString(16).padStart(2, '0');;     
    return hexCode;
}


class Control {
    position;
    size;
    children = [];
    visible = true;

    constructor(position = new Vector2(0, 0), size = new Vector2(100, 100)) {
        this.position = position;
        this.size = size;
    }

    add(item) {
        this.children.push(item);
    }

    draw() {
        for(let i = 0; i < this.children.length; i++) {
            this.children[i].visible = this.visible;
            this.children[i].position.x = this.position.x;
            this.children[i].position.y = this.position.y;
        }
    }
};

class VBoxContainer extends Control {
    constructor(position = new Vector2(0, 0), size = new Vector2(100, 100)) {
        super(position, size);
    }
    draw() {
        for(let i = 0; i < this.children.length; i++) {
            this.children[i].visible = this.visible;
            this.children[i].position.y = this.size.y / this.children.length * i + this.position.y;
            this.children[i].position.x = this.position.x;
            this.children[i].size.y = this.size.y / this.children.length;
            this.children[i].size.x = this.size.x;
        }
    }
};

class HBoxContainer extends Control {
    constructor(position = new Vector2(0, 0), size = new Vector2(100, 100)) {
        super(position, size);
    }
    draw() {
        for(let i = 0; i < this.children.length; i++) {
            this.children[i].visible = this.visible;
            this.children[i].position.x = this.size.x / this.children.length * i + this.position.x;
            this.children[i].position.y = this.position.y;
            this.children[i].size.x = this.size.x / this.children.length;
            this.children[i].size.y = this.size.y;
        }
    }
};

function draw(items) {
    for(let item of items.flat()) {
        item.draw();
        if(item.children) {
            draw(item.children);
        }
    }
}

let inputs = {
    mouseDown: false,
    mouseUp: false
}
let inputActions = {
    mouseClicked: false,
}
let pressedItems = [];

function storePressed(items) {
    for(let item of items.flat()) {
        if(item instanceof Control) {
            storePressed(item.children);
            continue
        }
        if(item.containsPoint(mousePos)) {
            item.isPressed();
            pressedItems.push(item);
        }
        if(item.children) {
            storePressed(item.children);
        }       
    }
}

function handleClicked() {
    for(let item of pressedItems) {
        item.isReleased();
        if(item.containsPoint(mousePos)) {
            item.isClicked();
        }
    }
    pressedItems = [];
}

function handleHovered(items) {
    for(let item of items.flat()) {
        if(item instanceof Control) {
            handleHovered(item.children);
            continue
        }
        if(!item.entered && item.containsPoint(mousePos)) {
            item.isEntered();
        } else if(item.entered && !item.containsPoint(mousePos)) {
            item.isExited();
        }
        if(item.children) {
            handleHovered(item.children);
        }       
    }
}

function input(event) {
    if(event instanceof MouseEvent) {
        if(event.type == 'mousedown') {
            storePressed(drawnItems);

            inputs.mouseDown = true;
            inputs.mouseUp = false;
            return;
        }
        if(event.type == 'mouseup') {
            if(inputs.mouseDown) {
                inputActions.mouseClicked = true;
            } 

            handleClicked();

            inputs.mouseUp = true
            inputs.mouseDown = false
            return;
        }
        if(event.type == 'mousemove') {
            handleHovered(drawnItems);
            return;
        }
        return;
    }
}

let mousePos = new Vector2(0, 0);
let topBar = new HBoxContainer();

let drawnItems = [topBar];


function createUI() {
    topBar.add(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'a'));
    topBar.add(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'b'));
    topBar.add(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'c'));
    topBar.add(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'd'));
    for(let i = 0; i < topBar.children.length; i++) {
        let newContainer = new VBoxContainer(new Vector2(canvas.width / 4 * i, 100), new Vector2(100, 100 + 100 * i));
        for(let j = 0; j <= i; j++) {
            newContainer.add(new TextBox(new Vector2(0, 0), new Vector2(canvas.width / 4, 100), 'hi'));
        }
        newContainer.visible = false;
        topBar.children[i].addChild(newContainer);
    }
    
}

function init() {
    createUI();
}

function process(deltaTime) {
    topBar.size.x = canvas.width;
    for(let i = 0; i < topBar.children.length; i++) {
        topBar.children[i].children[0].position.x = canvas.width / 4 * i;
        topBar.children[i].children[0].size.x = canvas.width / 4;
    }
}

function resetInputs() {
    inputActions.mouseClicked = false;
}

function loop(prevTime) {
    let deltaTime = (new Date().getTime() - prevTime) / 1000;
    prevTime = new Date().getTime();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    draw(drawnItems);

    process(deltaTime);

    resetInputs();

    setTimeout(() => {
        loop(prevTime);
    }, 0);
}

function setEventHandlers() {
    canvas.addEventListener('mousemove', (event) => {
        mousePos = new Vector2(event.clientX, event.clientY);
        input(new MouseEvent('mousemove', mousePos));
    });
    canvas.addEventListener('mousedown', (event) => {
        input(new MouseEvent('mousedown', mousePos));
    });
    canvas.addEventListener('mouseup', (event) => {
        input(new MouseEvent('mouseup', mousePos));
    });
}

function main() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    setEventHandlers();
    init();
    loop(new Date().getTime());
}

main();