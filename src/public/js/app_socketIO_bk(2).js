const socket = io();    //port 쓰거나 할 필요없이 프론트에서 알아서 실행중인 서버 찾아줌

const welcome = document.getElementById("welcome");
const form = welcome.querySelector("form");

function handleRoomSubmit(event) {
    event.preventDefault();
    const input = form.querySelector("input");
    //socket.emit("enter_room", { payload: input.value}, () => {  
         // args => 1. 이벤트(백엔드는 소켓on과 같은 이벤트 이름) ,  2.페이로드(데이터,JSON OBJECT) 3. callback
       // console.log("server id done!")
    //});
        socket.emit("enter_room", { payload: input.value}, 1, "HI", true, false );  //소켓에 여러개의 값을 싫어 줄 수 도 잇다   
         // args => 1. 이벤트(백엔드는 소켓on과 같은 이벤트 이름) ,  2.페이로드(데이터,JSON OBJECT) 3. callback
       // console.log("server id done!")
    //});
    input.value = ""
}

form.addEventListener("submit", handleRoomSubmit);
