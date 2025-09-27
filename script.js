const canvas = document.getElementById('mainCanvas');
const canvasCtx = canvas.getContext('2d');

class Vector2 {
    x;
    y;
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    multiplied(n) {
        return new Vector2(this.x * n, this.y * n);
    }

    divided(n) {
        return new Vector2(this.x / n, this.y / n);
    }

    added(n) {
        return new Vector2(this.x + n.x, this.y + n.y);
    }

    subtracted(n) {
        return new Vector2(this.x - n.x, this.y - n.y);
    }

    getLength() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    normalized() {
        if(this.getLength() == 0) {
            return new Vector2(0, 0);
        }
        return this.divided(this.getLength());
    }

    distanceTo(n) {
        return Math.sqrt((this.x - n.x) ** 2 + (this.y - n.y) ** 2);
    }
};

let globalBorders;

class MouseEvent {
    type;
    position;

    constructor(type, position) {
        this.type = type;
        this.position = position;
    }
};

class TextItem {
    textContents = '';
    set text(value) {
        canvasCtx.font = this.font;
        this.textContents = value;
        let metrics = canvasCtx.measureText(value)
        let lines = this.splitText();
        let newSize = new Vector2();
        for(let i = 0; i < lines.length; i++) {
            let metrics = canvasCtx.measureText(lines[i]);
            newSize.x = Math.max(metrics.width, newSize.x);
            newSize.y += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + Number(i != lines.length - 1);
        }
        this.size = newSize;
    }
    get text() {
        return this.textContents;
    }
    position;
    size;
    maxWidth = 400;
    font = '16pt Arial';
    color = '#000000';
    visible = true;
    children;

    constructor(text = '', position = new Vector2(0, 0)) {
        this.text = text;
        this.position = position;
    }

    splitText() {
        let lines = this.text.split('\n');
        let newLines = [];
        for(let str of lines) {
            let nextString = str;
            let x = 0;
            while(canvasCtx.measureText(nextString).width > this.maxWidth) {
                let currString = nextString;
                let overflow = '';
                for(let i = 0; i < currString.length; i++) {
                    nextString = currString.slice(0, currString.length - i);
                    overflow = currString.slice(currString.length - i, currString.length);
                    if(canvasCtx.measureText(nextString).width <= this.maxWidth) {
                        break
                    }
                }
                newLines.push(nextString);
                nextString = overflow;
                if(x > 10) {
                    break
                }
                x++;
            }
            newLines.push(nextString);
        }
        return newLines;
    }
    
    draw() {
        if(!this.visible) {
            return
        }
        canvasCtx.fillStyle = this.color;
        canvasCtx.font = this.font;
        let lines = this.splitText();
        let textHeight = 0;
        for(let str of lines) {
            let metrics = canvasCtx.measureText(str);
            canvasCtx.fillText(str, this.position.x, this.position.y + textHeight);
            textHeight += metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent + 5;
        }
    }
}

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
        } else {
            this.toggled = true;
            this.bodyColor = '#66ff66';
        }
        
        this.isEntered();
        this.onClick();
        this.onSetToggled();
    }

    onClick() {

    }

    deToggle() {
        if(!this.toggled) {
            return
        }
        this.toggled = false;
        this.bodyColor = '#000000';
        this.onSetToggled();
    }

    onSetToggled() {
        
    }

    addChild(item) {
        this.children.push(item);
    }
};

class Ball {
    position;
    velocity = new Vector2(0, 0);
    rotation = 0;
    angularVelocity = 0;
    radius;
    text;
    bodyColor = '#000000';
    textColor = '#6600ff';
    children;
    collisionRes = new Vector2(0, 0);
    gravityScale = 1;
    drawType = 'fill';
    visible = true;

    constructor(position = new Vector2(0, 0), radius = 10, text = '') { 
        this.position = position;
        this.radius = radius;
        this.text = text;
    }

