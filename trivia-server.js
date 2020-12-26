const express = require('express');

var bodyParser = require("body-parser");
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

const path = require("path");
const model = require("./trivia-logic-module.js")

const fs = require("fs");

let curGameID;// GLOBAL GAME ID, USED TO LOAD GAME
let curUser;

//3 arrays for create game queue
let friendsonlyarr=[]
let publicarr=[]
let privatearr=[]

const session = require('express-session');

app.use(express.static(path.join(__dirname, "css")));
app.use(express.static(path.join(__dirname, "js")));
app.use(express.static(path.join(__dirname, 'c4')));
app.use(express.static('c4'));

//main page
app.use('/', express.static('c4'))

//max age of 100 minutes
app.use(session({ secret: 'KQLKPJNGMNUEAM0203', cookie:{maxAge: 6000000}}))


app.use(express.json())
//app.use(express.static(".");
app.set("view engine", "pug");

app.get("/",function(req,res) {
  if(req.session.loggedin){//if logged in send game file
    if(curGameID) {
      res.sendFile(__dirname + '/c4/c4.html');
    }
    else {
      res.redirect("/profile")//if no gameID then redirect to profile, select a game to load
    }
  }
  else {
    res.redirect('/login')
  }
});

app.get("/games/:gid", function(req,res) {//get gameboard with gameID
  let gID = req.params.gid;
  console.log("gID: " + gID)
  let gameList = model.games;
  let reqGame;

  gameList.forEach(value => {//filter games and get gameID
    if(req.session.loggedin){
      if(value.gameID == gID) {
         reqGame = value;
         curGameID = gID;
         console.log(curGameID)
      }
    }
  });

  if(req.session.loggedin){//load for gameID
    res.sendFile(__dirname + '/c4/c4.html');
  }
  else {
    res.redirect('/login')
  }
})

app.post("/games/:gid", function(req,res) {//post new game object and replace it,check for win and tie
  let gID = req.params.gid;
  let gameList = model.games;
  let reqGame;
  let username = req.session.username;

  gameList.forEach(value => {
    if(req.session.loggedin){
      if(value.gameID == gID) {
         reqGame = value;
         //curGameID = gID;
      }
    }
  });

  let indexofG = model.games.findIndex(i => i.gameID == gID);
  model.games[indexofG].isGameDone=true;
  if(model.games[indexofG].players[0]==username) {
    model.games[indexofG].winner=model.games[indexofG].players[1];
  }
  else if(model.games[indexofG].players[1]==username) {
    model.games[indexofG].winner=model.games[indexofG].players[0];
  }

  if(req.session.loggedin){
    res.redirect("/profile");
  }
  else {
    res.redirect('/login')
  }
})

app.get("/search",function(req,res){//get search page, display all public users
  if(!req.session.loggedin) {
    res.redirect("/login")
    return;
  }

  let username = req.session.username;
  
  let userlist = model.users;
  let requestingUser;

  userlist.forEach(value => {
    if(req.session.loggedin){
      if(value.username === username) {
         requestingUser = value;
      }
    }
  });
  res.render("search.pug", {
      reqUser:requestingUser,
      userArr:model.users
    })
})

app.post("/search",function(req,res){//return all that match search parameters
  if(!req.session.loggedin) {
    res.redirect("/login");
    return;
  }

  let username = req.session.username;
  let reqUser = req.body.user;

  let userlist = model.users;
  let holderArr = [];

  userlist.forEach(value => {
    if(req.session.loggedin){
      if(value.username === username) {
         requestingUser = value;
      }
      if(value.username.includes(reqUser)) {
        holderArr.push(value)
      }
    }
  });
  res.render("search.pug", {
      reqUser:requestingUser,
      userArr:holderArr
    })
})

app.get("/game",function(req,res){//initial GET for connect4.js, sends current game object with username
  //let gameObj = req.body;
  if(!curGameID) {
    //console.log("GAME ID NOT INIT!")
    res.redirect("/profile")
    return;
  }
  //console.log("User Func curGameID: " + curGameID)
  let indexofG = model.games.findIndex(i => i.gameID == curGameID);
  res.send([req.session.username,model.games[indexofG]]);
})

