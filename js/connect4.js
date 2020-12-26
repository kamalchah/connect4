// const model = require("./trivia-logic-module.js")
let player1 = ""
let player1Color = "red";

let player2 = ""
let player2Color = 'yellow';
let myturn = false;
// Selectors
let gameObj;
let currentPlayer = 0;
let arr;
let checker = 0;
// setInterval(function(){ alert("Hello"); }, 3000);
function getInfo() {
    var xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        let obj = JSON.parse(this.responseText)

        if(obj[1]==gameObj) {
            return;
        }
        player1 = obj[0];
        gameObj = obj[1];

        document.getElementById("welcome").innerHTML = player1;
        if(gameObj.winner!=null && checker==0) {
            if(player1==gameObj.winner) {
                alert("WINNER WINNER CHICKEN DINNER! ")
            }
            else if(gameObj.winner=="tie") {
                alert("Tie!")
            }
            else {
                alert("You lost!")
            }
            checker++;
        }

        if(player1==gameObj.players[0] && gameObj.currentTurn == 1) {
            myturn=true;
            currentPlayer=1;
            playerTurn.textContent = `${gameObj.players[0]}'s turn`
            //playerTurn.style.color='yellow'
        }
        else if(player1==gameObj.players[1] && gameObj.currentTurn==2) {
            myturn=true;
            currentPlayer=2;
            playerTurn.textContent = `${gameObj.players[1]}'s turn`
            //playerTurn.style.color='yellow'
        }
        else {
            if(player1==gameObj.players[0]) {
                playerTurn.textContent = `${gameObj.players[1]}'s turn`
            }
            else if(player1==gameObj.players[1]) {
                playerTurn.textContent = `${gameObj.players[0]}'s turn`
            }
            myturn=false;
        }
        addListeners();
        Cells.forEach(Cell => {
          Cell.style.backgroundColor = 'white';
        });
        playerTurn.style.color = 'black';
        player1 = gameObj.players[0]
        player2 = gameObj.players[1];

        reloadBoard(gameObj.gameBoard)
        arr = gameObj.gameBoard;
        //return (currentPlayer === 1 ? playerTurn.textContent = `${player1}'s' turn` : playerTurn.textContent = `${player2}'s turn`);
        }   
    };
    xhttp.open("GET", "/game", true);
    xhttp.send();
}
getInfo();
setInterval(function(){ getInfo(); }, 1000);


// gets tables rows data
let tableRow = document.getElementsByTagName('tr');//rows with td inside
// gets table column data
let tableData = document.getElementsByTagName('td');// all td's
//gets h1 tag referring to playerturn
let playerTurn = document.querySelector('.playerTag');
//gets all cells (circles)
const Cells = document.querySelectorAll('.Cell');//all cells
//selects resetbtn
const resetBtn = document.getElementById('resetBtn');
//selects 2 player button
const twoPlayer = document.getElementById('twoPlayer');

let winner;


for (i = 0; i < tableData.length; i ++){
    
    tableData[i].addEventListener('click', (e) =>{
        //console.log(`${e.target.parentElement.rowIndex},${e.target.cellIndex}`)
        //prints 0 and column #
        console.log("Column: " + e.target.cellIndex)
    });
};




function changeColor(e){
    // Get clicked column index
    if(gameObj.isGameDone) {
        alert("Game's over, return to profile for result")
        return;
    }
    let row = [];
    
    let column = e.target.cellIndex;//gets column clicked
    let checker = 0;

    if(!myturn) {
        alert("It's not your turn!")
        return;
    }
    for(let i = 0;i<6;i++){
        if(arr[i][column]==1 || arr[i][column]==2) {
            checker++;
        }
    }
    if(checker>=6) {
        alert("THAT ROW IS FULL!")
        console.log("ROW IS FULL!")
        return;
    }
    

    for (let i = 5; i >= 0; i--){
        if (tableRow[i].children[column].style.backgroundColor == 'white'){
            row.unshift(tableRow[i].children[column]);
            if (currentPlayer === 1){
                row[0].style.backgroundColor = 'red';
                arr[i][column] += 1;
                
                //playerTurn.textContent = `${player2}'s turn`
                //playerTurn.style.color='yellow'
                
                //post data to server of new obj

                let request = new XMLHttpRequest();

                request.onreadystatechange = function(){
                    if(this.readyState==4 && this.status==200) {
                        //console.log(this.responseText)
                    }
                }
                request.open("POST","/game")
                request.setRequestHeader("Content-Type","application/json")
                let sendObj = gameObj;
                sendObj.gameBoard = arr;
                sendObj.currentTurn=2;
                request.send(JSON.stringify(sendObj))

                return myturn=false;
            }else{
                row[0].style.backgroundColor = 'yellow';
                arr[i][column] += 2;
                //playerTurn.textContent = `${player1}'s turn`
                //playerTurn.style.color='red'

                let request = new XMLHttpRequest();
                request.onreadystatechange = function(){
                    if(this.readyState==4 && this.status==200) {
                        //console.log(this.responseText)
                    }
                }
                request.open("POST","/game")
                request.setRequestHeader("Content-Type","application/json")
                let sendObj = gameObj;
                sendObj.gameBoard = arr;
                sendObj.currentTurn=1;
                request.send(JSON.stringify(sendObj))

                return myturn=false;
            }

        }
    }
   
}

function reloadBoard(board) {
    // Get clicked column index
    let row = [];
    let checker = 0;

    for (let i = 5; i >=0; i--){
        for(let j=6;j>=0;j--){
            if(board[i][j] == 1) {
                row.unshift(tableRow[i].children[j]);
                row[0].style.backgroundColor = 'red';
            }
            else if(board[i][j] == 2) {
                row.unshift(tableRow[i].children[j]);
                row[0].style.backgroundColor = 'yellow';
            }
            else if(board[i][j]==0) {
                row.unshift(tableRow[i].children[j]);
                row[0].style.backgroundColor = 'white';
            }
        }
    }
}

function addListeners() {
  Array.prototype.forEach.call(tableData, (cell) => {
    cell.addEventListener('click', changeColor);
    // Set all Cells to white for new game.
    cell.style.backgroundColor = 'white';
  });
}
//addListeners();

function finishGame() {
      Array.prototype.forEach.call(tableData, (cell) => {
        cell.removeEventListener('click', changeColor);
    });
      alert("GAME FINISHED")
}


resetBtn.addEventListener('click', () => {
    finishGame();
    Cells.forEach(Cell => {
        Cell.style.backgroundColor = 'white';
    });
    //playerTurn.style.color = 'black';
    //playerTurn.textContent="";
});

twoPlayer.addEventListener('click', () => {
    addListeners();
    Cells.forEach(Cell => {
        Cell.style.backgroundColor = 'white';
    });
    playerTurn.style.color = 'black';
    reloadBoard(arr)
    //return (currentPlayer === 1 ? playerTurn.textContent = `${player1} turn` : playerTurn.textContent = `${player2}'s turn`);
});