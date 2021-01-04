const express = require('express')
const Board = require('../models/board')
const router = new express.Router()
const { newWords, newOverlay, getStartTeam } = require('../utils/gameSetup')


router.post('/boards', async (req, res) => {
    const board = new Board({
        wordlist: newWords(),
        startTeam: getStartTeam(),
        overlay: newOverlay(this.startTeam),
        gameId: req.body.gameId
    })
    try{
        await board.save()
        res.status(201).send(board)
    } catch (e) {
        res.status(400).send(e)
    }
})

router.get('/boards/game/:gameId', async (req, res) => {
    const board = await Board.findOne({gameId: req.params.gameId})
    try {
        res.send(board)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/boards/:id/:role', async (req, res) => {
    const role = req.params.role
    const board = await Board.findOne({ _id: req.params.id })
    try {
        if ( role === 'guesser' ) {
            return res.send({wordlist: board.wordlist, startTeam: board.startTeam})
        }
        res.send(board)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/boards', async (req, res) => {
    const boards = await Board.find()
    try {
        res.send(boards)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.delete('/boards/:id', async (req, res) => {
    try {
        const board = await Board.findOneAndDelete(req.params.id)
        if (!board) {
            res.status(404).send()
        }
        res.send(board)
    } catch (e) {
        res.status(500).send()
    }
})

module.exports = router