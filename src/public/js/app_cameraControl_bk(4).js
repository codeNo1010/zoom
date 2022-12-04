const socket = io();

const myFace = document.getElementById("myFace");
const muteBtn = document.getElementById("mute");
const cameraBtn = document.getElementById("camera");
const camerasSelect = document.getElementById("cameras");


let myStream;
let muted = false;
let cameraOff = false;

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
            deviceId? cameraConstraints : initialConstrains
        );
        if(!deviceId) {
            await getCameras();
        }
        myFace.srcObject = myStream;
        await getCameras();
    } catch(e) {
        console.log(e);
    }
}

getMedia();

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
}

muteBtn.addEventListener("click", handleMuteClick);
cameraBtn.addEventListener("click", handleCameraClick);
camerasSelect.addEventListener("input", handleCameraChange);