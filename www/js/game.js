let game;
let gameOptions = {
    tileSize: 200,
    tileSpacing: 20,
    boardSize: {
        rows: 4,
        cols: 4
    },
    tweenSpeed: 50,
    swipeMaxTime: 1000,
    swipeMinDistance: 20,
    swipeMinNormal: 0.85,
    aspectRatio: 16/9,
    localStorageName: "topscore4096"
}
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;
document.addEventListener("deviceready", onDeviceReady);
function onDeviceReady() {
    let titeAndSpacing = gameOptions.tileSize + gameOptions.tileSpacing;
    let width = gameOptions.boardSize.cols * titeAndSpacing;
    width += gameOptions.tileSpacing;
    let gameConfig = {
        width: width,
        height: width * gameOptions.aspectRatio,
        backgroundColor: 0xecf0f1,
        scene: [bootGame, playGame],
        scale: {
            mode: Phaser.Scale.FIT,
            autoCenter: Phaser.Scale.CENTER_BOTH,
            parent: "thegame",
            width: width,
            height: width * gameOptions.aspectRatio
        },
        type: Phaser.AUTO
    }
    game = new Phaser.Game(gameConfig);
    window.focus();
}
class bootGame extends Phaser.Scene{
    constructor(){
        super("BootGame");
    }
    preload(){
        this.load.image("emptytile", "assets/sprites/emptytile.png");
        this.load.spritesheet("tiles", "assets/sprites/tiles.png", {
            frameWidth: gameOptions.tileSize,
            frameHeight: gameOptions.tileSize
        });
        this.load.audio("move", ["assets/sounds/move.ogg", "assets/sounds/move.mp3"]);
        this.load.audio("grow", ["assets/sounds/grow.ogg", "assets/sounds/grow.mp3"]);
        this.load.image("restart", "assets/sprites/restart.png");
        this.load.image("scorepanel", "assets/sprites/scorepanel.png");
        this.load.image("scorelabels", "assets/sprites/scorelabels.png");
        this.load.image("logo", "assets/sprites/logo.png");
        this.load.image("howtoplay", "assets/sprites/howtoplay.png");
        this.load.image("gametitle", "assets/sprites/gametitle.png");
        this.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
    }
    create(){
        this.scene.start("PlayGame");
    }
}
class playGame extends Phaser.Scene{
    constructor(){
        super("PlayGame");
    }
    create(){
        this.score = 0;
        let restartXY = this.getTilePosition(-0.8, gameOptions.boardSize.cols - 1);
        let restartButton = this.add.sprite(restartXY.x, restartXY.y, "restart");
        restartButton.setInteractive();
        restartButton.on("pointerdown", function(pointer){
            this.scene.start("PlayGame");
            console.log("Restarted...");
        }, this);

        let scoreXY = this.getTilePosition(-0.8, 1);
        this.add.image(scoreXY.x, scoreXY.y, "scorepanel");
        this.add.image(scoreXY.x, scoreXY.y - 70, "scorelabels");
        var textXY = this.getTilePosition(-0.92, -0.4);
        this.scoreText = this.add.bitmapText(textXY.x, textXY.y, "font", "0");
        textXY = this.getTilePosition(-0.92, 1.1);

        this.bestScore = localStorage.getItem(gameOptions.localStorageName);
        if(this.bestScore == null) {
            this.bestScore = 0;
        }
        this.bestScoreText = this.add.bitmapText(textXY.x, textXY.y, "font", this.bestScore.toString());



        let gameTitle = this.add.image(10, 5, "gametitle");
        gameTitle.setOrigin(0, 0);
        let howTo = this.add.image(game.config.width, 5, "howtoplay");
        howTo.setOrigin(1, 0);
        //let logo = this.add.sprite(game.config.width / 2, game.config.height, "logo");
        //logo.setOrigin(0.5, 1);

        this.canMove = false;
        this.boardArray = [];
        for(let i = 0; i < gameOptions.boardSize.rows; i++){
            this.boardArray[i] = [];
            for(let j = 0; j < gameOptions.boardSize.cols; j++){
                let tilePosition = this.getTilePosition(i, j);
                this.add.image(tilePosition.x, tilePosition.y, "emptytile");
                let tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
                tile.visible = false;
                this.boardArray[i][j] = {
                    tileValue: 0,
                    tileSprite: tile,
                    upgraded: false
                }
            }
        }
        this.addTile();
        this.addTile();
        this.input.keyboard.on("keydown", this.handleKey, this);
        this.input.on("pointerup", this.handleSwipe, this);
        this.moveSound = this.sound.add("move");
        this.growSound = this.sound.add("grow");
    }
    addTile(){
        let emptyTiles = [];
        for(let i = 0; i < gameOptions.boardSize.rows; i++){
            for(let j = 0; j < gameOptions.boardSize.cols; j++){
                if(this.boardArray[i][j].tileValue === 0){
                    emptyTiles.push({
                        row: i,
                        col: j
                    })
                }
            }
        }
        if(emptyTiles.length > 0){
            let chosenTile = Phaser.Utils.Array.RemoveRandomElement(emptyTiles);
            this.boardArray[chosenTile.row][chosenTile.col].tileValue = 1;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.visible = true;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
            this.tweens.add({
                targets: [this.boardArray[chosenTile.row][chosenTile.col].tileSprite],
                alpha: 1,
                duration: gameOptions.tweenSpeed,
                callbackScope: this,
                onComplete: function(){
                    this.canMove = true;
                }
            });
        }
    }
    getTilePosition(row, col){
        let posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
        let posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);

