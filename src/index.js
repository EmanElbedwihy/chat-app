const express = require('express')
const path = require('path')
const http = require('http')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messges')
const { addUser, removeUser, getUser, getUsersInRoom } = require('./utils/users')

const public = path.join(__dirname, '../public')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

app.use(express.static(public))

io.on('connection', (socket) => {
    console.log('new socket connection')


    socket.on('join', (options, callback) => {
        const { error, user } = addUser({ id: socket.id, ...options })
        if (error) {
            return callback(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin','welcome!'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',`${user.username} has joined`))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })

        callback()
    })
    socket.on('sendMessage', (mes, callback) => {
        const user = getUser(socket.id)


        const filter = new Filter()
        if (filter.isProfane(mes)) {
            return callback('profanity in not allowed')
        }
        io.to(user.room).emit('message', generateMessage(user.username,mes))
        callback()

    })
    socket.on('sendLocation', (pos, callback) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username,'https://google.com/maps?q=' + pos.lat + ',' + pos.long))
        callback()
    })
    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left`))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })

        }
    })
})

server.listen(3000, () => {
    console.log('server is up')
})