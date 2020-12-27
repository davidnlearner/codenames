const $boardContainer = document.querySelector("#board-container")

const generateBoard = (boardId) => {
    clearBoard()
    fetch(`/boards/${boardId}/wordlist`)
    .then(response => response.json())
    .then((data) => {
        data.forEach((word) => {
            const node = document.createElement('div')
            node.className = "card"
            node.innerText = word
            $boardContainer.appendChild(node)
        })
    });
}


const clearBoard = () => { $boardContainer.innerHTML = '' }