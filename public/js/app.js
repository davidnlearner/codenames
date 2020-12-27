const $boardContainer = document.querySelector("#board-container")

const generateBoard = (boardId) => {
    clearBoard()
    fetch(`/boards/${boardId}`)   // change call
    .then(response => response.json())
    .then((data) => {
        data.wordlist.forEach((word, i) => {
            const node = document.createElement('div')
            node.className = "card"
           //node.classList.add(`${data.overlay[i]}-card`)   //if spymaster
            node.innerText = word
            $boardContainer.appendChild(node)
        })
    });
}


const clearBoard = () => { $boardContainer.innerHTML = '' }

generateBoard("5fe8cb024161112e68b1aebf")