    draw() {
        if(!this.visible) {
            return;
        }
        let metrics
        let textSize
        canvasCtx.fillStyle = this.bodyColor;
        canvasCtx.beginPath();
        canvasCtx.arc(this.position.x, this.position.y, this.radius, 0, 2 * Math.PI);
        this.drawType == 'fill' ? canvasCtx.fill() : canvasCtx.stroke();
        canvasCtx.fillStyle = this.textColor;
        canvasCtx.font = this.radius + 'px Arial';
        metrics = canvasCtx.measureText(this.text);
        textSize = new Vector2(metrics.width, metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent);
        canvasCtx.translate(this.position.x, this.position.y)
        canvasCtx.rotate(this.rotation);
        canvasCtx.translate(-this.position.x, -this.position.y);
        canvasCtx.fillText(this.text, this.position.x - Math.min(textSize.x / 2, this.radius * 0.95), this.position.y + textSize.y / 2, this.radius * 1.9);
        canvasCtx.translate(this.position.x, this.position.y);
        canvasCtx.rotate(-this.rotation);
        canvasCtx.translate(-this.position.x, -this.position.y);
    } 
    
    isColliding(body) {
        let dis = this.position.distanceTo(body.position);
        if(dis <= this.radius + body.radius) {
            this.collisionRes = this.position.subtracted(body.position).normalized().multiplied((this.radius + body.radius) - dis);
            body.collisionRes = this.collisionRes.multiplied(-1);
            if((Math.sign(body.velocity.x) == Math.sign(this.collisionRes.x) || body.velocity.x == 0) && (Math.sign(body.velocity.y) == Math.sign(this.collisionRes.y) || body.velocity.y == 0)) {
                this.applyForce(body.velocity.getLength() * 0.1, this.collisionRes);          
            }
            if((Math.sign(this.velocity.x) == Math.sign(body.collisionRes.x) || this.velocity.x == 0) && (Math.sign(this.velocity.y) == Math.sign(body.collisionRes.y) || this.velocity.y == 0)) {
                body.applyForce(this.velocity.getLength() * 0.1, body.collisionRes);
            }
            return true
        }
        return false
    }

    applyForce(force, direction) {
        this.velocity = this.velocity.added(direction.normalized().multiplied(force / (this.radius / 10)));
    }

    applyPhysics(deltaTime) {
        if(this.position.x - this.radius <= globalBorders[0]) {
            this.collisionRes.x = -this.position.x + this.radius;
        } else if(this.position.x + this.radius >= globalBorders[1]) {
            this.collisionRes.x = globalBorders[1] - (this.position.x + this.radius);
        }
        if(this.position.y - this.radius <= globalBorders[2]) {
            this.collisionRes.y = -this.position.y + this.radius;
        } else if(this.position.y + this.radius >= globalBorders[3]) {
            this.collisionRes.y = globalBorders[3] - (this.position.y + this.radius);
        }
        this.applyForce(10 * this.gravityScale, new Vector2(0, 1));
        this.applyForce(this.velocity.getLength() * 1.1, this.collisionRes);

        this.applyForce(-3, this.velocity);

        this.position = this.position.added(this.collisionRes);
        
        if(this.velocity.getLength() > 50) {
            this.position = this.position.added(this.velocity.multiplied(deltaTime));
        }

        this.rotation += this.angularVelocity * deltaTime;

        this.collisionRes = new Vector2(0, 0);
    }
    
}

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

    addChild(item) {
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
            //this.children[i].visible = this.visible;
            this.children[i].position.y = this.size.y / this.children.length * i + this.position.y;
            this.children[i].position.x = this.position.x;
            this.children[i].size.y = this.size.y / this.children.length - (i != this.children.length - 1 ? 1: 0);
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
            //this.children[i].visible = this.visible;
            this.children[i].position.x = this.size.x / this.children.length * i + this.position.x;
            this.children[i].position.y = this.position.y;
            this.children[i].size.x = this.size.x / this.children.length - (i != this.children.length - 1 ? 1: 0);
            //this.children[i].size.y = this.size.y;
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

let mousePos = new Vector2(0, 0);
let topBar = new HBoxContainer();
let physicsBodies = [];
let reading = [];
let gameItems = [];
let choiceButtons = [];
let drawnItems = [reading, topBar, physicsBodies, gameItems];
let originalTextYArr = [];
let scrollY = 0;
let readingHeight = 0;
let ballsTargetPos = new Vector2(0, 0);
let ballGame = false;
let gamePlaying = false;
let physicsMode = 0;
let answerCorrect = true;

let inputs = {
    mouseDown: false,
    mouseUp: false
}

let pressedItems = [];

function storePressed(items) {
    for(let item of items.flat()) {
        if(!(item instanceof TextBox || item instanceof Control)) {
            continue
        }
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
        if(!(item instanceof TextBox || item instanceof Control)) {
            continue
        }
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

            handleClicked();

            inputs.mouseUp = true
            inputs.mouseDown = false
            return;
        }
        if(event.type == 'mousemove') {
            handleHovered(drawnItems);
            return;
        }
        if(event.type == 'scrollup') {
            for(let body of physicsBodies) {
                body.applyForce(175, new Vector2(0, 1));
            }
            scrollY = Math.min(scrollY + 40, 0);
            return
        }
        if(event.type == 'scrolldown') {
            for(let body of physicsBodies) {
                body.applyForce(175, new Vector2(0, -1));
            }
            scrollY = Math.max(scrollY - 40, -Math.max(readingHeight - canvas.height + originalTextYArr[0], 0));
            return
        }
        return;
    }
}

