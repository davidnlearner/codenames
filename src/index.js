const path = require('path')
const express = require('express')
const app = require('./app')
const http = require('http')
const socketio = require('socket.io')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const Player = require('./models/player')
const Board = require('./models/board')
const Game = require('./models/game')

const port = process.env.PORT || 3000

const server = http.createServer(app)
const io = socketio(server)

const publicDirectoryPath = path.join(__dirname, '../public')

app.use(express.static(publicDirectoryPath))


io.on('connection', (socket) => {

    socket.on('join', async ({ playerName, gameId }, callback) => {

        const dupPlayer = await Player.findOne({ username: playerName, gameId })
        const game = await Game.findOne({ _id: gameId })

        if (dupPlayer) {
            return callback({ error: 'Username is already taken. Try again.' })
        }

        const player = new Player({
            username: playerName,
            gameId,
            socketId: socket.id
        })

        player.save()

        socket.join(player.gameId)

        game.playerRoles.forEach((role) => {
            socket.emit('new-player-role', role)
        })

        socket.broadcast.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has joined!`))
        callback({ player })
    })

    socket.on('sendMessage', ({ message, name, gameId }) => {
        io.to(gameId).emit('message', generateMessage(name, message))
    })

    socket.on('sendJoinMessage', ({ message, name }) => {
        socket.emit('message', generateMessage('Admin', `Welcome ${name}!`))
        socket.emit('message', generateMessage(name, message))
    })

    socket.on('new-role', async ({ role, team, playerId }) => {
        const player = await Player.findOne({ _id: playerId })
        const game = await Game.findOne({ _id: player.gameId })

        game.playerRoles.push({ role, team, username: player.username })
        game.save()

        io.to(player.gameId).emit('new-player-role', { role, team, username: player.username })
        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has become a ${role} for the ${team} team!`))
    })

    socket.on('sendClue', async ({ clue, guessNumber, playerId }, callback) => {
        const player = await Player.findOne({ _id: playerId })
        io.to(player.gameId).emit('guessingPhase', { guessNumber, team: player.team })
        io.to(player.gameId).emit('message', generateMessage(player.username, `${clue} ${guessNumber}`))
        io.to(player.gameId).emit('updateGameStatus', {clue, guessNumber, phase:'Guessing'})
        callback()  
    })

    socket.on('handleGuess', async ({ word, guessNumber, boardId, player }, callback) => {
        const board = await Board.findOne({ _id: boardId })
        const index = board.wordlist.indexOf(word)
        const cardTeam = board.overlay[index]
        const opposingTeam = player.team === 'red' ? 'blue' : 'red'

        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} guessed ${word}`))
        io.to(player.gameId).emit('message', generateMessage('Admin', `${word} belongs to the ${cardTeam} team.`))
        io.to(player.gameId).emit('card-reveal', { cardTeam, word })



        if (cardTeam === player.team) {
            io.to(player.gameId).emit('update-score', { cardTeam })
            if (guessNumber !== 0) {
                let guessWord = guessNumber===1 ? 'guess' : 'guesses'
                io.to(player.gameId).emit('message', generateMessage('Admin', `The ${player.team} team has ${guessNumber} ${guessWord} left.`))
                io.to(player.gameId).emit('updateGameStatus', { guessNumber })
                return callback(true)
            }
        } 
        else if (cardTeam === 'assassin') {
            io.to(player.gameId).emit('assassin-game-over', { opposingTeam })
            return callback(false)
        } 
        else if (cardTeam === opposingTeam) {
            io.to(player.gameId).emit('update-score', { cardTeam })
        }



        io.to(player.gameId).emit('message', generateMessage('Admin', `${player.team}'s turn is over.`))
        io.to(player.gameId).emit('updateGameStatus', { clue: '', guessNumber: '', team: opposingTeam, phase:'Spymaster' })
        callback(false)
        io.to(player.gameId).emit('cluegiverPhase', { activeTeam: opposingTeam })
    })

    socket.on('updateActivePlayer', ({name, gameId}) => {
        io.to(gameId).emit('updateGameStatus', { playerName: name })
    })

    socket.on('startGame', ({gameId, startTeam}) => {
        io.to(gameId).emit('revealGameStatus')
        io.to(gameId).emit('updateGameStatus', { team: startTeam, phase:'Spymaster' })
        io.to(gameId).emit('cluegiverPhase', { activeTeam: startTeam })
    })



    socket.on('disconnect', async () => {
        const player = await Player.findOneAndDelete({ socketId: socket.id })

        if (player) {
            io.to(player.gameId).emit('reset-player-role', { role: player.role, team: player.team }) 
            io.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has left.`))
            const remainingPlayers = await Player.find({ gameId: player.gameId })
            if (remainingPlayers.length === 0) {
                await Game.findOneAndDelete({ _id: player.gameId })
                await Board.findOneAndDelete({ gameId: player.gameId })
            } else {
                const game = await Game.findOne({ _id: player.gameId })
                game.playerRoles = game.playerRoles.filter((eachPlayer) => { return eachPlayer.username !== player.username })
                game.save()
            }
        }

    })

    socket.on('leave-game', async ({ playerId }) => {
        const player = await Player.findOneAndDelete({ _id: playerId })
        if (player) {
            socket.broadcast.to(player.gameId).emit('reset-player-role', { role: player.role, team: player.team })
            socket.broadcast.to(player.gameId).emit('message', generateMessage('Admin', `${player.username} has left.`))

            const remainingPlayers = await Player.find({ gameId: player.gameId })
            if (remainingPlayers.length === 0) {
                await Game.findOneAndDelete({ _id: player.gameId })
                await Board.findOneAndDelete({ gameId: player.gameId })
            } 
            else {
                const game = await Game.findOne({ _id: player.gameId })
                game.playerRoles = game.playerRoles.filter((eachPlayer) => { return eachPlayer.username !== player.username })
                game.save()
            }
        }
    })

})



server.listen(port, () => {
    console.log('Server is up on port ' + port)
})