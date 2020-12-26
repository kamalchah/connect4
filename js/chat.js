let socket = null; 
let name;
var xhttp = new XMLHttpRequest();
xhttp.onreadystatechange = function() {
if (this.readyState == 4 && this.status == 200) {
	console.log(this.responseText)
    let obj = JSON.parse(this.responseText)

    player1 = obj[0];
    name = player1;
    joinChat();
    }   
};
xhttp.open("GET", "/game", true);
xhttp.send();

function joinChat(){
	//let textbox = document.getElementById("name");
	//let name = textbox.value;
	//name is defined
	if(name.length > 0){
		if(socket == null){
			socket = io();
			socket.on("newuser", addUser);
			socket.on("newmsg", newMessage);
			socket.on("init", initMessages);
			socket.emit("register", name);
		}
	}else{
		alert("You need a name.");
	}
}

function sendMessage(){
	let msg = document.getElementById("message").value;
	document.getElementById("message").value="";
	if(msg.length > 0){
		socket.emit("newmsg", msg);
	}
}

function addUser(name){
	console.log("User joined: " + name);
	let newLI = document.createElement("li");
	let text = document.createTextNode(name + " joined the chat.");
	newLI.appendChild(text);
	document.getElementById("messages").appendChild(newLI);
}

function initMessages(data){
	let msg = JSON.parse(data).messages;
	msg.forEach(elem => {
		newMessage(elem);
	})
}

function newMessage(message){
	console.log("New message: " + message);
	let newLI = document.createElement("li");
	let text = document.createTextNode(message);
	newLI.appendChild(text);
	document.getElementById("messages").appendChild(newLI);
}