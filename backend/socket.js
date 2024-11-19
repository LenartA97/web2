import express from 'express'
import * as socketIO from 'socket.io'
import http from 'http'

const app = express()
const server = http.createServer(app)

const io = new socketIO.Server(server, { cors: '*' })

app.get('/', (req, res) => {
  res.json({ resp: 'ok' })
})

const _messages = []

io.on('connection', (socket) => {
  socket.emit('welcome', _messages)

  socket.on('text', (message) => {
    _messages.push(message)
    socket.broadcast.emit('change', message)
  })
})

server.listen(8080, () => console.log('server is listening'))
