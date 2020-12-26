let games = []; //load initial games
let users = [] //load initial users require("./users.json");

//let quizzes = {}; // initially no quizzes
// console.log(games);

let nextGameID = -1;
for(qid in games){
  if(Number(games[qid].id) >= nextGameID){
    nextGameID = Number(games[qid].id) + 1;
  }
}

//let nextGameID = 0; //don't need initialization, because we are assuming no quizzes to start

//Helper function to verify a user object exists, has a username and that a user with that name exists
function isValidUser(userObj){
  if(!userObj){
    return false;
  }
  if(!userObj.username || !users.hasOwnProperty(userObj.username)){
    return false;
  }
  return true;
}

function createUser(newUser){
  //Check the object is valid
  //This just ensures the object has a username and password
  //You may have more complex logic for your project
  if(!newUser.username || !newUser.password){
    return null;
  }

  if(users.hasOwnProperty(newUser.username)){
    //There is a user with that name already
    return null;
  }

  //Set initial values for the new user
  //newUser.questions_created = [];
  newUser.gameHistory = []
  //newUser.friends = [];

  users.push(newUser);
  //users[newUser.username] = newUser;

  return users[newUser.username];
}



/*
Allows somebody to search all users in the system and get an array of users they can see. We are assuming a user will be logged in to do this. We will assume a requesting user can access themself and any of their friends. Other users should not be returned in the result.

Inputs:
requestingUser - the object representing the user making the request (we use this to decide whether the request should be successful or not)
searchTerm - a string the user is searching for

Outputs:
An array of users that match the search term and are accessible by the requesting user.
*/
function searchUsers(requestingUser, searchTerm){
  let results = [];

  //If the user is not valid, return an empty array.
  //You could return null to indicate an error or any other value to signify the requesting user was not valid.
  if(!isValidUser(requestingUser)){
    return results;
  }

  //If users was an array, you could use a nice one line filter function call
  for(username in users){
    let user = users[username];
    //If this user matches the search term
    if(user.username.toLowerCase().indexOf(searchTerm.toLowerCase()) >= 0){
      //If the requesting user is allowed to access the matching user
      if(user.username === requestingUser.username || requestingUser.friends.includes(user.username)){
        results.push(user);
      }
    }
  }

  return results;
}

/*
Function to make friends. This is a helper function for simplicity in this case.
In your project system, you may have a function for proposing friendships, checking friend requests, and accepting. You would also want a requestingUser input parameter (a user should only be able to update their own friend data)
The function will add each user to the other's friend list, if they aren't already friends

Inputs:
userA/userB - two user IDs that you want to make friends

Outputs:
Nothing.
*/
function makeFriends(userA, userB){
  //If one of the user IDs doesn't exist, stop
  let user, user2;
  users.forEach(value => {
      if(value.username == userA) {
          user = value;
      }
      if(value.username == userB) {
        user2 = value;
      }
    });
  if(!user || !user2) {
    return;
  }

  let indexUser1 = users.findIndex(i => i.username === user.username);
  let indexUser2 = users.findIndex(i => i.username === user2.username);

  //If the users are already friends, stop
  if(users[indexUser1].friends.includes(user2)){
    return;
  }

  //Update both so they are now friends
  users[indexUser1].friends.push(users[indexUser2]);
  users[indexUser2].friends.push(users[indexUser1]);

  if(users[indexUser1].FriendRequests.includes(user2)) {
    let indexFriend1 = users[indexUser1].FriendRequests.findIndex(i => i === user2);
    users[indexUser1].FriendRequests.splice(indexFriend1,1);
  }
  else if(users[indexUser2].FriendRequests.includes(user)) {
    let indexFriend2 = users[indexUser2].FriendRequests.findIndex(i => i === user);
    users[indexUser2].FriendRequests.splice(indexFriend2,1);
  }
}

function deleteFriends(userA, userB) {
  //If one of the user IDs doesn't exist, stop
  let user, user2;
  users.forEach(value => {
      if(value.username == userA) {
          user = value;
      }
      if(value.username == userB) {
        user2 = value;
      }
    });
  if(!user || !user2) {
    return;
  }

  let indexUser1 = users.findIndex(i => i.username === user.username);
  let indexUser2 = users.findIndex(i => i.username === user2.username);

  //If the users are already friends, stop
  if(users[indexUser1].friends.includes(user2)){
    //this means they are friends, we need to remove from both lists
    let indexFriend1 = users[indexUser1].friends.findIndex(i => i === user2);
    let indexFriend2 = users[indexUser2].friends.findIndex(i => i === user);
    users[indexUser1].friends.splice(indexFriend1,1);
    users[indexUser2].friends.splice(indexFriend2,1);
  }
}


function colorMatchCheck(one, two, three, four){
    return (one === two && one === three && one === four && one !== 0 && one !== undefined);
}

function horizontal(arr){
    for (let row = 0; row < 6; row++){
        for (let col =0; col < 4; col++){
            //console.log(arr[row][col] + " " + arr[row][col+1] + " " +  arr[row][col+2] + " " +  arr[row][col+3])
           if (colorMatchCheck(arr[row][col],arr[row][col+1], arr[row][col+2], arr[row][col+3])){
               return true;
           }
        }
    }
}

function vertical(arr){
    for (let col = 0; col < 6; col++){
        for (let row = 0; row < 3; row++){
            //console.log(arr[row][col] + " " + arr[row+1][col] + " " +  arr[row+2][col] + " " +  arr[row+3][col])
            if (colorMatchCheck(arr[row][col], arr[row+1][col], arr[row+2][col], arr[row+3][col])){
                return true;
            };
        }   
    }
}

