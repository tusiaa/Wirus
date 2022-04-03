class Card {
    constructor(cardType, cardColor) {
        this.cardType = cardType
        this.cardColor = cardColor
        if (this.cardType === "organ") {
            this.infected = false
            this.treated = false
            this.cured = false
        }
    }

    Infect() {
        if (this.cured) {
            throw "Cannot infect a cured card"
        } else if (this.treated) {
            this.treated = false
        } else if (!this.infected) {
            this.infected = true
        } else {
            return "discard"
        }
    }

    Treat() {
        if (this.cured){
            throw "Cannot treat a cured card"
        } else if (this.infected) {
            this.infected = false
        } else if (this.treated) {
            this.cured = true
        } else {
            this.treated = true
        }
    }

    




}


module.exports = Card