        let boardHeight = gameOptions.boardSize.rows * gameOptions.tileSize;
        boardHeight += (gameOptions.boardSize.rows + 1) * gameOptions.tileSpacing;
        let offsetY = (game.config.height - boardHeight) / 2;
        posY += offsetY;

        return new Phaser.Geom.Point(posX, posY);
    }
    handleKey(e){
        if(this.canMove){
            switch(e.code){
                case "KeyA":
                case "ArrowLeft":
                    this.makeMove(LEFT);
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.makeMove(RIGHT);
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.makeMove(UP);
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.makeMove(DOWN);
                    break;
            }
        }
    }
    handleSwipe(e){
        if(this.canMove){
            let swipeTime = e.upTime - e.downTime;
            let fastEnough = swipeTime < gameOptions.swipeMaxTime;
            let swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
            let swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
            let longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
            if(longEnough && fastEnough){
                Phaser.Geom.Point.SetMagnitude(swipe, 1);
                if(swipe.x > gameOptions.swipeMinNormal){
                    this.makeMove(RIGHT);
                }
                if(swipe.x < -gameOptions.swipeMinNormal){
                    this.makeMove(LEFT);
                }
                if(swipe.y > gameOptions.swipeMinNormal){
                    this.makeMove(DOWN);
                }
                if(swipe.y < -gameOptions.swipeMinNormal){
                    this.makeMove(UP);
                }
            }
        }
    }
    makeMove(d){
        this.movingTiles = 0;
        let dRow = (d === LEFT || d === RIGHT) ? 0 : d === UP ? -1 : 1;
        let dCol = (d === UP || d === DOWN) ? 0 : d === LEFT ? -1 : 1;
        this.canMove = false;
        let firstRow = (d === UP) ? 1 : 0;
        let lastRow = gameOptions.boardSize.rows - ((d === DOWN) ? 1 : 0);
        let firstCol = (d === LEFT) ? 1 : 0;
        let lastCol = gameOptions.boardSize.cols - ((d === RIGHT) ? 1 : 0);
        for(let i = firstRow; i < lastRow; i++){
            for(let j = firstCol; j < lastCol; j++){
                let curRow = dRow === 1 ? (lastRow - 1) - i : i;
                let curCol = dCol === 1 ? (lastCol - 1) - j : j;
                let tileValue = this.boardArray[curRow][curCol].tileValue;
                if(tileValue !== 0){
                    let newRow = curRow;
                    let newCol = curCol;
                    while(this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)){
                        newRow += dRow;
                        newCol += dCol;
                    }
                    if(newRow !== curRow || newCol !== curCol){
                        let newPos = this.getTilePosition(newRow, newCol);
                        let willUpdate = this.boardArray[newRow][newCol].tileValue === tileValue;
                        this.moveTile(this.boardArray[curRow][curCol].tileSprite, newPos, willUpdate);
                        this.boardArray[curRow][curCol].tileValue = 0;
                        if(willUpdate){
                            this.boardArray[newRow][newCol].tileValue ++;
                            this.score += Math.pow(2, this.boardArray[newRow][newCol].tileValue);
                            this.boardArray[newRow][newCol].upgraded = true;
                            // this.boardArray[curRow][curCol].tileSprite.setFrame(tileValue);
                        }
                        else{
                            this.boardArray[newRow][newCol].tileValue = tileValue;
                        }
                    }
                }
            }
        }
        if(this.movingTiles === 0){
            this.canMove = true;
        } else {
            this.moveSound.play();
        }
    }
    moveTile(tile, point, upgrade){
        this.movingTiles ++;
        tile.depth = this.movingTiles;
        let distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
        this.tweens.add({
            targets: [tile],
            x: point.x,
            y: point.y,
            duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
            callbackScope: this,
            onComplete: function(){
                if(upgrade){
                    this.upgradeTile(tile);
                }
                else{
                    this.endTween(tile);
                }
            }
        })
    }
    upgradeTile(tile){
        this.growSound.play();
        tile.setFrame(tile.frame.name + 1);
        this.tweens.add({
            targets: [tile],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: gameOptions.tweenSpeed,
            yoyo: true,
            repeat: 1,
            callbackScope: this,
            onComplete: function(){
                this.endTween(tile);
            }
        })
    }
    endTween(tile){
        this.movingTiles --;
        tile.depth = 0;
        if(this.movingTiles === 0){
            this.refreshBoard();
        }
    }
    refreshBoard(){
        this.scoreText.text = this.score.toString();
        if(this.score > this.bestScore) {
            this.bestScore = this.score;
            localStorage.setItem(gameOptions.localStorageName, this.bestScore);
            this.bestScoreText.text = this.bestScore.toString();
        }


        for(let i = 0; i < gameOptions.boardSize.rows; i++){
            for(let j = 0; j < gameOptions.boardSize.cols; j++){
                let spritePosition = this.getTilePosition(i, j);
                this.boardArray[i][j].tileSprite.x = spritePosition.x;
                this.boardArray[i][j].tileSprite.y = spritePosition.y;
                let tileValue = this.boardArray[i][j].tileValue;
                if(tileValue > 0){
                    this.boardArray[i][j].tileSprite.visible = true;
                    this.boardArray[i][j].tileSprite.setFrame(tileValue - 1);
                    this.boardArray[i][j].upgraded = false;
                }
                else{
                    this.boardArray[i][j].tileSprite.visible = false;
                }
            }
        }
        this.addTile();
    }
    isLegalPosition(row, col, value){
        let rowInside = row >= 0 && row < gameOptions.boardSize.rows;
        let colInside = col >= 0 && col < gameOptions.boardSize.cols;
        if(!rowInside || !colInside){
            return false;
        }

        if(this.boardArray[row][col].tileValue == 12) {
            return false;
        }

        let emptySpot = this.boardArray[row][col].tileValue === 0;
        let sameValue = this.boardArray[row][col].tileValue === value;
        let alreadyUpgraded = this.boardArray[row][col].upgraded;
        return emptySpot || (sameValue && !alreadyUpgraded);
    }
}
function resizeGame(){
    let canvas = document.querySelector("canvas");
    let windowWidth = window.innerWidth;
    let windowHeight = window.innerHeight;
    let windowRatio = windowWidth / windowHeight;
    let gameRatio = game.config.width / game.config.height;
    if(windowRatio < gameRatio){
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else{
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}
