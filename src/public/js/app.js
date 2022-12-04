const socket = io();    //port 쓰거나 할 필요없이 프론트에서 알아서 실행중인 서버 찾아줌

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");
const room = document.getElementById("room");

room.hidden = true;

let roomName;

// function backendDone() {    // 이게 나중에 콜백호출되는거임
//     console.log("backend done");
// }

function addMessage(message){
    const ul = room.querySelector("ul");
    const li = document.createElement("li");
    li.innerText = message;
    ul.appendChild(li);
}

function backendDone(msg) {    // 이게 나중에 콜백호출되는거임
    console.log(`The backend says: `, msg);
}

function handleMessageSubmit(event){
    event.preventDefault();
    const input = room.querySelector("#msg input"); //msgForm 안에 있는 input 을 찾아온다. (nameForm 안에도 input이 있기때문에 명시해줌)
    const value = input.value;
    socket.emit("new_message", input.value, roomName, () => {  
        //new_message를 소켓으로 백엔드에 보낸후 후처리 함수 를 추가함 addMessage , 이거 작성 후 server.js 수정
        //내가 들어 있는 방으로 메세지를 보내기 위해 roomName arg를 추가함 back에서 받을예정
        addMessage(`You: ${value}`);
    }); 
    input.value = "";
}

function handleNicknameSubmit(event) {
    event.preventDefault();
    const input = room.querySelector("#name input");
    socket.emit("nickname", input.value);
}

function showRoom() {    // 이게 나중에 콜백호출되는거임
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
    const msgForm = room.querySelector("#msg");     // 있는 방에 메세지 보낼준비
    const nameForm = room.querySelector("#name");   //기존 1개의 Form에서 #ID값으로 분기처리
    msgForm.addEventListener("submit", handleMessageSubmit);
    nameForm.addEventListener("submit", handleNicknameSubmit);
}

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    //socket.emit("enter_room", { payload: input.value}, () => {  
         // args => 1. 이벤트(백엔드는 소켓on과 같은 이벤트 이름) ,  2.페이로드(데이터,JSON OBJECT) 3. callback
       // console.log("server id done!")
    //});
        //socket.emit("enter_room", input.value, backendDone);    //함수는 항상 마지막 args로 와야됨  
        socket.emit("enter_room", input.value, showRoom);
        roomName = input.value;
         // args => 1. 이벤트(백엔드는 소켓on과 같은 이벤트 이름) ,  2.페이로드(데이터,JSON OBJECT) 3. callback
       // console.log("server id done!")
    //});
    input.value = ""
}

form.addEventListener("submit", handleRoomSubmit);



socket.on("welcome", (user, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${user} arrived!`);
});

socket.on("bye", (left, newCount) => {
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName} (${newCount})`;
    addMessage(`${left} left!`);
});

//메세지를 상대방이 받았을때 이벤트 
// socket.on("new_message", (msg) => {
//     addMessage(msg);
// });      이거를 아래에서 1줄로 줄이면
socket.on("new_message", addMessage);

//socket.on("room_change", console.log); [2]
//socket.on("room_change", (msg) => console.log(msg)); [1] 윗줄이랑 똑같음
// [3] 재수정 입장시 room_change를 활용한 룸list 정보 갱신 
socket.on("room_change", (rooms) => {
    const roomList = welcome.querySelector("ul");
    roomList.innerHTML = "";
    if(rooms.length === 0) {
        return;
    }
    rooms.forEach(room => {
        const li = document.createElement("li");
        li.innerText = room;
        roomList.append(li);
    });

});