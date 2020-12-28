const mongoose = require('mongoose')

const boardSchema = new mongoose.Schema({
    gameId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Game'
    },
    wordlist: {
        type: Array,
        required: true
    },
    startingTeam: {
        type: String,
        required: true
    },
    overlay: {
        type: Array,
        required: true,
    }
})
// add game room name?

const Board = mongoose.model('Board', boardSchema)

module.exports = Board