function createUI() {
    topBar.size.y = 50;
    topBar.addChild(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'Reading (Do First)'));
    topBar.addChild(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'Game'));

    topBar.children[0].onClick = function() {
        topBar.children[1].deToggle();
        this.text = 'Reading';
    };
    topBar.children[0].onSetToggled = function() {
        for(let item of reading) {
            item.visible = this.toggled;
        }
        scrollY = 0;
    };


    topBar.children[1].onClick = function() {
        topBar.children[0].deToggle();
    };
    topBar.children[1].onSetToggled = function() {
        gamePlaying = this.toggled;
        ballGame = false;
        physicsMode = 0;
        for(let body of physicsBodies) {
            body.gravityScale = 1;
            body.textColor = '#ffffff';
        }
        for(let item of choiceButtons) {
            item.visible = this.toggled;
        }
        gameItems[1].visible = this.toggled;
        gameItems[2].visible = false;
        gameItems[3].visible = this.toggled;
        gameItems[3].text = '0';
        gameItems[3].textColor = '#0000ff';
        currQuestionIndex = 0;
        askNextQuestion();
    };

    let vBox = new VBoxContainer(new Vector2(0, 0), new Vector2(100, Math.min(800, canvas.width)));
    vBox.addChild(new TextBox(new Vector2(0, 0), new Vector2(100, 100), 'Credits \u2193'));
    vBox.addChild(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'All programming done'));
    vBox.addChild(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'in native HTML, JS,'));
    vBox.addChild(new TextBox(new Vector2(0, 0), new Vector2(0, 0), '& CSS by Me :)'));
    vBox.addChild(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'Reading Sources:'));
    let link1 = new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'Source 1');
    let link2 = new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'Source 2');
    let link3 = new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'Source 3');
    link1.onClick = function(){
        window.open('https://delphiforums.com/', '_blank').focus();
        this.deToggle();
    };
    link2.onClick = function(){
        window.open('https://www.internetsociety.org/internet/history-internet/', '_blank').focus();
        this.deToggle();
    };
    link3.onClick = function(){
        window.open('https://www.communitysignal.com/delphi-forums-the-enduring-legacy-of-an-online-pioneer/', '_blank').focus();
        this.deToggle();
    };
    vBox.addChild(link1);
    vBox.addChild(link2);
    vBox.addChild(link3);
    topBar.addChild(vBox);
    for(let i = 1; i < vBox.children.length; i++) {
        vBox.children[i].visible = false;
    }
    vBox.children[0].onClick = function() {
        for(let i = 1; i < vBox.children.length; i++) {
            vBox.children[i].visible = this.toggled;
        }
    };
}

