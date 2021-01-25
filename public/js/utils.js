const lettersOnly = (e) => {
    const key = e.keyCode
    return ((key >= 65 && key <= 90) || key == 8 || (key >= 97 && key <= 122))
}