const messageList = document.querySelector("ul");
const messageForm = document.querySelector("#message");
const nickForm = document.querySelector("#nick");

const socket = new WebSocket(`ws://${window.location.host}`);

//JSON 서버<->클라이언트간 통신하기 위함. 각 통신을 주고받을시 String으로 해야됨 Object 안됨
function makeMessage(type, payload){
    const msg = {type, payload}     //object로 만들고, 
    return JSON.stringify(msg);     //Object type의 메세지를 string으로 파싱
}


socket.addEventListener("open", () => {
    console.log("Connected to Server! O")
});

socket.addEventListener("message", (message) => {
    //console.log("New message: ", message.data, "from the server");
    //console.log("Just got this: ", message, "from the server");  message 로 찍으면 객체안에 내용 다나옴
    const li = document.createElement("li");    //li로 메세지 받아서 ul 안에 넣어줌 (home.pug에서 li를 만들어주고, 그안에 메세지를 적은다음, lifㅡㄹ ul안으로 넣으면됨)
    li.innerText = message.data;    //메세지 데이터를 li로 넣어줌
    messageList.append(li); //li를 메세지 리스트에 넣어줌. 이렇게 하면 메시지를 화면에 보여줄 수 있음
})

socket.addEventListener("close", () => {
    console.log("disConnected to Server! X");
})


//서버로 메세지를 보냄
function handleSubmit(event){
    event.preventDefault();
    const input = messageForm.querySelector("input");
    console.log(input.value);
    //socket.send(input.value);
    socket.send(makeMessage("new_message", input.value));   //JSON 으로 value 변경해서 서버로 메세지 보냄

    //socket.addEventListener("message", (message) 위에서 쓰던 메소드 3줄 (내가 채팅 쳤을때 내 데이터가 나에게 오는걸 강제적으로 front에서 보여주기 위함 javascript 표출)
    const li = document.createElement("li"); 
    li.innerText = `You: ${input.value}`;
    messageList.append(li); 

    input.value = "";
}

function handleNickSubmit(event){
    event.preventDefault();
    const input = nickForm.querySelector("input");
//    socket.send({   //JavaScript object를 가지고 String 으로 만드는 가장 좋은 방법, 그 String 을 다시 JavaScript object로 만드는방법은 뭘까? 위에 makeMessage가 답임
//        type: "nickname",
//        payload: input.value,
//    });
    socket.send(makeMessage("nickname", input.value));
    //input.value = "";
}

messageForm.addEventListener("submit", handleSubmit);
nickForm.addEventListener("submit", handleNickSubmit);


// setTimeout(() => {
//     socket.send("hello from the bowser!");
// }, 1000); 



{
    type: "message";
    payload: "hello everyone!";
}

{
    type: "nickname";
    payload: "HAN";
}