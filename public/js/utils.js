const lettersOnly = (e) => {
    const key = e.keyCode
    // In order CAPITAL LETTERS, backspace, lower case letters, return key
    return ((key >= 65 && key <= 90) || key == 8 || (key >= 97 && key <= 122) || key == 13)
}

const lettersOnlyCaps = (e) => {
    const key = e.keyCode
    if ((key >= 97 && key <= 122)){
        return (key - 32)
    }
    return ( key == 8 || (key >= 65 && key <= 90) || key == 13)
}

const numbersOnly = (e) => {
    const key = e.keyCode
    return ((key >= 48 && key <= 57) || key == 8 || key == 13)
}