function diagonal(arr){
    for(let col = 0; col < 4; col++){
        for (let row = 0; row < 3; row++){
            // console.log(arr[row][col] + " " + arr[row+1][col+1] + " " +  arr[row+2][col+2] + " " +  arr[row+3][col+3])
            if (colorMatchCheck(arr[row][col], arr[row+1][col+1], arr[row+2][col+2], arr[row+3][col+3])){
                    return true;
                }
            }
        }

}

function diagonal2(arr){
    for(let col = 0; col < 4; col++){
        for (let row = 5; row > 2; row--){
            //console.log(arr[row][col] + " " + arr[row-1][col+1] + " " +  arr[row-2][col+2] + " " +  arr[row-3][col+3])
            if (colorMatchCheck(arr[row][col], arr[row-1][col+1],arr[row-2][col+2],arr[row-3][col+3])){
                    return true;
            }
        }
    }
}

function drawCheck(arr){
    let fullCell = []
    for (let i=0; i < arr.length; i++){
        for(let j=0;j<7;j++) {
            //console.log(arr[i][j])
            if(arr[i][j]!=0) {
                fullCell.push(arr[i][j])
            }
        }
    }
    if (fullCell.length === 42){
        return true;
    }
}
function winCheck(board) {
  if(horizontal(board) || vertical(board) || diagonal2(board) || diagonal(board)) {
    return true;
  }
}

const assert = require("assert");
let userA = createUser({username: "kowalski", password: "kowalski", profilePic:"https://i.gyazo.com/54ddd66424b6efe51e8acc1d6af67a8c.png",
email:"kowalski@gmail.com", GamesWon:5, GamesLost:1,FriendRequests:[], friends:[], isPublic:true, isOnline:false,gameRequests:[]});
let userB = createUser({username: "private", password:"private", profilePic:"https://i.ytimg.com/vi/P0hOTR509NQ/maxresdefault.jpg",
  email:"private@gmail.com", GamesWon:4, GamesLost:2,FriendRequests:[], friends:[], isPublic:true, isOnline:false,gameRequests:[]});
let userC = createUser({username: "skipper", password:"skipper", profilePic:"https://i.gyazo.com/6b8505ff99d12178069a671ffbda5cf9.png",
  email:"skipper@gmail.com", GamesWon:3, GamesLost:3,FriendRequests:[], friends:[], isPublic:true, isOnline:false,gameRequests:[]});
let userD = createUser({username: "rico", password: "rico", profilePic:"https://i.gyazo.com/b2a2fde177e31393df51cc6269d2c7e2.png",
  email:"rico@gmail.com", GamesWon:2, GamesLost:4,FriendRequests:[], friends:[], isPublic:true, isOnline:false,gameRequests:[]});
let userE = createUser({username: "jim", password: "jim", profilePic:"https://i2.wp.com/www.sporcle.com/blog/wp-content/uploads/2020/04/4-2.jpg?resize=1280%2C720&ssl=1",
  email:"jim@gmail.com", GamesWon:1, GamesLost:5,FriendRequests:[], friends:[], isPublic:false, isOnline:false,gameRequests:[]});

let userF = createUser({username: "ariane", password: "ariane", profilePic:"https://3er1viui9wo30pkxh1v2nh4w-wpengine.netdna-ssl.com/wp-content/uploads/prod/sites/45/2019/11/MS_Penguin-Counting-Story_1900x800.jpg",
  email:"jim@gmail.com", GamesWon:1, GamesLost:5,FriendRequests:[], friends:[], isPublic:false, isOnline:false,gameRequests:[]});

let gameA = {gameID:1,isPublic:true,isFO:false,players:[users[0].username,users[1].username],currentTurn:1,isGameDone:false,winner:null,gameBoard:[
[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0],
[0,0,0,0,0,0,0],
[2,2,0,1,1,1,2],
[1,2,2,1,2,2,2]
]}

let gameB = {gameID:2,isPublic:true,isFO:false,players:[users[0].username,users[1].username],currentTurn:2,isGameDone:false,winner:null,gameBoard:[
[1,2,1,2,0,1,1],
[1,2,1,1,0,2,1],
[2,1,2,2,1,2,2],
[1,2,1,2,1,2,1],
[2,1,2,2,1,1,2],
[1,2,2,1,2,2,1]
]}

let gameC = {gameID:3,isPublic:true,isFO:false,players:[users[0].username,users[1].username],currentTurn:1,isGameDone:true,winner:users[0].username,gameBoard:[
[1,1,0,0,0,0,0],
[1,1,0,0,0,0,0],
[1,2,0,0,0,0,0],
[2,2,0,0,0,0,0],
[2,1,0,2,1,1,2],
[1,2,2,1,2,2,2]
]}
//users.push(userA,userB,userC,userD,userE)
games.push(gameA,gameB,gameC)
makeFriends("kowalski", "private");
makeFriends("kowalski", "skipper");
// makeFriends("kowalski", "jim");
makeFriends("kowalski", "rico");
makeFriends("kowalski", "jim");
makeFriends("jim", "ariane");
makeFriends("rico","private");
makeFriends("rico","skipper");

users[0].FriendRequests.push(users[5])

deleteFriends("kowalski","private");
makeFriends("kowalski","private")
//console.log("kowalski friends: ")
//console.log(users["kowalski"].friends)



module.exports = {
  users,
  games,
  winCheck,
  drawCheck,
  createUser,
  searchUsers,
  deleteFriends,
  makeFriends
}
