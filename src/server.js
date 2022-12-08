import http from "http";
const https = require('https');
const fs = require('fs');
const options = {
    key: fs.readFileSync('./private.pem'),
    cert: fs.readFileSync('./public.pem')
  };
const nodeStatic = require('node-static');
import SocketIO from "socket.io";
import express from "express";
//import { instrument } from "@socket.io/admin-ui";

const app = express();
var fileServer = new(nodeStatic.Server)();
app.set("view engine", "pug");  //템플릿 엔진 지정
app.set("views", __dirname + "/views"); //템플릿 위치 지정
app.use("/public", express.static(__dirname + "/public"));  //public URL 생성 후 유저에게 파일 공유 (app.js), public 폴더를 유저에게 보여주는 개념
//app route 설정 http
app.get("/", (req, res) => res.render("home")); //home.pug를 렌더링 해주는 핸들러를 만들었음
//아래 response TEST땜에 잠시 막아놓음 
app.get("/*", (req, res) => res.redirect("/")); //url 이상하게 치면 무조건 홈으로 보내버림ㅋㅋ
//https
app.get("/", (req, res) => {
    console.log("------ https get / -----" + (new Date()).toLocaleString());
    console.log("req.ip => " + req.ip);
    console.log("req.hostname => " + req.hostname);
    console.log(req.url);
    console.log(req.originalUrl);

    res.send("<h1>HTTPS Server running on port 3000</h1>");
    res.render("home")
})

const httpServer = http.createServer(app);  //http 서버
const httpsServer = https.createServer(options, app, (req,res)=>{
    fileServer.serve(req, res);
  }).listen(3000);

  const wsServer = SocketIO(httpsServer);

wsServer.on("connection", (socket) => {
    socket.on("join_room", (roomName) => {
        socket.join(roomName);
        console.log(wsServer);
        socket.to(roomName).emit("welcome");
    });
    socket.on("offer", (offer, roomName) => {
        socket.to(roomName).emit("offer", offer);
    });
    socket.on("answer", (answer, roomName) => {
        socket.to(roomName).emit("answer", answer);
    });
    socket.on("ice", (ice, roomName) => {
        socket.to(roomName).emit("ice", ice);
    });

});



//
//------------------------------------------------------------------------------------------------------------------------

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












// JSON TEST
//                                   [] [] [] GET  [] [] []
// 변수명을 받는 2가지 방법 
    //1. params =>  :  콜론뒤에 변수명을 받는 방법
    //2. 쿼리로 받는 방법 , 물음표 뒤에 key, value 로 받는방법
    // app.get("/user/:id", (req, res) => {
    //     // const q = req.params             
    //     // console.log(q.id);
    //     // res.json({'loginId' : q.id})
    //     const q = req.query;
    //     console.log(q);
    //     res.json({'userid' : q.q, 'name' : q.name, 'age' : q.age});
    
        //브라우저 테스트 https://localhost:3000/user/codeNo.1010?q=han&name=jung&age=20 이런식으로 
//    });
    //                                   [] [] [] POST [] [] []
    // 변수명을 받는 2가지 방법 
    // app.use(express.json());
    // app.post('/user/:id', (res, res) => {
    //     const p =req.params;
    //     console.log(p);
    //     const b =req.body;
    //     console.log(b);
    // });


    const handleListen = () => console.log(`Listening on http://localhost:3000`);
    //const host = '192.168.0.137';
            httpServer.listen(9000, handleListen); 
    //httpServer.listen(3000, host);