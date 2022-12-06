import http from "http";
import SocketIO from "socket.io";
import express from "express";
//import { instrument } from "@socket.io/admin-ui";

const app = express();

app.set("view engine", "pug");  //템플릿 엔진 지정
app.set("views", __dirname + "/views"); //템플릿 위치 지정

app.use("/public", express.static(__dirname + "/public"));  //public URL 생성 후 유저에게 파일 공유 (app.js), public 폴더를 유저에게 보여주는 개념

//app route 설정
app.get("/", (req, res) => res.render("home")); //home.pug를 렌더링 해주는 핸들러를 만들었음
app.get("/*", (req, res) => res.redirect("/")); //url 이상하게 치면 무조건 홈으로 보내버림ㅋㅋ


const httpServer = http.createServer(app);  //http 서버
const wsServer = SocketIO(httpServer);

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

const handleListen = () => console.log(`Listening on http://localhost:3000`);
//const host = '192.168.0.137';
httpServer.listen(3000, handleListen);
//httpServer.listen(3000, host);

