const path = require('path')
const express = require('express')
const app = require('./app')
const http = require('http')
const socketio = require('socket.io')
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

        const game = await Game.findOne({ _id: gameId })

        const dupPlayer = await Player.findOne({ username: playerName, gameId })

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

        socket.emit('update-active-state', {gameState: game.activeState})

        socket.broadcast.to(player.gameId).emit('message', {playerName: player.username, text: ` has joined!`, team: player.team})
        callback({ player })
    })

    socket.on('sendMessage', ({ playerName, text, team, gameId }) => {
        io.to(gameId).emit('message', { playerName, text, team })
    })

    socket.on('new-role', async ({ role, team, playerId }) => {
        const player = await Player.findOne({ _id: playerId })
        const game = await Game.findOne({ _id: player.gameId })

        game.playerRoles.push({ role, team, username: player.username })
        game.save()

        const gameFull = game.playerRoles.length >= 4 ? true : false

        io.to(player.gameId).emit('new-player-role', { role, team, username: player.username, gameFull })
        
        io.to(player.gameId).emit('roleMessage',  { playerName: player.username, playerTeam: team, role })
    })

    socket.on('sendClue', async ({ clue, guessNumber, playerId }, callback) => {
        const player = await Player.findOne({ _id: playerId })
        const clueText = `${clue} ${guessNumber}`
        io.to(player.gameId).emit('guessingPhase', { guessNumber, team: player.team })
        io.to(player.gameId).emit('clueMessage',  { playerName: player.username , playerTeam: player.team, clue: clueText })
        io.to(player.gameId).emit('updateGameStatusClue', {clue, guessNumber: (parseInt(guessNumber) + 1) })
        callback()  
    })

    socket.on('handleGuess', async ({ word, guessNumber, boardId, player }, callback) => {
        const board = await Board.findOne({ _id: boardId })
        const index = board.wordlist.indexOf(word)
        const cardTeam = board.overlay[index]
        const opposingTeam = player.team === 'red' ? 'blue' : 'red'

        io.to(player.gameId).emit('guessMessage', { playerName: player.username, playerTeam: player.team, cardWord: word.toUpperCase(), cardTeam })
        io.to(player.gameId).emit('card-reveal', { cardTeam, word })

        board.revealedCards = [...board.revealedCards, {cardTeam, word}]
        board.save()

        const winningTeam = assessVictory(board)
        if (winningTeam) {
            io.to(player.gameId).emit('card-victory', { team: winningTeam })
            const game = await Game.findOne({ _id: player.gameId })
            game.activeState = 'victory-screen'
            game.save()
        }

        if (cardTeam === player.team) {
            io.to(player.gameId).emit('update-score', { cardTeam })
            if (guessNumber !== 0) {
                io.to(player.gameId).emit('updateGameStatusClue', { guessNumber })
                return callback({yourTurn:true, team: player.team})
            }
        } 
        else if (cardTeam === 'assassin') {
            io.to(player.gameId).emit('assassin-game-over', { opposingTeam })
            const game = await Game.findOne({ _id: player.gameId })
            game.activeState = 'victory-screen'
            game.save()
            return callback({yourTurn:false, team: opposingTeam})
        } 
        else if (cardTeam === opposingTeam) {
            io.to(player.gameId).emit('update-score', { cardTeam })
        }

        io.to(player.gameId).emit('updateGameStatusClue', { clue: ' - ', guessNumber: ' - ' })
        callback({yourTurn:false, team: opposingTeam})
        io.to(player.gameId).emit('spymasterPhase', { activeTeam: opposingTeam })
    })

    socket.on('updateActivePlayer', ({playerName, team, role, gameId}) => {
        io.to(gameId).emit('updateGameStatusPlayer', { playerName, team, role })
    })

    socket.on('updateClue', ({gameId}) => {
        io.to(gameId).emit('updateGameStatusClue', { clue: '', guessNumber: '' })
    })

    socket.on('end-turn', ({activeTeam, gameId}) => {
        io.to(gameId).emit('spymasterPhase', { activeTeam })
    })

    socket.on('startGame', async ({gameId, startTeam}) => {
        const game = await Game.findOne({ _id: gameId })
        const gameFull = game.playerRoles.length >= 4 ? true : false

        if (gameFull || game.lobbyName === 'TEST') {
            game.activeState = 'ongoing'
            game.save()
            io.to(gameId).emit('revealGameStatus')
            io.to(gameId).emit('spymasterPhase', { activeTeam: startTeam })
        }
    })

    socket.on('clear-board', async ({gameId}) => {

        // Removes usernames from team boxes
        const game = await Game.findOne({ _id: gameId })
        while (game.playerRoles.length > 0) {
            let player = game.playerRoles.pop()
            io.to(gameId).emit('reset-player-role', { role: player.role, team: player.team })
        }
        // game.playerRoles.forEach((player) => {
        //     io.to(gameId).emit('reset-player-role', { role: player.role, team: player.team }) 
        // })
        // game.playerRoles = []
        game.save()

        await Board.findOneAndDelete({ gameId })        
    })

    socket.on('send-restart', async ({gameId}) => {
        io.to(gameId).emit('new-round', {gameId})
        const game = await Game.findOne({ _id: gameId })
        game.activeState = 'pregame'
        game.save()
    })


    socket.on('reset-role', async ({ playerId }) => {
        const player = await Player.findOne({ _id: playerId })
        const game = await Game.findOne({ _id: player.gameId })

        if (game.activeState === 'pregame') {
            io.to(player.gameId).emit('reset-player-role', { role: player.role, team: player.team })

            game.playerRoles = game.playerRoles.filter((eachPlayer) => { return eachPlayer.username !== player.username })
            game.save()

            player.role = 'guesser'
            player.team = 'civilian'
            player.save()

            socket.emit('enable-team-join')
        }
    })


    socket.on('disconnect', async () => {
        const player = await Player.findOneAndDelete({ socketId: socket.id })

        if (player) {
            io.to(player.gameId).emit('reset-player-role', { role: player.role, team: player.team }) 
            io.to(player.gameId).emit('message', { playerName: player.username, text: ` has left.`, team: player.team })
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
            io.to(player.gameId).emit('message', { playerName: player.username, text: ` has left.`, team: player.team })

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


const assessVictory = ({startTeam, revealedCards}) => {
    let winningTeam = null;
    const teams = ['red', 'blue'];
    teams.forEach((team) => {
        const score = revealedCards.filter((card) => card.cardTeam === team).length
        const requiredScore = team === startTeam ? 9 : 8
        if (score === requiredScore) {
            winningTeam = team;
        }
    })
    return winningTeam
}




server.listen(port, () => {
    console.log('Server is up on port ' + port)
})