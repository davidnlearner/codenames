const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
    players: {
        type: Array,
        required: true
    },
    lobbyName: {
        type: String,
        required: true,
    },
    score: {
        type: Array,
        required: true,
        default: [0,0]
    },
    currentRound: {
        type: Number,
        required: true,
        default: 0
    }
})

const Game = mongoose.model('Game', gameSchema)

module.exports = Game