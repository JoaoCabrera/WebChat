const express = require('express');
const http = require('http');
const path = require('path');
const dateTime = require('node-datetime'); // https://www.ti-enxame.com/pt/node.js/como-obter-data-e-hora-atual-com-o-formato-y-m-d-h-m-s-usando-biblioteca-node-datetime-de-nodejs/825445513/
const { Server } = require('socket.io');
const modelMessages = require('./models/messagesModel');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const PORT = 3000;

function getData() {
  const data = dateTime.create();
  return data.format('d-m-Y H:M:S');
}

function setMessages(chatMessage, nickname, randomNick) {
  const timeStamp = getData();
    if (nickname) {
      modelMessages.setMessage({ chatMessage, nickname, timeStamp });
      io.emit('message', `${timeStamp} - ${nickname}: ${chatMessage}`);
    } else {
      modelMessages.setMessage({ chatMessage, nickname: randomNick, timeStamp });
      io.emit('message', `${timeStamp} - ${randomNick}: ${chatMessage}`);
    }
}

const onlineUsers = {};

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

io.on('connection', async (socket) => {
  const randomNick = socket.id.slice(-16);
  console.log(`usuário ${randomNick} conectou`);

  onlineUsers[randomNick] = randomNick;
  io.emit('connected', onlineUsers);

  const historyMessages = await modelMessages.getMessages();
  io.emit('historyMsg', historyMessages);

  socket.on('changeNick', (nick) => {
    onlineUsers[randomNick] = nick;
    io.emit('connected', onlineUsers);
  });

  socket.on('message', ({ chatMessage, nickname }) => {
    setMessages(chatMessage, nickname, randomNick);
  });

  socket.on('disconnect', () => {
    console.log(`usuário ${randomNick} desconectou`);
    delete onlineUsers[randomNick];
    io.emit('connected', onlineUsers);
  });
});

server.listen(PORT, () => console.log(`Rodando na porta ${PORT}`)); 