function createBalls() {
    for(let i = 0; i < 9; i++) {
        for(let j = 0; j < 9 - i; j++) {
            let newBody = new Ball(new Vector2(i * 10 + j * 10, 300), 10 + i * 1.5, i + 1)
            newBody.textColor = '#ffffff';
            physicsBodies.push(newBody);
            newBody.applyForce(1000000000, new Vector2(1, 0))
        }    
    }
}

function createReading() {
    let text = [
        'Welcome :)',
        'hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...',
        'hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...',
        'hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','hello there. Good day init? I would say so myself. Mhm. Yes indeed! Yes indeed...','bye',
    ]
    let textHeight = 0;
    for(let str of text) {
        let newItem = new TextItem(str, new Vector2(30, 200 + textHeight));
        originalTextYArr.push(newItem.position.y);
        newItem.visible = false;
        reading.push(newItem);
        textHeight += reading[reading.length - 1].size.y + 15;
    }
    readingHeight = textHeight;
}

function createGame() {
    choiceButtons.push(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'A'));
    choiceButtons.push(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'B'));
    choiceButtons.push(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'C'));
    choiceButtons.push(new TextBox(new Vector2(0, 0), new Vector2(0, 0), 'D'));
    
    gameItems.push(new HBoxContainer(new Vector2(canvas.width / 2 - 100, canvas.height / 2 - 100), new Vector2(200, 100)));
    gameItems[0].addChild(new VBoxContainer(new Vector2(0, 0), new Vector2(0, 200)));
    gameItems[0].children[0].addChild(choiceButtons[0]);
    gameItems[0].children[0].addChild(choiceButtons[2]);
    gameItems[0].addChild(new VBoxContainer(new Vector2(0, 0), new Vector2(0, 200)));
    gameItems[0].children[1].addChild(choiceButtons[1]);
    gameItems[0].children[1].addChild(choiceButtons[3]);

    for(let i = 0; i < choiceButtons.length; i++) {
        choiceButtons[i].visible = false;
        let choiceChar = '';
        if(i == 0) {
            choiceChar = 'a';
        } else if(i == 1) {
            choiceChar = 'b';
        } else if(i == 2) {
            choiceChar = 'c';
        } else {
            choiceChar = 'd';
        }
        choiceButtons[i].onClick = function() {
            checkAnswer(choiceChar);
            this.deToggle();
        };
    }

    gameItems.push(new TextItem('', new Vector2(canvas.width / 2, canvas.height / 2 - 200)));
    gameItems[1].visible = false;

    gameItems.push(new TextBox(new Vector2(canvas.width / 2 - 50, canvas.height / 2 - 50), new Vector2(100, 100), 'Drop!'));
    gameItems[2].visible = false;
    gameItems[2].onClick = function() {
        this.deToggle();
        this.visible = false;
        for(let body of physicsBodies) {
            body.gravityScale = 1;
            ballsTargetPos = new Vector2(0, 0);
        }
        setTimeout(checkGameBall, 1000);
    };

    let gameBall = new Ball(new Vector2(canvas.width / 2, canvas.height / 2 + 200), 50, '0');
    gameBall.drawType = 'stroke';
    gameBall.textColor = '#0000ff';
    gameBall.visible = false;
    gameItems.push(gameBall);
}

function init() {
    createUI();
    createBalls();
    createReading();
    createGame();
    askNextQuestion();
}

let currQuestionIndex = 0;

let questions = [
    'The answer is B',
    'The answer is C',
    'The answer is neither of the last ones, nor D',
    'You can figure this one out',
];

let correctAnswers = [
    'b',
    'c',
    'a',
    'd'

];

function askNextQuestion() {
    if(!gamePlaying) {
        return
    }
    if(currQuestionIndex == questions.length) {
        gameItems[1].text = '                        Final Score\n(Restart By Reselecting "Game" Button)'
        for(let item of choiceButtons) {
            item.visible = false;
        }
        return
    }
    gameItems[1].text = questions[currQuestionIndex];
}

