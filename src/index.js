const path = require('path')
const express = require('express')
const app = require('./app')
const http = require('http')
const socketio = require('socket.io')
const {generateMessage, generateLocationMessage} = require('./utils/messages')  
const Player = require('./models/player')
const Board = require('./models/board')
const Game = require('./models/game')
let playerRoles = []

const port = process.env.PORT || 3000

const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {

    socket.on('join', async ({playerName, gameId}, callback) => {
        const dupPlayer = await Player.findOne({username: playerName})

        if (dupPlayer){
            return callback({error:'Username is already taken. Try again.'})
        }

        const player = new Player({
            username: playerName,
            gameId,
            socketId: socket.id
        })

        player.save()

        socket.join(player.gameId)
        playerRoles.forEach((role) => {
            socket.emit('new-player-role', role)
        })

        socket.emit('message', generateMessage('Admin', `Welcome ${player.username}!`))
        socket.broadcast.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has joined!`))

        callback({player})
    })

    socket.on('sendMessage', async ({message, playerId}, callback) => {
        const player = await Player.findOne({_id: playerId})

        io.to(player.gameId).emit('message', generateMessage(player.username, message))
        callback()
    })

    socket.on('new-role', async ({role, team, playerId}) => {
        const player = await Player.findOne({_id: playerId})

        playerRoles.push({role, team, username: player.username})

        io.to(player.gameId).emit('new-player-role', {role, team, username: player.username})
        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has become a ${role} for the ${team} team!`))       
    })

    socket.on('sendClue', async ({clue, guessNumber, playerId}) => {
        const player = await Player.findOne({_id: playerId})
        io.to(player.gameId).emit('guessingPhase', {clue, guessNumber, team: player.team})
        io.to(player.gameId).emit('message', generateMessage(player.username, `${clue} ${guessNumber}`))
    })

    socket.on('guess', async ({ word, guessNumber, boardId, player }) => {
        const board = await Board.findOne({_id: boardId})
        const index = board.wordlist.indexOf(word)
        const cardTeam = board.overlay[index]
        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} guessed ${word}`))
        io.to(player.gameId).emit('message', generateMessage('Admin', `${word} belongs to the ${cardTeam} team.`))
        io.to(player.gameId).emit('card-reveal', {cardTeam, word})
        if (cardTeam === player.team && guessNumber !== 0){
            io.to(player.gameId).emit('message', generateMessage('Admin', `The ${player.team} team has ${guessNumber} guesses left.`))
            return callback(true)
        }

        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.team}'s turn is over.`))
        callback(false)
        io.to(player.gameId).emit('cluegiverPhase', {opposingTeam: player.team})
    })


    socket.on('disconnect', async () => {
        const player = await Player.deleteOne({socketId: socket.id})

        if (player) {
            io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has left.`))
            const remainingPlayers = await Player.find({gameId: player.gameId})
            if (remainingPlayers.length === 0){
                const game = await Game.deleteOne({gameId: player.gameId})
                await Board.deleteMany({gameId: player.gameId})
            }
        }
    })

})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})