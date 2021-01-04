const socket = io()

// Elements
const $boardContainer = document.querySelector("#board-container")

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

const $clueForm = document.querySelector('#clue-form')
const $clueFormInput = $clueForm.querySelectorAll('input')
const $clueFormButton = $clueForm.querySelector('button')

const $joinTeamButton = document.querySelectorAll('.team-join-btn')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const { username, lobbyName } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const generateBoard = async (boardId) => {
    clearBoard()
    const response = await fetch(`/boards/initial/${boardId}`)
    const data = await response.json()

    sessionStorage.setItem('startTeam', data.startTeam)

    data.wordlist.forEach((word) => {
        const node = document.createElement('div')
        node.className = "card"
        node.innerHTML = `<div class='card-word'><span>${word}</span></div>`
        $boardContainer.appendChild(node)
    });
}

const updateBoard = async (boardId, role) => {
    const response = await fetch(`/boards/${boardId}/${role}`)
    const data = await response.json()

    const $boardCards = $boardContainer.querySelectorAll('.card')

    $boardCards.forEach((card, i) => {
        card.classList.add(`${data.overlay[i]}-card`)
    })

}

const clearBoard = () => { $boardContainer.innerHTML = '' }

const newBoard = async (gameId) => {
    const response = await fetch(`/boards`, { method: 'POST', body: JSON.stringify({ 'gameId': `${gameId}` }) })
    const data = await response.json()
    generateBoard(data._id)
}

const newGame = async (lobbyName) => {
    const gameRaw = await fetch(`/games`, { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({lobbyName})})
    const game = await gameRaw.json()

    const boardRaw = await fetch(`/boards`, {method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify({ gameId: game._id }) })
    const board = await boardRaw.json()

    return {game, board}
}

const getGameData = async (lobbyName) => {
    const gameRaw = await fetch(`/games/lobby/${lobbyName}`)
    const game = await gameRaw.json()
    if (game.msg === 'no game found') {
        return newGame(lobbyName)
    }

    const boardRaw = await fetch(`/boards/game/${game._id}`)
    const board = await boardRaw.json()

    return { game, board }
}

const joinGame = async (username, lobbyName) => {
    const {game, board} = await getGameData(lobbyName)
    const gameId = game._id
    sessionStorage.setItem('gameId', gameId)

    socket.emit('join', {playerName: username, gameId}, ({error, player}) => {
        if (error) {
            alert(error)
            location.href = '/'
            return
        } else {
            sessionStorage.setItem('username', player.username)
            sessionStorage.setItem('playerId', player._id)
        }
    })

    sessionStorage.setItem('boardId', board._id)
    generateBoard(board._id)

}


// Chat App functions

const autoscroll = () => {
    // New message element
    const $newMessage = $messages.lastElementChild

    // Height of new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin

    // Visible height
    const visibleHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    // How far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

socket.on('message', (message) => {
    const username = message.username + ":"
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        // createdAt: moment(message.createdAt).format('hh:mm a'),
        username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value
    const playerId = sessionStorage.getItem('playerId')

    socket.emit('sendMessage', { message, playerId }, (error) => {
        // enable form
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()

        if (error) {
            return console.log(error)
        }

        console.log('Message delivered!')
    })
})

// Role Assignment

$joinTeamButton.forEach((button) => {
    button.addEventListener('click', async (e) => {
        const role = e.target.getAttribute('role')
        const team = e.target.getAttribute('team')
        const startTeam = sessionStorage.getItem('startTeam')

        $joinTeamButton.forEach((btn) => {
            btn.setAttribute('disabled', 'disabled')
        })

        const changes = { 'role': role, 'team': team }
        const playerId = sessionStorage.getItem('playerId')
        const response = await fetch(`/players/${playerId}`, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) })
        const player = await response.json()

        if (player.role === 'cluegiver') {
            const boardId = sessionStorage.getItem('boardId')
            updateBoard(boardId, player.role)
            $clueForm.style.display = 'block'
            console.log(startTeam)
            if ( player.team === startTeam){
                console.log('hi')
                $clueFormButton.removeAttribute('disabled')
            }

        }

        socket.emit('new-role', { role, team, playerId })
    })
})

socket.on('new-player-role', ({ role, team, username }) => {
    const wrapper = document.querySelector(`#${role}-${team}-wrapper`)
    wrapper.innerHTML = `<p id='role-username'> ${username} </p>`

})

// Game Events

$clueForm.addEventListener('submit', (e) => {
    e.preventDefault()

    $clueFormButton.setAttribute('disabled', 'disabled')

    const clue = e.target.elements.clue.value
    const guessNumber = e.target.elements.guessNumber.value
    const playerId = sessionStorage.getItem('playerId')

    socket.emit('sendClue', { clue, guessNumber, playerId }, (error) => {
        $clueFormInput[0].value = ''
        $clueFormInput[1].value = ''

        if (error) {
            return console.log(error)
        }

        console.log('Clue delivered!')
    })
})

socket.on('guessingPhase', async ({ clue, guessNumber, team }) => {
    const playerId = sessionStorage.getItem('playerId')
    const player = await fetch('/players', { method: 'GET', body: JSON.stringify({_id: playerId}) })

    if (player.role === 'guesser' && player.team === team) {
        const boardId = sessionStorage('boardId')
        const $cards = document.querySelectorAll('.card')

        $cards.forEach((card) => {
            card.addEventListener('click', () => {
                socket.emit('guess', { word: card.innerText, guessNumber: (guessNumber - 1), boardId, player }, (yourTurn) => {
                    if (yourTurn === true) {
                        //Continue somehow
                    } else {
                        $cards.forEach((card) => {
                            card.removeEventListener('click')
                        })
                        socket.emit('cluePhase', { team })
                    }
                })
            })
        })
    }
})

socket.on('cluegiverPhase', async ({ opposingTeam }) => {
    const playerId = sessionStorage.getItem('playerId')
    const player = await fetch('/players', { method: 'GET', body: JSON.stringify({_id: playerId}) })

    if (player.role === 'cluegiver' && player.team !== opposingTeam) {
        $clueFormButton.removeAttribute('disabled')
    }
})

joinGame(username, lobbyName)