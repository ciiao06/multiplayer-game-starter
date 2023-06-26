const canvas = document.querySelector('canvas')
const c = canvas.getContext('2d')

const socket = io()

const scoreEl = document.querySelector('#scoreEl')

const devicePixelRatio = window.devicePixelRatio || 1

canvas.width = innerWidth * devicePixelRatio
canvas.height = innerHeight * devicePixelRatio

const x = canvas.width / 2
const y = canvas.height / 2

const frontEndPlayers = {}
const projectiles = []
const particles = []

let animationId
let score = 0

socket.on('updatePlayers',(backEndPlayers)=>{
  for(const id in backEndPlayers){
    const backEndPlayer = backEndPlayers[id]

    if(!frontEndPlayers[id]){
      frontEndPlayers[id] = new Player({
        x:backEndPlayer.x, 
        y:backEndPlayer.y, 
        radius: 10, 
        color: backEndPlayer.color
      })
    }else{
      if(id === socket.id){
        //if player already exists
        frontEndPlayers[id].x = backEndPlayer.x
        frontEndPlayers[id].y = backEndPlayer.y

        const lastBackendInputIndex = playerInputs.findIndex(input => {
          return backEndPlayer.sequenceNumber === input.sequenceNumber
        })

        if(lastBackendInputIndex > -1)
          playerInputs.splice(0, lastBackendInputIndex + 1)

        playerInputs.forEach(input => {
          frontEndPlayers[id].x +=input.dx
          frontEndPlayers[id].y +=input.dy
        })
      } else{
        //for all other players
        gsap.to(frontEndPlayers[id], {
          x: backEndPlayer.x,
          y: backEndPlayer.y,
          duration: 0.015,
          ease: 'linear'
        })
      }
      
    }
  }

  for(const id in frontEndPlayers){
    if(!backEndPlayers[id]){
      delete frontEndPlayers[id]
    }
  }
})

// let animationId

window.addEventListener('click', (event) => {
  const angle = Math.atan2(
    event.clientY - canvas.height / 2,
    event.clientX - canvas.width / 2
  );
  const velocity = {
    x: Math.cos(angle) * 5,
    y: Math.sin(angle) * 5
  };
  const projectile = new Projectile(
    frontEndPlayers[socket.id].x,
    frontEndPlayers[socket.id].y,
    5,
    'white',
    velocity
  );
  projectiles.push(projectile);

  // Emit projectile information to the server
  socket.emit('shootProjectile', {
    x: projectile.x,
    y: projectile.y,
    radius: projectile.radius,
    color: projectile.color,
    velocity: projectile.velocity
  });
});

socket.on('addProjectile', (projectile) => {
  projectiles.push(new Projectile(
    projectile.x,
    projectile.y,
    projectile.radius,
    projectile.color,
    projectile.velocity
  ));
});

function animate() {
  animationId = requestAnimationFrame(animate)
  c.fillStyle = 'rgba(0, 0, 0, 0.1)'
  c.fillRect(0, 0, canvas.width, canvas.height)

  for(const id in frontEndPlayers){
    const frontEndPlayer = frontEndPlayers[id]
    frontEndPlayer.draw()
  }

  for (let index = particles.length - 1; index >= 0; index--) {
    const particle = particles[index]

    if (particle.alpha <= 0) {
      particles.splice(index, 1)
    } else {
      particle.update()
    }
  }

  for (let index = projectiles.length - 1; index >= 0; index--) {
    const projectile = projectiles[index]

    projectile.update()

    // remove from edges of screen
    if (
      projectile.x - projectile.radius < 0 ||
      projectile.x - projectile.radius > canvas.width ||
      projectile.y + projectile.radius < 0 ||
      projectile.y - projectile.radius > canvas.height
    ) {
      projectiles.splice(index, 1)
    }
  }
}

animate()


const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  s: {
    pressed: false
  },
  d: {
    pressed: false
  }
}

const SPEED = 15
const playerInputs = []
let sequenceNumber = 0
setInterval(() => {
  if (keys.w.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: -SPEED })
    frontEndPlayers[socket.id].y -= SPEED
    socket.emit('keydown', { keycode: 'KeyW', sequenceNumber })

  }

  if (keys.a.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: -SPEED, dy: 0 })
    frontEndPlayers[socket.id].x -= SPEED
    socket.emit('keydown', { keycode: 'KeyA', sequenceNumber })

  }

  if (keys.s.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: 0, dy: SPEED })
    frontEndPlayers[socket.id].y += SPEED
    socket.emit('keydown', { keycode: 'KeyS', sequenceNumber })

  }

  if (keys.d.pressed) {
    sequenceNumber++
    playerInputs.push({ sequenceNumber, dx: SPEED, dy: 0 })
    frontEndPlayers[socket.id].x += SPEED
    socket.emit('keydown', { keycode: 'KeyD', sequenceNumber })

  }
}, 15)

window.addEventListener('keydown', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      // frontEndPlayers[socket.id].y -= 5
      // socket.emit('keydown','KeyW')
      keys.w.pressed = true
      break

    case 'KeyA':
      // frontEndPlayers[socket.id].x -= 5
      keys.a.pressed = true
      socket.emit('keydown','KeyA')
      break

    case 'KeyS':
      // frontEndPlayers[socket.id].y += 5
      
      keys.s.pressed = true
      break

    case 'KeyD':
      // frontEndPlayers[socket.id].x += 5
      
      keys.d.pressed = true
      break
  }
})

window.addEventListener('keyup', (event) => {
  if (!frontEndPlayers[socket.id]) return

  switch (event.code) {
    case 'KeyW':
      keys.w.pressed = false
      break

    case 'KeyA':
      keys.a.pressed = false
      break

    case 'KeyS':
      keys.s.pressed = false
      break

    case 'KeyD':
      keys.d.pressed = false
      break
  }
})