app.get("/creategame",function(req,res) {//sends createGame page
  if(!req.session.loggedin) {
    res.redirect("/login")
    return;
  }

  let username = req.session.username;
  
  let userlist = model.users;
  let requestingUser;

  userlist.forEach(value => {
    if(req.session.loggedin){
      if(value.username === username) {
         requestingUser = value;
      }
    }
  });
  res.render("creategame.pug", {
      reqUser:requestingUser,
      userArr:model.users
    })
})

app.post("/creategame",function(req,res) {//creates game and handles good/bad inputs
  let username = req.session.username;
  let username2;
  let pub = req.body.isPublic;
  let idHolder = 0;
  if(!pub) {
    res.status(404).send("Please select game privateness...")
    return;
  }
  if(!req.session.loggedin) {
    res.redirect("/login")
    return;
  }
  model.games.forEach(value => {
    if(value.gameID > idHolder) {
      idHolder=value.gameID;
    }
  })
  idHolder++;//this is the new gameID incase we need to create a new game!
  let userHolder;
  if(!req.body.user) {
    //if queue == 1, create game with other, else if queue == 0, just add them
    if(pub=="public") {
      if(publicarr.length==0) {
        publicarr.push(username);
        res.redirect("/creategame")
        return;
      }
      else if(!publicarr.includes(username)){
        username2=publicarr[0];
        publicarr = []
        //create game
        let gameC = {gameID:idHolder,isPublic:true,isFO:false,players:[username,username2],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
        model.games.push(gameC);
        res.redirect("/profile")
        return;
      }
      else {
        res.status(404).send("You are already in the public queue! Wait for a game to appear on your profile page")
      }

    }
    else if(pub=="private") {
      if(privatearr.length==0) {
        privatearr.push(username);
        res.redirect("/creategame")
        return;
      }
      else if(!privatearr.includes(username)){
        username2=privatearr[0];
        privatearr = []
        //create game
        let gameC = {gameID:idHolder,isPublic:false,isFO:false,players:[username,username2],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
        model.games.push(gameC);
        res.redirect("/profile")
        return;
      }
      else {
        res.status(404).send("You are already in the private queue! Wait for a game to appear on your profile page")
        return;
      }
    }
    else if(pub=="fo") {
      if(friendsonlyarr.length==0) {
        friendsonlyarr.push(username);
        res.redirect("/creategame")
        return;
      }
      else if(!friendsonlyarr.includes(username)){
        username2=friendsonlyarr[0];
        friendsonlyarr = []
        //create game
        let gameC = {gameID:idHolder,isPublic:false,isFO:true,players:[username,username2],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
        model.games.push(gameC);
        res.redirect("/profile")
        return;

      }
      else {
        res.status(404).send("You are already in the friends only queue! Wait for a game to appear on your profile page")
        return;
      }
      //res.redirect("/creategame")
    }
  }

  else {
    let user = req.body.user;
    model.users.forEach(value =>{
      if(value.username==user) {
        userHolder=value;
      }
    });
    if(!userHolder) {
      res.send("User does not exist!")
      return;
    }
    else if(userHolder) {
      //send game request
      let indexofp = model.users.findIndex(i => i === userHolder);
      model.users[indexofp].gameRequests.push([username,pub]);
      res.redirect("/profile")
      return;
    }
  }

  // let userlist = model.users;
  // let holderArr = [];

  // userlist.forEach(value => {
  //   if(req.session.loggedin){
  //     if(value.username === username) {
  //        requestingUser = value;
  //     }
  //     if(value.username.includes(reqUser)) {
  //       holderArr.push(value)
  //     }
  //   }
  // });
  //res.redirect("/profile")
})

app.post("/acceptG", function(req, res, next){//accept game request
  let user = req.session.username;
  let userlist = model.users;

  let holder = JSON.parse(req.body.user);
  let requestUser = holder[0];
  let pub = holder[1];
  let requestToFriend;


  let newID = 0;
  model.games.forEach(value => {
    if(value.gameID > newID) {
      newID = value.gameID;
    }
  })
  let gameC;
  newID++;
  if(pub=="public") {
    gameC = {gameID:newID,isPublic:true,isFO:false,players:[user,requestUser],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
  }
  else if(pub=="private") {
    gameC = {gameID:newID,isPublic:true,isFO:false,players:[user,requestUser],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
  }
  else if(pub=="fo") {
    gameC = {gameID:newID,isPublic:false,isFO:true,players:[user,requestUser],currentTurn:1,isGameDone:false,winner:null,gameBoard:[[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0],[0,0,0,0,0,0,0]]}
  }
  model.games.push(gameC)

  let indexofP = model.users.findIndex(i => i.username === user);
  let indexofP2 = model.users[indexofP].gameRequests.findIndex(i => i[0] == requestUser);
  model.users[indexofP].gameRequests.splice(indexofP2,1)
  res.redirect("/profile")

})


app.post("/declineG", function(req, res, next){//decline game request
  let user = req.session.username;
  let requestUser = JSON.parse(req.body.user);

  let indexofP = model.users.findIndex(i => i.username === user);
  let indexofP2 = model.users[indexofP].gameRequests.findIndex(i => i[0] == requestUser[0]);
  model.users[indexofP].gameRequests.splice(indexofP2,1)

  res.redirect("/profile");
})


app.post("/game",function(req,res){//connect4.js POSTS information here, checks for win and returns appropriate array
  let recObj = req.body;
  let gameID = recObj.gameID;
  let gameList = model.games;

  let indexofG = gameList.findIndex(i => i.gameID === gameID);
  if(!indexofG) {
    res.status(404).send("Game Not Found")
  }
  model.games[indexofG]=recObj;

  if(model.winCheck(recObj.gameBoard) && !model.games[indexofG].isGameDone){
    //find winner
    if(recObj.currentTurn==1) {
      model.games[indexofG].winner = model.games[indexofG].players[1];

      let indexofp1 = model.users.findIndex(i => i.username == model.games[indexofG].players[1]);//winner
      let indexofp2 = model.users.findIndex(i => i.username == model.games[indexofG].players[0]);//loser
      model.users[indexofp1].GamesWon+=1;
      model.users[indexofp2].GamesLost+=1;
      console.log(model.users[indexofp2].GamesWon + " " + model.users[indexofp1].GamesLost)
    }
    else {
      model.games[indexofG].winner = model.games[indexofG].players[0];
      
      let indexofp1 = model.users.findIndex(i => i.username == model.games[indexofG].players[1]);//loser
      let indexofp2 = model.users.findIndex(i => i.username == model.games[indexofG].players[0]);//winner
      model.users[indexofp2].GamesWon+=1;
      model.users[indexofp1].GamesLost+=1;
      console.log(model.users[indexofp2].GamesWon + " " + model.users[indexofp1].GamesLost)
    }
    model.games[indexofG].isGameDone=true;
    return;
  }
  else if(model.drawCheck(recObj.gameBoard)) {
    //draw
    model.games[indexofG].isGameDone=true
    model.games[indexofG].winner="tie";
    console.log("TIE! ")
  }
})

app.post("/profilePub",function(req,res) {//changes profile privateness
  let username;
  let pub = req.body.isPublic;
  if(req.session.loggedin){
    username = req.session.username;
    console.log("user requesting: " + username)
  }
  else {
    res.redirect("/login")
    return;
  }
  let userlist = model.users;
  let requestingUser;

  let indexUser1 = userlist.findIndex(i => i.username == username);
  if(model.users[indexUser1].isPublic && pub=="private") {
    model.users[indexUser1].isPublic = false;
  }
  else if(!(model.users[indexUser1].isPublic) && pub=="public") {
    model.users[indexUser1].isPublic = true;
  }
  res.redirect("/profile");
})

app.get("/users/:user",function(req,res){//returns profile of user if public or friends
  let username;
  if(req.session.loggedin){
    username = req.session.username;
    console.log("user requesting: " + username)
  }
  let username2 = req.params.user;
  let userlist = model.users;
  let requestingUser, displayUser;

  userlist.forEach(value => {
    if(req.session.loggedin){
      if(value.username === username) {
         requestingUser = value;
      }
    }
    if(value.username == username2) {
      displayUser = value;
    }
  });

  if(!displayUser) {//if user doesnt exist
    res.status(404).send("User does not exist!");
    return;
  }

  let gameList = model.games;
  let holder = [];
  let holder2 = [];

  gameList.forEach(value => {
    if(value.players.includes(displayUser.username)) {
      if(value.isGameDone) {//if games done, add to hodler2
        if(!value.isPublic && !value.isFO) {//if its private and reqUser is one of the participants, add it to holder2
          if(value.players.includes(requestingUser.username)) {
            holder2.push(value)
          }
        }
        else if(value.isPublic) {
          holder2.push(value)
        }
        else if(value.isFO && displayUser.friends.includes(requestingUser.username)) {
          holder2.push(value)
        }
      }
      else {
        if(!value.isPublic && !value.isFO) {//if its private and reqUser is one of the participants, add it to holder2
          if(value.players.includes(requestingUser.username)) {
            holder.push(value)
            console.log("1")
          }
        }
        else if(value.isPublic) {
          holder.push(value);
          console.log("2")
        }
        else if(value.isFO && displayUser.friends.includes(requestingUser.username)) {
          holder.push(value)
          console.log("3")
        }
      }
    }
  })

  //if game array is empty(means no active games for this user)
  //give a string empty for pug to display a empty array
  if(holder.length==0) {
    holder = "empty";
  }
  if(holder2.length==0) {
    holder2="empty"
  }
  let holder3 = (displayUser.GamesWon/(displayUser.GamesWon+displayUser.GamesLost))*100
  
  if(displayUser.isPublic){
    res.render("viewprofile.pug", {
      user:displayUser,
      gameArr:holder,
      gameArr2:holder2,
      percentage:holder3
    })
    return;
  }
  else if(!displayUser.isPublic && displayUser.friends.includes(requestingUser)) {
      res.render("viewprofile.pug", {
      user:displayUser,
      gameArr:holder,
      gameArr2:holder2
    })
      return;
  }
  // else condition if the user exists but is private
  else {
    res.status(401).send("Not authorized. User is private!");
  }
})

app.get("/users",function(req,res){//returns to profile or login
  if(req.session.loggedin) {
    res.redirect("/profile")
    }
    else {
      res.redirect('/login');
    }
})

app.get("/profile",function(req,res) {//loads profile with all info
  if(req.session.loggedin) {
    let username = req.session.username;
    console.log("PROFILE: " + username)
    let userlist = model.users;
    let requestingUser;

    let gameList = model.games;

    let holder = [];
    let holder2 = [];

    gameList.forEach(value => {
      if(value.players.includes(username)) {
        if(value.isGameDone) {
          holder2.push(value)//gameArr2
        }
        else {
          holder.push(value);//gameArr
        }
      }
    })

    userlist.forEach(value => {
      if(value.username == username) {
          requestingUser = value;
      }
    });
    let holder3 = (requestingUser.GamesWon/(requestingUser.GamesWon+requestingUser.GamesLost))*100

    res.render('profile.pug', {
      user:requestingUser,
      gameArr:holder,
      gameArr2:holder2,
      percentage:holder3
    }
  )}
  else{
    res.redirect('/login')
  }
});

app.get("/login",function(req,res) {//renders login page
  res.render('login.pug')});

app.post("/login",login)//renders login info

app.get("/logout", logout)//logs out

app.get("/forgotpass",function(req,res) {
  res.render('forgotpass.pug')});//forgotpass apge

app.get("/signup",function(req,res) {//loads signup page
  if(req.session.loggedin) {
    res.redirect("/profile")
  }
  res.render('signup.pug')});

app.post("/signup",signup);
// Auth function that can be passed to
// For a new session, loggedin does not exist
//  until we define it in signup, so req.session.loggedin returns null
function auth(req, res, next) {
    if(!req.session.loggedin) {
        res.redirect("login.pug", {
          loggedin:false
        })
        return;
    }
}

// Signup function get username and password from req.body
// and find user in users array to validate the user does not
// already exists (prevent username duplicates)
function signup(req, res, next) {
    let username = req.body.username;
    let password = req.body.password;

    let user;
    model.users.forEach((value) => {
        if(value.username == username) {
            user = value;
        }
    })

    if(user) {
        res.status(401).send("User already exists.");
        return;
    } else {
      //https://i.pinimg.com/originals/f4/97/71/f497716cb0550463349750966e41070f.png
      // please use this url for signup
        user = {username: username, password: password, profilePic:req.body.url, email:req.body.email, GamesWon:0,GamesLost:0,FriendRequests:[],friends:[],isPublic:true, isOnline:true,gameRequests:[]};
        model.users.push(user);
        req.session.loggedin = true;
        req.session.username = username;
        res.status(200);
        res.redirect("/")
        //res.status(200).send("Signed up.");
    }
}

// Login function get username and password from req.body
// and find user in users array
function login(req, res, next) {
    let username = req.body.username;
    curUser = username;
    let password = req.body.password;

    let user;
    let userlist = model.users;

    userlist.forEach(value => {
      if(value.username == username) {
          user = value;
      }
    });
    
    // console.log("username " + username + " password " + password)
    // console.log("USER " + user)

    if(user) {
        if(user.password == password) {
            req.session.loggedin = true;
            req.session.username = username;
            let indexUser1 = userlist.findIndex(i => i.username === username);
            model.users[indexUser1].isOnline = true;
            console.log(model.users[indexUser1].username)
            res.status(200);
            res.redirect("/profile");
        }
    } 
    else {
        res.status(401).send("Not authorized. Invalid username or incorrect password.");
    }
}

// Logout just set the session variable loggedin to false
//  to fail the auth function.
function logout(req, res, next) {
    if(req.session.loggedin) {
        let userlist = model.users;
        let username = req.session.username;
        let indexUser1 = userlist.findIndex(i => i.username === username);
        model.users[indexUser1].isOnline = false;
        req.session.loggedin = false;
        res.status(200);
        
    }
    
    res.status(404);//need to login
    res.redirect("/login")
}

//this should add friends if valid
app.post("/addF", function(req, res, next){
  console.log("Getting user with name: " + req.body.user);

  let user = req.session.username;
  let userlist = model.users;

  let requestUser = req.body.user;
  let requestToFriend;

  userlist.forEach(value => {
    if(value.username == user) {
        user = value;//person thats logged in
    }
    if(value.username == requestUser) {
      requestToFriend = value;//person we're trying to add
    }
  });


  if(!requestToFriend){
    res.status(404).send("Unknown user")
  }
  else {
    if(user.friends.includes(requestToFriend)) {
      res.status(404).send("You are already friends!")
      //this should prevent people that are already friends to become friends again
    }
    else if(user.FriendRequests.includes(requestToFriend)) {
      model.makeFriends(user.username, requestToFriend.username);
      console.log(user.username + " and " + requestToFriend.username + " are now friends!")
      res.status(200).redirect("/profile");//they are now friends
    }
    else {//need to send friend request
      let indexUser1 = model.users.findIndex(i => i.username === user.username);
      let indexUser2 = model.users.findIndex(i => i.username === requestToFriend.username);
      if(!model.users[indexUser2].FriendRequests.includes(user)) {
        model.users[indexUser2].FriendRequests.push(user);
        res.status(200).redirect("/profile");;
      }
      //res.redirect("/profile")
      
    }
  }
  //res.redirect("/profile")

})

//remove friends if valid
app.post("/remF", function(req, res, next){
  console.log("Getting user with name: " + req.body.user);

  let user = req.session.username;
  let userlist = model.users;

  let requestUser = req.body.user;
  let requestToFriend;

  userlist.forEach(value => {
    if(value.username == user) {
        user = value;//person thats logged in
    }
    if(value.username == requestUser) {
      requestToFriend = value;//person we're trying to add
    }
  });

  if(!requestToFriend){
    res.status(404).send("Unknown user")
    return;
  }
  else {
    if(user.friends.includes(requestToFriend)) {
      model.deleteFriends(user.username,requestToFriend.username);
      res.status(200);
      res.redirect("/profile")
      //this should prevent people that are already friends to become friends again
    }
    else if(user.FriendRequests.includes(requestToFriend)) {
      let indexUser1 = userlist.findIndex(i => i.username === user.username);
      let index2 = model.users[indexUser1].FriendRequests.findIndex(i => i.username === requestToFriend.username);
      model.users[indexUser1].FriendRequests.splice(index2,1);
      res.status(200)
      res.redirect("/profile")
    }
    
    else {//need to send friend request
      res.status(404).send("Error, you cannot delete a friend that you are not friends with!")    
    }
  }

})


const http = require("http");
let server = http.createServer(app);
const io = require("socket.io")(server);

let msgs = []

//socket.io for global chatbox
io.on('connection', socket =>{
  console.log("A connection was made.");

  //add events for that socket
  socket.on('disconnect', () => {
    console.log("Somebody left.");
  })
  
  socket.on("register", name => {
    socket.username = curUser;
    console.log("User joined: " +  socket.username);
    socket.emit('init', JSON.stringify({messages: msgs}));
    io.emit("newuser", name);
  })
  
  socket.on("newmsg", message => {
    message = socket.username + ": " + message
    msgs.push(message);
    io.emit("newmsg", message);
  })
})

server.listen(3000);