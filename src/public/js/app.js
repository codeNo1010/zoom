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
function showRoom() {    // 이게 나중에 콜백호출되는거임
    welcome.hidden = true;
    room.hidden = false;
    const h3 = room.querySelector("h3");
    h3.innerText = `Room ${roomName}`;
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



socket.on("welcome", () => {
    addMessage("someone joined!");
});