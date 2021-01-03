const socket = io()

// Elements
const $boardContainer = document.querySelector("#board-container")

const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

const $showOverlay = document.querySelector('#show-overlay')

const $joinTeamButton = document.querySelectorAll('.team-join-btn')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const { username, lobbyName } = Qs.parse(location.search, { ignoreQueryPrefix: true })

const generateBoard = async (boardId, role) => {
    clearBoard()
    const response = await fetch(`/boards/${boardId}/${role}`)
    const data = await response.json()

    data.wordlist.forEach((word) => {
        const node = document.createElement('div')
        node.className = "card"
        node.innerText = word
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
    const response = await fetch(`/games/${lobbyName}`, { method: 'POST' })
    const data = await response.json()
    return data
}

const getGameData = async (lobbyName) => {
    const response = await fetch(`/games/lobby/${lobbyName}`)
    const data = await response.json()
    if (data.msg === 'no game found') {
        return newGame(lobbyName)
    }
    return data
}


// TO DO: CHECK FOR ASSIGN ROLES
const joinGame = async (username, lobbyName) => {
    const game = await getGameData(lobbyName)
    sessionStorage.setItem('gameId', game._id)

    // makes new player in game
    const playerData = { 'username': `${username}`, 'gameId': `${game._id}` }

    const playerRaw = await fetch('/players', { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify(playerData) })
    const player = await playerRaw.json()
    sessionStorage.setItem('username', player.username)
    sessionStorage.setItem('playerId', player._id)

    
    // finds and loads game board
    const boardRaw = await fetch(`/boards/game/${game._id}`)
    const board = await boardRaw.json()

    sessionStorage.setItem('boardId', board._id)
    generateBoard(board._id, player.role)

    // Send join messages
    socket.emit('join', player, (error) => {
        if (error) {
            alert(error)
            location.href = '/'
        }
    })

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
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        message: message.text,
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})

// Still needs to be editted for this project
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    // disable form
    $messageFormButton.setAttribute('disabled', 'disabled')

    const message = e.target.elements.message.value

    socket.emit('sendMessage', message, (error) => {
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

$joinTeamButton.forEach((button) => {
    button.addEventListener('click', async (e) => {
        button.setAttribute('disabled', 'disabled')

        const role = e.target.getAttribute('role')
        const team = e.target.getAttribute('team')
        
        const changes = { 'role': role, 'team': team }
        const playerId = sessionStorage.getItem('playerId')
        const response = await fetch(`/players/${playerId}`, { method: 'PATCH', headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) })
        const player = await response.json()

        button.removeAttribute('disabled')

        if (player.role === 'cluegiver') {
            const boardId = sessionStorage.getItem('boardId')
            updateBoard(boardId, player.role)
        }

        socket.emit('new-role', {role, team, playerId})
    })
})


socket.on('new-player-role', ({role, team, username}) => {
    const wrapper = document.querySelector(`#${role}-${team}-wrapper`)
    wrapper.innerHTML = `${username}`

})


joinGame(username, lobbyName)