function checkAnswer(answer) {
    if(!gamePlaying) {
        return
    }
    if(answer == correctAnswers[currQuestionIndex]) {
        answerCorrect = true;
        gameItems[1].text = 'Correct!';
    } else {
        answerCorrect = false;
        gameItems[1].text = 'Incorrect!';
    }
    for(let container of gameItems[0].children) {
        for(let item of container.children) {
            item.visible = false;
        }
    }
    ballGame = true;
    ballsTargetPos = new Vector2(canvas.width / 2, canvas.height / 2 - 200);
    for(let body of physicsBodies) {
        body.gravityScale = 0;
    }
}

function checkGameBall() {
    if(!gamePlaying) {
        return
    }
    let gameBall = gameItems[3];
    physicsMode = 1;
    let collectedBalls = [];
    let score = Number(gameBall.text);
    gameBall.textColor = answerCorrect ? '#00ff00' : '#ff0000';
    gameBall.text = '0';
    for(let body of physicsBodies) {
        if(gameBall.isColliding(body)) {
            collectedBalls.push(body);
            body.textColor = gameBall.textColor;
            gameBall.text = Number(gameBall.text) + Number(body.text) * (answerCorrect ? 1 : -1);
            score += Number(body.text) * (answerCorrect ? 1: -1);
        }
    }
    if(Number(gameBall.text)) {
        gameBall.text = (answerCorrect ? '+' : '') + gameBall.text;
    } else {
        gameBall.text = (answerCorrect ? '+' : '-') + '0';
    }
    
    setTimeout(() => {
        if(!gamePlaying) {
            return
        }
        physicsMode = 0;
        for(let body of collectedBalls) {
            body.textColor = '#ffffff';
        }
        gameBall.text = score;
        gameBall.textColor = '#0000ff';
        for(let item of choiceButtons) {
            item.visible = true;
        }
        currQuestionIndex += Number(answerCorrect);
        askNextQuestion();
    }, 750);
}

function process(deltaTime) {
    if(ballGame) {
        if(ballsTargetPos.getLength()) {
            maxHeight = physicsBodies[0].position.y;
            for(let body of physicsBodies) {
                body.position = body.position.subtracted(ballsTargetPos).multiplied(Math.pow(0.1, deltaTime)).added(ballsTargetPos);
                maxHeight = Math.max(maxHeight, body.position.y);
            }
            if(maxHeight < canvas.height / 2 + 100) {
                gameItems[2].visible = true;
            }
        }

    }

    topBar.size.x = canvas.width;

    for(let i = 0; i < reading.length; i++) {
        reading[i].maxWidth = canvas.width - 30;
        reading[i].position.y = (reading[i].position.y - (originalTextYArr[i] + scrollY)) * Math.pow(0.0001, deltaTime) + originalTextYArr[i] + scrollY;
    }

    gameItems[0].position = new Vector2(canvas.width / 2 - 100, canvas.height / 2 - 100);
    gameItems[1].position = new Vector2((canvas.width - gameItems[1].size.x) / 2, canvas.height / 2 - 200);
    gameItems[2].position = new Vector2(canvas.width / 2 - 50, canvas.height / 2 - 50);
    gameItems[3].position = new Vector2(canvas.width / 2, canvas.height / 2 + 200);

}

function applyPhysics(bodies, deltaTime) {
    if(physicsMode == 1) {
        return
    }
    for(let i = 0; i < bodies.length; i++) {
        for(let j = i + 1; j < bodies.length; j++) {
            bodies[i].isColliding(bodies[j]);
        }
    }
    for(let body of bodies) {
        body.applyPhysics(deltaTime);
    }
} 

function loop(prevTime) {
    let deltaTime = (new Date().getTime() - prevTime) / 1000;
    prevTime = new Date().getTime();

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    globalBorders[1] = canvas.width;
    globalBorders[3] = canvas.height;
    canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
    applyPhysics(physicsBodies, deltaTime);
    draw(drawnItems);

    process(deltaTime);

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
    canvas.addEventListener('wheel', (event) => {
        if(event.deltaY < 0) {
            input(new MouseEvent('scrollup', mousePos));
        } else {
            input(new MouseEvent('scrolldown', mousePos));
        }
    });
}

function main() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    globalBorders = [0, canvas.width, 0, canvas.height];
    setEventHandlers();
    init();
    loop(new Date().getTime());
}

main();