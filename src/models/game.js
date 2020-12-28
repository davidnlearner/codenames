const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    boardId: {
        type: String,
        required: true
    },
    players: {
        type: Array,
        required: true
    },
    lobbyName: {
        type: String,
        required: true,
    }
})
// add game room name?

const Game = mongoose.model('Game', gameSchema)

module.exports = Game