const socket = io()

// Elements
const $boardContainer = document.querySelector("#board-container")
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $messages = document.querySelector('#messages')

// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML

// Options
const {username, lobbyName} = Qs.parse(location.search, { ignoreQueryPrefix:true})

const generateBoard = async (boardId) => {
    clearBoard()
    const response = await fetch(`/boards/${boardId}`)
    const data = await response.json()
    
    data.wordlist.forEach((word, i) => {
        const node = document.createElement('div')
        node.className = "card"
        node.classList.add(`${data.overlay[i]}-card`)   //if spymaster
        node.innerText = word
        $boardContainer.appendChild(node)
    });
}

const clearBoard = () => { $boardContainer.innerHTML = '' }

const newBoard = async (gameId) => {
    const response = await fetch(`/boards`, {method: 'POST', body: JSON.stringify({'gameId': `${gameId}`})})
    const data = await response.json()
    generateBoard(data._id)
}

const newGame = async (lobbyName) => {
    const response = await fetch(`/games/${lobbyName}`, {method: 'POST'})
    const data = await response.json()
    return data
}

const getGameData = async (lobbyName) => {
    const response = await fetch(`/games/lobby/${lobbyName}`)
    const data = await response.json()
    if (data.msg === 'no game found'){
        return newGame(lobbyName)
    }
    return data
}

const joinGame = async (username, lobbyName) => {
    const game = await getGameData(lobbyName)

    // finds and loads game board
    const boardRaw = await fetch(`/boards/game/${game._id}`)
    const board = await boardRaw.json()
    generateBoard(board._id)

    // makes new player in game
    const playerData = {'username': `${username}`, 'gameId': `${game._id}`}

    const playerRaw = await fetch('/players', { method: 'POST', headers: { "Content-Type": "application/json" }, body: JSON.stringify(playerData) })
    const player = await playerRaw.json()

    // Send join messages
    socket.emit('join', player, (error) => {
        if (error) {
            alert(error)
            location.href = '/'
        }
    })

}

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

joinGame(username, lobbyName)