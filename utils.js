const delay = ms => new Promise((resolve, reject) => setTimeout(resolve, ms))

const zeroPad = number => {
    if (number > 9) {
        return number
    } else {
        return `0${number}`
    }
}

module.exports = {
    delay,
    zeroPad
}