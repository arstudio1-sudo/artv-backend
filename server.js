const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.get('/', (req, res) => {
  res.send('Server AR TV Online & Aktif!');
});

let waitingUsers = [];

io.on('connection', (socket) => {
  socket.on('find_partner', (userData) => {
    if (userData && userData.isBanned) {
      socket.emit('banned_status', true);
      return;
    }

    if (waitingUsers.length > 0) {
      const partnerSocket = waitingUsers.pop();
      socket.emit('match_found', { partnerId: partnerSocket.id, initiator: true });
      partnerSocket.emit('match_found', { partnerId: socket.id, initiator: false });
    } else {
      waitingUsers.push(socket);
    }
  });

  socket.on('signal', (data) => {
    io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
  });

  socket.on('next_partner', () => {
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);
    socket.emit('partner_disconnected');
  });

  socket.on('disconnect', () => {
    waitingUsers = waitingUsers.filter(s => s.id !== socket.id);
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
