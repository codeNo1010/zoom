import http from "http";
//import WebSocket, {WebSocketServer} from "ws";
//import SocketIo from "socket.io";     밑에 instrument 때문에 소켓서버를 변경함(admin을 사용하기 위해)
import {Server} from "socket.io";
import express from "express";
import { instrument } from "@socket.io/admin-ui";

const app = express();

//set view engine by pug
app.set("view engine", "pug");  //템플릿 엔진 지정
app.set("views", __dirname + "/views"); //템플릿 위치 지정

app.use("/public", express.static(__dirname + "/public"));  //public URL 생성 후 유저에게 파일 공유 (app.js), public 폴더를 유저에게 보여주는 개념

//app route 설정
app.get("/", (req, res) => res.render("home")); //home.pug를 렌더링 해주는 핸들러를 만들었음
app.get("/*", (req, res) => res.redirect("/")); //url 이상하게 치면 무조건 홈으로 보내버림ㅋㅋ

const handleListen = () => console.log(`Listening on http://localhost:3000`);
//app.listen(3000, handleListen);   서버시작하는 방법을 변경함 <- express 기반의 http 서버 ,  TOBE WebSocket Server Start
//  server.js 는 백엔드에서 구동 , app.js 는 프론트엔드에서 구동됨

const httpServer = http.createServer(app);  //http 서버

//const wss = new WebSocketServer({ server });   // WebSocket Server  위에 http서버와 웹소켓 서버 동시에 사용 하는 구조(:3000)
//2개가 같은 포트에 있길 원하기 때문에 이렇게 만들었지 꼭 이렇게 안해도됨

//위의 WebSocketServer 대신 SocketIO 서버로 http 위에 만들어줌
//const wsServer = SocketIo(httpServer);
const wsServer = new Server(httpServer, {   //소켓 admin 때문에 다시 변경해줌
    cors: {
        origin: ["https://admin.socket.io"],
        credentials: true,
    },
});  
//서버 어드민 추가설정      DOCS_URL : socket.io/docs/v4/admin-ui/
instrument(wsServer, {
    auth: false,
});

// done 콜백으로 사용함 10초후 app.js에서 실행됨
// wsServer.on("connection", (socket) => {
//     socket.on("enter_room", (msg, done) => {
//         console.log(msg);
//         setTimeout(() => {
//             done();
//         }, 10000);
//     });
// });


function publicRooms() {
    //const sids = wsServer.sockets.adapter.sids;   
    //const rooms = wsServer.sockets.adapter.rooms;
    //각종 정보를 소켓에서 가져오는 방법인데, 아래와 같이 리펙토링 한다. 위에가 첫번째 로직 아래가 2번째 로직
    //const {sockets: {adapter: {sids, rooms}}} = wsServer;
    //아래가 3번째 로직 (위의 2번째랑 똑같음))
    const {
        sockets: {
            adapter: { sids, rooms },
        },
    } = wsServer;
    const publicRooms = [];
    rooms.forEach((_, key) => {
        if (sids.get(key) === undefined) {
            publicRooms.push(key);
        }
    });
    return publicRooms;
}

function countRoom(roomName) {  //입장하거나 나갈때 호출할 방에 몇명인지 계산하는 함수
    return wsServer.sockets.adapter.rooms.get(roomName)?.size;
}

