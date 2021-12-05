const express = require('express');
const app = express();
const http = require('http').createServer(app).listen(8080);
const io = require('socket.io')(http);
const Redis = require('ioredis');
//const redisClient = new Redis();

app.use(express.static(__dirname + '/ui'));

const users = {};

const cluster = new Redis.Cluster(
  [
    {
      host: 'whiteapp.05sasc.clustercfg.use2.cache.amazonaws.com:6379',
    },
  ],
  {
    slotsRefreshTimeout: 2000,
    dnsLookup: (address, callback) => callback(null, address),
    redisOptions: {
      tls: {},
      password: process.env.REDIS_AUTH_TOKEN,
    },
  },
);

cluster.on('node error', err => console.error(err))

io.on('connection', socket => {
  
  socket.on('joinroom', key => {
    socket.join(key);
    cluster.get('paint', (err,data) => {
      const history = JSON.parse(data);
      socket.to(key).emit('drawing', history);  
    });
  });
  
  
  socket.on('drawing', (data) => {
    cluster.set('paint', JSON.stringify(data));
    socket.broadcast.emit('drawing', data);  
  });
  
  
  socket.on('user-name', name => {
    users[socket.id] = name;
    socket.emit('user-connected', users);
  });


});