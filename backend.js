const express = require('express')
const app = express()

//socket.io setup
const http = require('http')
const server = http.createServer(app)
const { Server } = require("socket.io")
const io = new Server(server, { pingInterval: 2000, pingTimeout:5000})

const port = 8080

app.use(express.static('public'))

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html')
})

const backEndPlayers = {}

const SPEED = 15

io.on('connection', (socket) => {
  console.log('User(s) connected:')
  backEndPlayers[socket.id] = {
    x: 500 * Math.random(),
    y: 500 * Math.random(),
    color: `hsl(${360 * Math.random()}, 100%, 50%)`,
  }

  io.emit('updatePlayers', backEndPlayers)

  socket.on('disconnect', (reason) => {
    console.log(reason)
    delete backEndPlayers[socket.id]
    io.emit('updatePlayers', backEndPlayers)
  })

  socket.on('keydown', ({keycode,sequenceNumber}) => {
    backEndPlayers[socket.id].sequenceNumber = sequenceNumber
    switch (keycode) {
      case 'KeyW':
        backEndPlayers[socket.id].y -= SPEED
        break
  
      case 'KeyA':
        backEndPlayers[socket.id].x -= SPEED
        break
  
      case 'KeyS':
        backEndPlayers[socket.id].y += SPEED
        break
  
      case 'KeyD':
        backEndPlayers[socket.id].x += SPEED
        break
    }
  })

  socket.on('shootProjectile', (projectile) => {
    // Broadcast the projectile information to all clients except the sender
    socket.broadcast.emit('addProjectile', projectile);
  });

  console.log(backEndPlayers)
})

setInterval(() => {
  io.emit('updatePlayers', backEndPlayers)
}, 15)

server.listen(port, () => {
  console.log(`Listening on port ${port}`)
})

console.log('Server loaded')