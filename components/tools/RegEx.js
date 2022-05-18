//Both functions use regular expressions to test whether the input from the user is valid.
//Tests that the player name is valid, which means its under 15 characters and does not include special characeters
const regExName = (input) => {
    const re = new RegExp("^(?=[a-zA-Z0-9._]{0,15}$)(?!.*[_.]{2})[^_.].*[^_.]$");
    return re.test(input);
}
//Tests that the room number is entirely numeric, with 1 to 4 digits
const regExRoom = (input) => {
    const re = new RegExp("^[0-9]{1,4}$");
    return re.test(input);
}
export {regExName, regExRoom};