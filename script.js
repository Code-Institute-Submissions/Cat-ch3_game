window.onload = function () {
    let canvas = document.getElementById("gameArea");
    let ctx = canvas.getContext("2d");



    const GAME_WIDTH = 350;
    const GAME_HEIGHT = 470;

    const GAMESTATE = {
        resolving: true,
        userInput: false

    }
    /**
     * sleep function to delay execution of code
     * @param {Number} ms 
     */
    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    class Grid {
        constructor() {
            this.columns = 5;
            this.rows = 6;
            this.width = GAME_WIDTH - 4;
            this.height = GAME_HEIGHT - 70;
            this.intervalX = this.width / this.columns;
            this.intervalY = this.height / this.rows;
            this.padding = 2;
            this.higlightPadding = this.padding + 2.5;
            this.cells = this.getCellPos();
            
        }
        
        draw(ctx) {
            for (let x = 0; x <= this.width; x += this.intervalX) {
                ctx.beginPath();
                ctx.moveTo(x + this.padding + 0.5, this.padding);
                ctx.lineTo(x + this.padding + 0.5, this.height + this.padding);
                ctx.stroke();

            }

            for (let y = 0; y <= this.height + this.padding; y += this.intervalY) {
                ctx.beginPath();
                ctx.moveTo(this.padding, y + this.padding + 0.5);
                ctx.lineTo(this.width + this.padding, y + this.padding + 0.5);
                ctx.stroke();

            }

        }

        /**
         * creates a two-dimensional array of objects, each containing position where a cell starts and where it ends
         */
        getCellPos() {
            let cellPos = [];
            let posY = this.padding;
            for (let i = 0; i < this.rows; i++) {
                let cellPosRow = [];
                let posX = this.padding;
                for (let j = 0; j < this.columns; j++) {
                    cellPosRow[j] = {
                        x: posX,
                        y: posY,
                        xEnd: posX + this.intervalX,
                        yEnd: posY + this.intervalY,
                        colour: true,
                        row: i,
                        column: j
                    }
                    posX += this.intervalX;

                }
                posY += this.intervalY;
                cellPos.push(cellPosRow);

            }
            this.cells = cellPos;
            return cellPos;
        }

        /**
         * fills a cell with colour
         * @param {*} ctx 
         * @param {*} cell 
         */
        drawBackground(ctx, cell) {
                ctx.fillStyle = "#ED9A9A";
                ctx.fillRect(cell.x + this.padding, cell.y + this.padding, this.intervalX - this.padding, this.intervalY - this.padding);
           
        }
        /**
         * fills every cell's background with colour
         * @param {*} ctx 
         */
        fillBackground(ctx) {
            let cells = this.getCellPos();
            cells.forEach(row => row.forEach(cell => this.drawBackground(ctx, cell)));
        }


        highlightCell(cellX, cellY, ctx) {
            ctx.strokeStyle = "#000000";
            ctx.strokeRect(cellX + this.higlightPadding, cellY + this.higlightPadding, this.intervalX - 8, this.intervalY - 8);
        }

        removeHighlight(cellX, cellY, ctx) {
            ctx.clearRect(cellX - 1 + this.higlightPadding, cellY - 1 + this.higlightPadding, this.intervalX - 6, 8);
            ctx.clearRect(cellX - 1 + this.higlightPadding, cellY - 1 + this.higlightPadding, 8, this.intervalY - 6);
            ctx.clearRect(cellX - 1 + this.higlightPadding, cellY + this.higlightPadding + this.intervalY - 14, this.intervalX - 6, 8);
            ctx.clearRect(cellX - 1 + this.higlightPadding + this.intervalX - 14, cellY - 1 + this.higlightPadding, 8, this.intervalY - 6);

        }

    }

    
    class Dashboard {
        constructor(grid) {
            this.points = 0;
            this.moves = 20;
            this.gridWidth = grid.width;
            this.gridHeight = grid.height;
            this.padding = grid.padding;
            this.button = {
                width: 100,
                height: 30,
                x: GAME_WIDTH/2 - 100/2,
                y: GAME_HEIGHT - 35
            }
           
        }

        draw(ctx) {
            ctx.font = "12px Arial";
            ctx.fillStyle = "black";
            ctx.textAlign = "center";  
            ctx.fillText("Moves Left: " + this.moves, this.gridWidth/4, this.gridHeight + 20); 
            ctx.fillText("Points: " + this.points, this.gridWidth/4 * 3, this.gridHeight + 20); 
            //button
            ctx.strokeRect(this.button.x, this.button.y, this.button.width, this.button.height);
            ctx.fillStyle = "#FFD9B3"
            ctx.fillRect(this.button.x + 2, this.button.y + 2, this.button.width - 4, this.button.height - 4);
            ctx.fillStyle = "black";
            ctx.fillText("NEW GAME", GAME_WIDTH/2, this.button.y + this.button.height/2 + 2.5);
        }
    }

    class Icons {
        constructor(grid) {
            this.gridWidth = grid.width;
            this.gridHeight = grid.height; 
            this.padding = grid.padding;
            this.icons = [...document.querySelectorAll(".icon")];
            this.size = 40;
            this.position = {
                x: (grid.intervalX + this.padding) / 2 - this.size / 2,
                y: (grid.intervalY + this.padding) / 2 - this.size / 2,
            };
        };

        draw(ctx, currentIcon, posX, posY) {
            ctx.drawImage(currentIcon, posX, posY, this.size, this.size);
        }

       
    }



    /**
     * get a mouse position
     * @param {Object} canvas 
     * @param {Object} event 
     */
    function mousePos(canvas, event) {
        let canvasArea = canvas.getBoundingClientRect();
        let position = {
            x: event.clientX - canvasArea.left,
            y: event.clientY - canvasArea.top,
        }
        return position;
    }

    class Game {
        constructor() {
            this.grid = new Grid();
            this.gridWidth = this.grid.width;
            this.gridHeight = this.grid.height;
            this.padding = this.grid.padding;
            this.cells = this.grid.cells;
            this.dashboard = new Dashboard(this.grid);
            this.tiles = new Icons(this.grid);
            this.tSize = this.tiles.size;
            this.tPosition = this.tiles.position;
            this.selectedIcons = [];
            this.icons = this.tiles.icons;
            this.clicked = [];
            this.cellPosArr = [].concat(...this.grid.getCellPos());
            this.matchesArr = [];
            this.matches = [];
            this.validClick = false;
            this.interval = 30;
            new InputHandler(this, this.grid)
            

        }

        init(){
            this.grid.draw(ctx);
            this.grid.fillBackground(ctx);
            this.dashboard.draw(ctx);
            this.drawLevel(ctx);
            this.resolve();
        }
        /**
         * draws random icons into the canvas, including additional hidden icons above as a refill
         * @param {Object} ctx 
         */
        drawLevel(ctx) {
            //start position is beyond the canvas so that refill icons can be drawn
            let posY = this.tPosition.y - this.grid.intervalY * this.grid.rows;
            for (let i = 0; i < this.grid.rows * 2; i++) {
                let posX = this.tPosition.x;
                let selectedIconsRow = [];
                for (let j = 0; j < this.grid.columns; j++) {
                    let currentIcon = this.icons[Math.floor(Math.random() * 5)];
                    this.tiles.draw(ctx, currentIcon, posX, posY);
                    selectedIconsRow[j] = {
                        image: currentIcon,
                        x: posX,
                        y: posY,
                        removed: false,
                        row: i,
                        column: j
                    };
                    posX += this.grid.intervalX;

                }
                posY += this.grid.intervalY;
                this.selectedIcons.push(selectedIconsRow);
            }

        }

        /**
         * creates an array of unique matches
         */
        findMatches() {
            //finds matches in rows
            let matchesRows = [];
            let matchesCols = [];
            for (let i = this.selectedIcons.length / 2; i < this.selectedIcons.length; i++) {
                let previous = {};
                let rowMatch = [];
                for (let j = 0; j < this.selectedIcons[i].length; j++) {
                    if (previous.image === this.selectedIcons[i][j].image) {
                        if (rowMatch.length === 0) {
                            rowMatch.push(previous);
                        };

                        rowMatch.push(this.selectedIcons[i][j]);
                    } else {

                        if (rowMatch.length >= 3) {
                            matchesRows.push(rowMatch);
                            rowMatch = [];
                        } else {
                            rowMatch = [];
                        }
                        previous = this.selectedIcons[i][j];
                    }
                }
                if (rowMatch.length >= 3) {
                    matchesRows.push(rowMatch);
                }
            }

            //find matches in columns
            for (let i = 0; i < this.selectedIcons[0].length; i++) {
                let previous = {};
                let colMatch = [];
                for (let j = this.selectedIcons.length / 2; j < this.selectedIcons.length; j++) {
                    if (previous.image === this.selectedIcons[j][i].image) {
                        if (colMatch.length === 0) {
                            colMatch.push(previous);
                        };

                        colMatch.push(this.selectedIcons[j][i]);
                    } else {
                        if (colMatch.length >= 3) {
                            matchesCols.push(colMatch);
                            colMatch = [];
                        } else {
                            colMatch = [];
                        }
                        previous = this.selectedIcons[j][i];
                    }
                }
                if (colMatch.length >= 3) {
                    matchesCols.push(colMatch);
                }
            }
            this.matchesArr = matchesCols.concat(matchesRows);
            //all matches with duplicates removed
            this.matches = Array.from(new Set([].concat(...matchesCols.concat(matchesRows))));
            return this.matches;
        }
        /**
         * remove matches from the canvas and marked as removed in the array
         * @param {Object} ctx 
         */
        removeMatches(ctx) {
            /*this.matches.forEach(element => {
                let cells = grid.getCellPos();
                ctx.clearRect(element.x, element.y, tiles.size, tiles.size);
                grid.drawBackground(ctx, cells[element.row - this.selectedIcons.length/2][element.column]);
            });*/

            for (let i = this.selectedIcons.length / 2; i < this.selectedIcons.length; i++) {
                this.selectedIcons[i].forEach(function (obj) {
                    if (game.matches.includes(obj)) {
                        obj.removed = true;
                    }
                });
            }
        }
        /**
         * creates and array of icons that need to be moved
         */
        findIconsToMove() {
            let toMoveArray = [];
            //loop through all the visible icons starting from th bottom
            for (let i = this.selectedIcons.length - 1; i >= this.selectedIcons.length / 2; i--) {
                for (let j = 0; j < this.selectedIcons[i].length; j++) {
                    if (this.selectedIcons[i][j].removed) {
                        let removedIcon = this.selectedIcons[i][j];
                        //loop through all the icons above the removed icon
                        for (let k = 1; k <= i; k++) {
                            let current = this.selectedIcons[i - k][j]
                            //as soon as not removed icon is reached, give it the destination of the removed icon position
                            if (!(current.removed)) {
                                current.destinationY = removedIcon.y;
                                current.removed = true;
                                toMoveArray.push({
                                    ...current
                                });
                                break;
                            }
                        }
                    }
                }
            }
            return toMoveArray;
        }

         /**
         * makes tiles move depending on their destination property
         * @param {Array} moveArray 
         * @param {Array} drawArray 
         * @param {String} direction 
         */
        move(moveArray, drawArray, direction) {
            let self = this;
           
            let movement = setInterval(function () {
                ctx.clearRect(0, 0, self.gridWidth + self.padding, self.gridHeight + self.padding);
                self.grid.draw(ctx);
                //redraw the colour background if it wasn't removed
                self.cells.forEach(row => row.filter(cell => cell.colour).forEach(cell => self.grid.drawBackground(ctx, cell)));
                //redraw the all icons except for those moving
                drawArray.forEach(row => row.filter(obj => !obj.removed).forEach(icon => ctx.drawImage(icon.image, icon.x, icon.y, self.tSize, self.tSize)));
                //redraw icons to move in the new position until they achieve their destination
                moveArray.forEach(function (obj) {
                    let objDir = direction === "down" ? obj.y : obj.x;
                    let objDes = direction === "down" ? obj.destinationY : obj.destinationX;
                    let speed = 5;

                    function stop() {
                        objDir = objDes;
                        direction === "down" ? obj.y = objDir : obj.x = objDir;
                        let toChange = {};

                        //find the new position in the array of all drawn icons and replace the image 
                        drawArray.forEach(function (row) {
                            toChange = row.find(icon => icon.x === obj.x && icon.y === obj.y);
                            if (toChange) {
                                toChange.image = obj.image;
                                toChange.removed = false;
                                }
                            });
                    }

                    //if moving backwards
                    if (objDir > objDes) {
                        objDir -= speed;
                        //if an icon reached or exceeded the destination
                        if (objDir <= objDes) {
                            stop();
                        }
                    //if moving forward
                    } else {
                        objDir += speed;
                        if (objDir >= objDes) {
                            stop();
                        }
                    }
                    
                    direction === "down" ? obj.y = objDir : obj.x = objDir;

                    ctx.drawImage(obj.image, obj.x, obj.y, self.tSize, self.tSize);
                });
                //remove icons that finished moving from tha array
                if (direction === "down") {
                    moveArray = moveArray.filter(obj => obj.y !== obj.destinationY);
                } else {
                    moveArray = moveArray.filter(obj => obj.x !== obj.destinationX);
                }

                if (moveArray.length === 0) {
                    clearInterval(movement);
                }

                ctx.clearRect(0, self.gridHeight + 10, self.gridWidth - 2 * self.padding, 65);
                self.dashboard.draw(ctx);

            }, self.interval);
        }
        /**
         * finds which cell was clicked and adds it to the clicked array
         * @param {*} canvas 
         * @param {*} e 
         */
        detectCell(canvas, e) {
            let mousePosition = mousePos(canvas, e);
            this.validClick = false;
            //check if click was within the grid
            if (mousePosition.x > this.grid.padding &&
                mousePosition.x < this.grid.width + this.grid.padding &&
                mousePosition.y > this.grid.padding &&
                mousePosition.y < this.grid.height + this.grid.padding) {
                this.validClick = true;
            } else {
                return;
            }

            function checkPos(position) {

                return mousePosition.x > position.x &&
                    mousePosition.x < position.xEnd &&
                    mousePosition.y > position.y &&
                    mousePosition.y < position.yEnd
            }
            this.clicked.push(this.cellPosArr.find(checkPos));
        }

        checkButton(canvas, e){
            let mousePosition = mousePos(canvas, e);
            if (mousePosition.x >= this.dashboard.button.x &&
                mousePosition.x <= this.dashboard.button.x + this.dashboard.button.width &&
                mousePosition.y >= this.dashboard.button.y &&
                mousePosition.y <= this.dashboard.button.y + this.dashboard.button.height) {
                console.log("new game should be initiated");
                }
        }
        /**
         * finds icons to swap based on which cells were clicked
         */
        findIconsToSwap() {

            let toSwap = [];
            //find index of the clicked cells
            for (let i = 0; i < this.clicked.length; i++) {
                //the index of the icon will be the same as the index of the cell
                let iconToSwap = this.selectedIcons[this.clicked[i].row + this.selectedIcons.length / 2][this.clicked[i].column];
                iconToSwap.removed = true;
                toSwap.push({
                    ...iconToSwap
                });
            }

            return toSwap;
        }

        swap() {

            let toSwap = this.findIconsToSwap()
            let direction = this.clicked[0].x === this.clicked[1].x ? "down" : "side";

            if (direction === "down") {
                toSwap[1].destinationY = toSwap[0].y;
                toSwap[0].destinationY = toSwap[1].y;
            } else {
                toSwap[1].destinationX = toSwap[0].x;
                toSwap[0].destinationX = toSwap[1].x;
            }

            this.move(toSwap, this.selectedIcons, direction);
        }

        /**
         * checks if the swap was valid, if yes it removes the matches and resolves everything, if not swaps the icons back
         */
        async checkSwap() {
            await sleep(1000);
            let matches = this.findMatches();
            if (matches.length === 0) {
                this.swap();
                this.clicked = [];
                await sleep(1000);
                GAMESTATE.resolve = false;
                GAMESTATE.userInput = true;
            } else {
                this.resolve();
                this.updateColour();
                this.addPoints();
                this.dashboard.moves -= 1;
            }
        }
        /**
         * finds cells in which icons were matched and removed by user action, and sets colour to false for those
         */
        updateColour() {
            let userRemoved = [];
            this.clicked.forEach(clicked => {
                for(let i=0; i<this.matchesArr.length; i++) {
                    let index = this.matchesArr[i].findIndex(icon => icon.row === clicked.row + this.selectedIcons.length / 2 && icon.column === clicked.column);
                    if(index !== -1) {
                        userRemoved.push(this.matchesArr[i]);
                    }
                }
            });
            let userRemovedflat = [].concat(...userRemoved);
            let cells = this.cells;
            //removing duplicates
            let userRemovedflatU = new Set(userRemovedflat);
            userRemovedflatU.forEach(icon => cells[icon.row-this.selectedIcons.length / 2][icon.column].colour = false);
            return userRemovedflat;
        }

        addPoints() {
            //not removing duplicates means that the user will get bonus points for creating more than one match with one move
            let matches = this.updateColour();
            this.dashboard.points += matches.length * 10;
        }


        /**
         * changes icons to random in the first 6 rows (those not visible) so that there are no empty spaces and icons are different in refill
         */
        updateRefill() {
            for (let i = 0; i < game.selectedIcons.length / 2; i++) {
                game.selectedIcons[i].forEach(function (obj) {
                    obj.image = game.icons[Math.floor(Math.random() * 5)];
                    obj.removed = false;
                });
            }
        }

        /**
         * checks if there are any valid moves left by looping through the array of icons and checking for each how it can move 
         * and if this move will result in a match
         */
        checkMoves() {
            let matchFound = false;
            for (let i = this.selectedIcons.length / 2; i < this.selectedIcons.length; i++) {
                for (let j = 0; j < this.selectedIcons[i].length; j++) {
                    let movePos = [{
                            dir: "up",
                            row: i - 1,
                            column: j
                        },

                        {
                            dir: "right",
                            row: i,
                            column: j + 1
                        },

                        {
                            dir: "down",
                            row: i + 1,
                            column: j
                        },

                        {
                            dir: "left",
                            row: i,
                            column: j - 1
                        }
                    ];
                    //checks if the object exists within the grid
                    let exists = function (obj) {
                        if(obj) {
                            return obj.row >= game.selectedIcons.length / 2 &&
                                obj.row < game.selectedIcons.length &&
                                obj.column >= 0 &&
                                obj.column < game.selectedIcons[i].length
                         } else {
                            return false;
                         }
                    }
                    
                    //filter for possible moves of an icon (check if within the grid)
                    let toCheck = movePos.filter(pos => exists(pos));

                    toCheck.forEach(function (pos) {
                        let up = game.selectedIcons[pos.row - 1]? game.selectedIcons[pos.row - 1][pos.column] : null;
                        let right = game.selectedIcons[pos.row][pos.column + 1];
                        let down = game.selectedIcons[pos.row + 1]? game.selectedIcons[pos.row + 1][pos.column]: null;
                        let left = game.selectedIcons[pos.row][pos.column - 1];
                        let up2 = game.selectedIcons[pos.row - 2]? game.selectedIcons[pos.row - 2][pos.column] : null;
                        let right2 = game.selectedIcons[pos.row][pos.column + 2];
                        let down2 = game.selectedIcons[pos.row + 2]? game.selectedIcons[pos.row + 2][pos.column] : null;
                        let left2 = game.selectedIcons[pos.row][pos.column - 2];
                        let currentIcon = game.selectedIcons[i][j];


                        if (exists(up) && up.image === currentIcon.image && pos.dir !== "down") {
                            //if two images above the possible move exist and have the same image, it's a valid move to make
                            if (exists(up2) && up2.image === currentIcon.image) {
                                //console.log(currentIcon);
                                //console.log("there are two icons above if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            //if an image above and and image down are the same as the current one, it's a valid move to make
                            } else if (exists(down) && down.image === currentIcon.image && pos.dir !== "up") {
                                //console.log(currentIcon);
                                //console.log("there is one icon above and one below if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            }
                        } 

                        // if two images below the possible move exist and have the same image, it's a valid move to make
                        if (exists(down) && down.image === currentIcon.image && pos.dir !== "up") {
                            if (exists(down2) && down2.image === currentIcon.image) {
                                //console.log(currentIcon);
                                //console.log("there are two icons below if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            }
                        } 

                        //if two images to the right of the possible move exist and have the same image, it's a valid move to make
                        if (exists(right) && right.image === currentIcon.image && pos.dir !== "left") {
                            if (exists(right2) && right2.image === currentIcon.image) {
                                //console.log(currentIcon);
                                //console.log("there are two icons to the right if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            //if an image to the right and and image to the left are the same as the current one, it's a valid move to make
                            } else if (exists(left) && left.image === currentIcon.image && pos.dir !== "right") {
                                //console.log(currentIcon);
                                //console.log("there there is one icon to the right and one to the left if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            }
                        }
                        //if two images to the left of the possible move exist and have the same image, it's a valid move to make
                        if (exists(left) && left.image === currentIcon.image && pos.dir !=="right") {
                            if (exists(left2) && left2.image === currentIcon.image) {
                                //console.log(currentIcon);
                                //console.log("there are two icons to the left if you move your icon " + pos.dir)
                                matchFound = true;
                                return;
                            }
                        } 
                    });
                }
            }

            if(!matchFound) {
                console.log("no more moves DumDum!")
            }
        }

        /**
         * removes all the matches until there is nothing left
         */
        async resolve() {

           this.findMatches();
            while (this.matches.length !== 0) {

                await sleep(700);
                this.removeMatches(ctx);
                let removeArray = this.findIconsToMove()
                console.log(removeArray);

                //calculate how much time is needed for everything to be moved
                let yValues = removeArray.map(obj => Math.abs(obj.destinationY - obj.y));
                let interval = (Math.max(...yValues) / 2) * this.interval + 30;

                this.move(removeArray, this.selectedIcons, "down");
                await sleep(interval);
                this.clicked = [];
                this.updateRefill();
                this.findMatches();
            }
            this.checkMoves();
            GAMESTATE.resolve = false;
            GAMESTATE.userInput = true;
        }

    }


    class InputHandler {
        constructor(game, grid) {

            /**
             * on click detect which cell was clicked and apply hihlighting logic
             */
            canvas.addEventListener("mousedown", function (e) {
                game.checkButton(canvas, e);
                if (GAMESTATE.userInput) {
                    game.detectCell(canvas, e);

                    //if clicked within the grid
                    if (game.validClick) {
                        switch (game.clicked.length) {
                            // if there are no other highigted cells, highlight the clicked one
                            case 1:
                                grid.highlightCell(game.clicked[0].x, game.clicked[0].y, ctx);
                                break;
                            // if second cell is clicked
                            case 2:
                                // if it's the same as first, remove highlight
                                if (game.clicked[0] === game.clicked[1]) {
                                    grid.removeHighlight(game.clicked[0].x, game.clicked[0].y, ctx);
                                    game.clicked = [];
                                // if it's adjacent to the first, highlight it as well
                                // also, this is a condition when two cells can be swapped
                                } else if ((game.clicked[0].x === game.clicked[1].x &&
                                        Math.abs(game.clicked[0].y - game.clicked[1].y) <= grid.intervalY + 0.5) ||
                                    (game.clicked[0].y === game.clicked[1].y &&
                                        Math.abs(game.clicked[0].x - game.clicked[1].x) <= grid.intervalX + 0.5)) {
                                    grid.highlightCell(game.clicked[1].x, game.clicked[1].y, ctx);
                                    GAMESTATE.userInput = false;
                                    GAMESTATE.resolve = true;
                                    game.swap();
                                    game.checkSwap();
                                // if not adjacent cell clicked remove highlight from the first and add to the second
                                } else {
                                    grid.removeHighlight(game.clicked[0].x, game.clicked[0].y, ctx);
                                    grid.highlightCell(game.clicked[1].x, game.clicked[1].y, ctx);
                                    game.clicked.shift();
                                }
                                break;
                            // if there are two highighted cells
                            case 3:
                                //if the third one is same as first or second, remove the highlight from it
                                if (game.clicked[1] === game.clicked[2] || game.clicked[0] === game.clicked[2]) {
                                    grid.removeHighlight(game.clicked[2].x, game.clicked[2].y, ctx);
                                    game.clicked = game.clicked.filter(el => el !== game.clicked[2]);
                                //if the third one is different, remove highlight from the first and the second and add to the third
                                } else {
                                    grid.removeHighlight(game.clicked[0].x, game.clicked[0].y, ctx);
                                    grid.removeHighlight(game.clicked[1].x, game.clicked[1].y, ctx);
                                    grid.highlightCell(game.clicked[2].x, game.clicked[2].y, ctx);
                                    game.clicked.splice(0, 2);
                                }
                        }
                    }
                }
            });
        }
    }

    
       // let grid = new Grid();
        //grid.draw(ctx);
        //grid.fillBackground(ctx);
        //let dashboard = new Dashboard(grid);
        //dashboard.draw(ctx);
        //let tiles = new Icons(grid);
        let game = new Game();
        //game.drawLevel(ctx);
        //game.resolve();
        //let handle = new InputHandler(game, grid);
        game.init();
}