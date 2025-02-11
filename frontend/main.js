import { io } from 'socket.io-client';
const socket = io('https://d761589f-3c64-4061-896d-cf59a703b4e4-00-2knwrphuplpe8.worf.replit.dev/');
let localConnection;
let remoteConnection;
let localStream;
let remoteStream;
let localAudio = new Audio();
let remoteAudio = new Audio();
let userId;

// Get DOM elements
const startCallBtn = document.getElementById('startCallBtn');
const endCallBtn = document.getElementById('endCallBtn');

// Display the unique user ID
socket.on('userId', (id) => {
  userId = id;
  document.getElementById('userId').textContent = userId;
});

// Handle incoming offers
socket.on('offer', async (data) => {
  if (data.senderId === userId) return;
  
  if (!confirm(`Incoming call from ${data.senderId}. Accept?`)) {
    return;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;
    localAudio.play();

    remoteConnection = new RTCPeerConnection();
    
    localStream.getTracks().forEach(track => {
      remoteConnection.addTrack(track, localStream);
    });

    remoteConnection.setRemoteDescription(new RTCSessionDescription(data.offer));
    const answer = await remoteConnection.createAnswer();
    await remoteConnection.setLocalDescription(answer);
    
    socket.emit('answer', { 
      answer: answer, 
      receiverId: data.senderId 
    });

    remoteConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { 
          candidate: event.candidate, 
          receiverId: data.senderId 
        });
      }
    };

    remoteConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();
    };

    endCallBtn.disabled = false;
  } catch (error) {
    console.error('Error handling offer:', error);
    alert('Failed to establish call: ' + error.message);
  }
});

socket.on('answer', (data) => {
  if (localConnection) {
    localConnection.setRemoteDescription(new RTCSessionDescription(data.answer));
  }
});

socket.on('candidate', (data) => {
  const connection = localConnection || remoteConnection;
  if (connection) {
    connection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
});

async function startCall() {
  const receiverId = document.getElementById('receiverId').value;
  if (!receiverId) return alert('Please enter a receiver ID.');
  
  try {
    localStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    localAudio.srcObject = localStream;

    localConnection = new RTCPeerConnection();
    
    localStream.getTracks().forEach(track => {
      localConnection.addTrack(track, localStream);
    });

    const offer = await localConnection.createOffer();
    await localConnection.setLocalDescription(offer);
    
    socket.emit('offer', { 
      offer: offer, 
      senderId: userId, 
      receiverId: receiverId 
    });

    localConnection.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('candidate', { 
          candidate: event.candidate, 
          receiverId: receiverId 
        });
      }
    };

    localConnection.ontrack = (event) => {
      remoteStream = event.streams[0];
      remoteAudio.srcObject = remoteStream;
      remoteAudio.play();
    };

    startCallBtn.disabled = true;
    endCallBtn.disabled = false;
  } catch (error) {
    console.error('Error starting call:', error);
    alert('Failed to start call: ' + error.message);
  }
}

function endCall() {
  if (localConnection) {
    localConnection.close();
    localConnection = null;
  }
  if (remoteConnection) {
    remoteConnection.close();
    remoteConnection = null;
  }
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localAudio.srcObject = null;
  }
  if (remoteStream) {
    remoteStream.getTracks().forEach(track => track.stop());
    remoteAudio.srcObject = null;
  }

  startCallBtn.disabled = false;
  endCallBtn.disabled = true;
}

startCallBtn.addEventListener('click', startCall);
endCallBtn.addEventListener('click', endCall); 
