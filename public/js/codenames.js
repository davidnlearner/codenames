const $boardContainer = document.querySelector("#board-container")
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
    const response = await fetch(`/boards/${gameId}`, {method: 'POST'})
    const data = await response.json()
    generateBoard(data._id)
}

const newGame = async (lobbyName) => {
    const response = await fetch(`/games/${lobbyName}`, {method: 'POST'})
    const data = await response.json()
    generateBoard(data.board._id)
}

const isNewGame = async (lobbyName) => {
    const response = await fetch(`/games/lobby/${lobbyName}`)
    const data = await response.json()
    console.log(data)
    if (data.msg === 'no game found'){
        return newGame(lobbyName)
    }
    const boardRes = await fetch(`/boards/game/${data._id}`)
    const board = await boardRes.json()
    generateBoard(board._id)
}

isNewGame(lobbyName)
