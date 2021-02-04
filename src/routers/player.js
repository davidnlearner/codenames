const express = require('express')
const router = new express.Router()
const socketio = require('socket.io')
const Player = require('../models/player')


router.post('/players', async (req, res) => {
    const username = req.body.username
    const gameId = req.body.gameId
    
    const player = new Player({
        username,
        gameId,
    })

    try {
        await player.save()
        res.status(201).send(player)
    } catch (e) {
        res.status(400).send(e)
    }

})

router.get('/players', async (req, res) => {
    const players = await Player.find()
    try {
        res.send(players)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.get('/players/:id', async (req, res) => {
    const player = await Player.findOne({_id: req.params.id})
    try {
        res.send(player)
    } catch (e) {
        res.status(500).send(e)
    }
})

router.patch('/players/:id', async (req, res) => {
    const updates = Object.keys(req.body)
    const allowedUpdates = ['role', 'team']
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update))

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid Updates!' })
    }

    try{
        const player = await Player.findOne({_id: req.params.id})
        updates.forEach((update) => player[update] = req.body[update])
        await player.save()
        res.send(player)
    }catch (e) {
        res.status(400).send(e)
    }
})

router.delete('/players', async (req, res) => {
    try {
        const player = await Player.findOneAndDelete({_id: req.body._id})
        if (!player) {
            res.status(404).send()
        }
        res.send(player)
    } catch (e) {
       res.status(500).send()
   }
})



module.exports = router