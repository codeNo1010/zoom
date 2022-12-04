const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");
const call = document.getElementById("call");

call.hidden = true; // 처음에 콜 부분은 숨어있을 예정, 방입장 후 호출


let myStream;
let muted = false;
let cameraOff = false;
let roomName;
let myPeerConnection;
let myDataChannel;

async function getCameras() {
    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((device) => device.kind === "videoinput");
        //console.log(cameras);
        //console.log(myStream.getVideoTracks());
        const currentCamera = myStream.getVideoTracks()[0];
        cameras.forEach((camera) => {
            const option = document.createElement("option");
            option.value = camera.deviceId; //카메라 device ID 키 값이 되지만 이걸 렌더링할때는 라벨로...
            option.innerText = camera.label; //(제품명)
            if(currentCamera.label === camera.label){
                option.selected = true;
            }
            camerasSelect.appendChild(option);
        });
    } catch (e) {
        console.log(e);
    }
}

async function getMedia(deviceId){
    const initialConstrains = {     //deviceId가 없을때 실행됨 
        audio: true,
        video: { facingMode: "user" },
    };
    const cameraConstraints = {     //deviceId가 있을때 실행됨
        audio: true,
        video: { deviceId : { exact: deviceId } },
    }
    
        // myStream = await navigator.mediaDevices.getUserMedia({   위에 deviceId가져 오는걸로 수정해서 초기값 강제로 해놓은 부분 주석처리
        //     audio: true,
        //     video: true,
        // });
    try{
        myStream = await navigator.mediaDevices.getUserMedia(
            deviceId ? cameraConstraints : initialConstrains
        );
        myFace.srcObject = myStream;
        if(!deviceId) {
            await getCameras();
        }
        //await getCameras();
    } catch(e) {
        console.log(e);
    }
}

//getMedia(); 모든걸 부르는 함수라 조건부로 변경함

//DOCS => developer.mozilla.org/en-US/docs/Web/API/MediaDevices/enumerateDevices  => 모바일 포함 디바이스 모든정보 가져옴
function handleMuteClick(){
    //console.log(myStream.getAudioTracks());
    myStream
        .getAudioTracks()
        .forEach((track) => (track.enabled = !track.enabled)); 
    if(!muted){
        muteBtn.innerText = "Unmute";
        muted = true;
    } else {
        muteBtn.innerText = "Mute";
        muted = false;
    }
}
function handleCameraClick(){
    //console.log(myStream.getVideoTracks());
    myStream
        .getVideoTracks()
        .forEach((track) => (track.enabled = !track.enabled)); 
    if(cameraOff){
        cameraBtn.innerText = "Turn Camera Off"
        cameraOff = false;
    } else {
        cameraBtn.innerText = "Turn Camera On"
        cameraOff = true;
    }
}

async function handleCameraChange(){
    //console.log(camerasSelect.value);
    await getMedia(camerasSelect.value);
    if(myPeerConnection){
        const videoTrack = myStream.getVideoTracks()[0];
        const videoSender = myPeerConnection
            .getSenders()
            .find(sender => sender.track.kind === "video");
            console.log(videoSender);
            //developer.mozilla.org/en-US/docs/Web/API/RTCRtpSender
        videoSender.replaceTrack(videoTrack);       // sender => 다른 브라우저로 보내지는 스트림 및 트랙을 컨트롤 함

    }
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);

//RTC 
// form 정보를 얻을거고, welcome 안에서는 submit 이벤트를 listne  하고 , 그다음 input을 얻어서 그것을 backEnd로 보낼예정
// Welcome Form (join a room )
const welcome = document.getElementById("welcome");
const welcomeForm = welcome.querySelector("form");

async function initCall() {
    welcome.hidden = true;
    call.hidden = false;
    await getMedia();
    makeConnection();
}

async function handleWelcomeSubmit(event){
    event.preventDefault();
    const input = welcomeForm.querySelector("input");
    //console.log(input.value);
    await initCall();
    socket.emit("join_room", input.value);  //백엔드로 보내는부분
    roomName = input.value;
    input.value = "";
}

welcomeForm.addEventListener("submit", handleWelcomeSubmit);



