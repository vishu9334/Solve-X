class WebRTCHandler{
    constructor(io, socket){
        this.io = io
        this.socket = socket
    }
// Register all WebRTC event listeners
    init(){
        this.socket.on("webrtc:join", (payload)=>this.handleJoin(payload));
        this.socket.on("webrtc:signal",(payload)=> this.handleSignal(payload));
        this.socket.on("webrtc:leave",()=>this.handleLeave());
    }
    // Handle a user joining the video session
    handleJoin({chatRoomId, userId, userName, role}){
        if(!chatRoomId || !userId) return;

        this.socket.webrtcRoomId = chatRoomId;
        this.socket.userId = userId;
        this.socket.userName = userName;
        this.socket.userRole = role;

        const signalingRoomName = `webrtc_${chatRoomId}`;
        this.socket.join(signalingRoomName);
        console.log(`User ${userName} (${role}) Joined WebRTC Room: ${signalingRoomName}`);
 // Fetch existing peers inside this room
        const clients  = this.io.sockets.adapter.rooms.get(signalingRoomName);
        const activePeers = [];
        if(clients){
            for(const clientId of clients){
                if(clientId !== this.socket.id){
                    const clientSocket = this.io.sockets.sockets.get(clientId);
                    if(clientSocket){
                        activePeers.push({
                            socketId:clientId,
                            userId:clientSocket.userId,
                            userName: clientSocket.userName,
                            role: clientSocket.userRole,
                        })
                    }
                }
            }
        }
 // Send existing peers list to the new joiner
        this.socket.emit("webrtc:peer-list",activePeers);
    this.socket.to(signalingRoomName).emit("webrtc:peer-joined", {
      socketId: this.socket.id,
      userId,
      userName,
      role,
    });
  }

  // Relay WebRTC SDP (Offers/Answers) and ICE Candidates
  handleSignal({ targetSocketId, signalData }) {
    this.io.to(targetSocketId).emit("webrtc:signal", {
      senderSocketId: this.socket.id,
      signalData,
    });
  }

  // Handle leaving the WebRTC room
  handleLeave() {
    const chatRoomId = this.socket.webrtcRoomId;
    if (chatRoomId) {
      const signalingRoomName = `webrtc_${chatRoomId}`;
      this.socket.leave(signalingRoomName);
      
      // Notify remaining peers
      this.socket.to(signalingRoomName).emit("webrtc:peer-left", { 
        socketId: this.socket.id 
      });
      
      this.socket.webrtcRoomId = null;
      console.log(`User ${this.socket.userName} left WebRTC: ${signalingRoomName}`);
    }
  }

  // Static cleanup for disconnections
  static cleanup(io, socket) {
    const chatRoomId = socket.webrtcRoomId;
    if (chatRoomId) {
      const signalingRoomName = `webrtc_${chatRoomId}`;
      socket.to(signalingRoomName).emit("webrtc:peer-left", { 
        socketId: socket.id 
      });
    }
  }
}

export default WebRTCHandler;