// 여러개의 args를 socket.io 를 통해 전달 가능
wsServer.on("connection", (socket) => {
    socket["nickname"] = "Anonymous";
    socket.onAny((event) => {
        //console.log(wsServer.sockets.adapter);    wsServer.sockets.adapter.sids or .rooms 모든정보 볼 수 있음 
        console.log(`Socket Event: ${event}`);
    });
    socket.on("enter_room", (roomName, done) => {
        //console.log(socket.id);     //소켓 ID가 찍히는데 아래의 socket.rooms값이랑 같음 (유저가 연결만되도 이미 방에 들어가있음)
        //console.log(socket.rooms);
        socket.join(roomName);
        done();
        socket.to(roomName).emit("welcome", socket.nickname, countRoom(roomName));    //welcome event를 roomName에 있는 모든 사람들에게 emit 한거
        //console.log(socket.rooms);
        //setTimeout(() => {
        //    done("hello from the backend");             //이거 실행 할때 프론트 엔드에서 실행되는 거임(backendDone 함수를 10초후 프론트에서 실행)
        //}, 3000);
        //아래는 내가 ,혹은 누군가가 방에 입장한 이벤트가 발생했을 때, 소켓이 아닌 소켓서버를 통해 전체 공지 식으로 알린다. 
        wsServer.sockets.emit("room_change", publicRooms());
        
    });
    socket.on("disconnecting", () => {
       socket.rooms.forEach((room) => socket.to(room).emit("bye", socket.nickname, countRoom(room) -1));
    });
    socket.on("disconnect", () => {
       wsServer.sockets.emit("room_change", publicRooms());
    });

    socket.on("new_message", (msg, room, done) => {
        socket.to(room).emit("new_message", `${socket.nickname}: ${msg}`);
        done(); //이건 프론트엔드에서 실행하는거임
    });
    socket.on("nickname", (nickname) => (socket["nickname"] = nickname));
    
});


//이벤트 관리... 웹소켓서버에 연결 되고 나면 ("이벤트 이름", 동작할 메소드) 
// function handleConnection(socket) {
//     console.log(socket);
// }
// wss.on("connection" , handleConnection)

// const sockets = [];
// // 위의 4줄을 아래와 같이 refactoring 
// wss.on("connection", (socket) => {
//     //console.log(socket);
//     //아래에서는 WebSocketServer 메소드가 아닌,  socket에 있는 메소를 활용해서 브라우저에 메세지를 보낼예정. socket.method
//     //여기 아래는 각 브라우저가 요청 들어 올 때 마다 작동함. 
//     sockets.push(socket);
//     socket["nickname"] = "Anonymous";   //닉네임 입력하지 않은 사람들 초기화 
//     console.log("Connected to Browser! O");
//     socket.on("close", () => console.log("disConnected from the Browser! X"));
//     // socket.on("message", (message) => {
//     //     console.log(message.toString('utf8'));
//     //     //JSON.stringify 는 javascript 오브젝트를 => String 으로 변환 
//     //     //JSON.parse 는 String을 => javascript 오브젝트로 변환
//     //     const parsed = JSON.parse(message);
//     //     console.log(parsed, message.toString('utf8'));

//     //     //socket.send(message.toString('utf8')); 이건 나에게 보내는거니 sockets에 들어가 있는 각 브라우저 요청에 메세지를 보낸는 걸로 아래에서 변경
//     //     sockets.forEach(aSocket => aSocket.send(message.toString('utf8')));
//     // });
//     socket.on("message", (msg) => {
//         const message = JSON.parse(msg);
//         //console.log(parsed, message.toString('utf8'));
//         // if (parsed.type === "new_message") {
//         //     sockets.forEach(aSocket => aSocket.send(parsed.payload));
//         // } else if (parsed.type === "nickname") {
//         //     console.log(parsed.payload);
//         // } if문을 아래에서 switch 문으로 다시 리펙토링
//         switch(message.type) {
//             case "new_message" :
//                 sockets.forEach(aSocket => aSocket.send(`${socket.nickname} : ${message.payload}`));     //nickname 프로퍼티를 소켓에 저장해서 send
//                 break;
//             case "nickname" :
//                 socket["nickname"] = message.payload;   //소켓 객체에 아이템을 추가 한거임 
//                 break;
//         }
        
//     });
//     socket.send("hello!!"); //이것만 보낸다고 되는게 아니라, front 단에서 send.data 를 받아 주는 처리를 해줘야됨(app.js)
// });


httpServer.listen(3000, handleListen);

