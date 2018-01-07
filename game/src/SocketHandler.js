import io from 'socket.io-client';

class SocketHandler{
  constructor(context)
  {
    this.socket = io.connect();
    this.context = context;
  }
  addServerUpdateHandler(updateFunction){
    this.socket.on('updateAllPlayers', (data) => {
      updateFunction.call(this.context, data);
    });
  }
  sendUpdateToServer(x, y, velocityX, velocityY){
    this.socket.emit('updatePlayer', {x,y,velocityX,velocityY});
  }
  isMe(id){
    return this.socket.id === id;
  }
}

export default SocketHandler;
