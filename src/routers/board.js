const express = require('express')
const Board = require('../models/board')
const router = new express.Router()
const { newWords, newOverlay, getStartTeam } = require('../utils/gameSetup')


router.post('/boards', async (req, res) => {
    const startTeam = getStartTeam()
    const board = new Board({
        gameId: req.body.gameId,
        wordlist: newWords( req.body.oldWords ),
        startTeam,
        overlay: newOverlay(startTeam),
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


router.get('/boards/wordlist/:id', async (req, res) => {
    const board = await Board.findOne({ _id: req.params.id })
    try {
        res.send({wordlist: board.wordlist, startTeam: board.startTeam})
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/boards/overlay/:id', async (req, res) => {
    const board = await Board.findOne({ _id: req.params.id })
    try {
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