// Socket Code 누군자 입장 했을때(peer B), peer A 에게 전송되는 메세지 
// socket.on("welcome", () => {
//     console.log("someone joined!");
// });
// PEER A  (A 브라우저)
socket.on("welcome", async () => {      //이 코드는 only 먼저 들어가서 알림 받는 브라우저가 실행되는 로직임 
    //DATA CHANNEL 시작 (offer 만들기 전에 해줘야됨)
    myDataChannel = myPeerConnection.createDataChannel("chat"); //데이터 채널 생성
    //myDataChannel.addEventListener("message", console.log); //이벤트리스너 생성 
    myDataChannel.addEventListener("message", (event) => console.log(event.data));
    console.log("made data channel");   // PEER A 에서 생성  * 다른 Peer 는 데이터 채널 생성할 필요없고, 데이터 채널 이벤트가 있을때, 이벤트 리스너를 만들면됨
    const offer = await myPeerConnection.createOffer(); // 많은정보를 가진 offer 생성 (일종의 초대장)
    myPeerConnection.setLocalDescription(offer);
    console.log("sent the offer");
    socket.emit("offer", offer, roomName);  //서버로 정보보냄
});

// PEER B  (B 브라우저)
socket.on("offer", async(offer) => {
    myPeerConnection.addEventListener("datachannel", (event) => {
        myDataChannel = event.channel;
        //myDataChannel.addEventListener("message", console.log);
        myDataChannel.addEventListener("message", (event) => console.log(event.data));
        // PEER A 데이터채널 생성, PEER B 리스너 생성 후 
        // 방에 들어간 후 console창에다가 myDataChanner.send("hello") . 이런식으로 테스트 해서 peer B가 데이터 받는거 확인하면됨
    });
    console.log("received the offer");
    myPeerConnection.setRemoteDescription(offer);   // peer A의 description을 set 한다. 
    const answer = await myPeerConnection.createAnswer();
    //console.log(answer);    // Peer B의 answer
    myPeerConnection.setLocalDescription(answer);
    socket.emit("answer", answer, roomName);
    console.log("sent the answer");
})

// PEER A 실행 (* 위에 "welcome" 과 "offer" 를 각 브라우저가 실행 후 , 각 브라우저가 offer와 answer를 다 가지고 있게 됨. 아래는 그 이후 실행)
socket.on("answer", (answer) => {
    console.log("received the answer");
    myPeerConnection.setRemoteDescription(answer);
});

socket.on("ice", (ice) => {
    console.log("received candidate");
    myPeerConnection.addIceCandidate(ice);
});

// RTC Code
function makeConnection() {
    myPeerConnection = new RTCPeerConnection({
        //STUN 서버 (구글 기본제공.... 원래 전문적으로 할려면 만들어야됨  공인IP 맞춰주는 느낌, 동일 대역).. 스턴서버는 필수적으로 만들어라네
        //스턴 서버는 나의 장치에 공용주소를 알려주는 서버임, 장치가 공용주소를 알고 있어야 다른 네트워크대역에 있어도 찾을수 있음
        iceServers: [   //STUN 서버 테스트용
            {
                urls: [
                    "stun:stun.l.google.com:19302",
                    "stun:stun1.l.google.com:19302",
                    "stun:stun2.l.google.com:19302",
                    "stun:stun3.l.google.com:19302",
                    "stun:stun4.l.google.com:19302",
                ],
            },
        ], 
    });
    //console.log(myStream.getTracks());
    myPeerConnection.addEventListener("icecandidate", handleIce);
    myPeerConnection.addEventListener("addstream", handleAddStream);
    myStream
        .getTracks()
        .forEach((track) => myPeerConnection.addTrack(track, myStream));
}

function handleIce(data) {
    socket.emit("ice", data.candidate, roomName);
    console.log("sent candidate");
    //console.log("got ice candidate");
    //console.log(data);
}

function handleAddStream(data) {
    //console.log("got an stream from my peer");
    console.log("Peer's Stream", data.stream);
    //console.log("My Stream", myStream);
    const peerFace = document.getElementById("peerFace");
    peerFace.srcObject = data.stream;
}




















