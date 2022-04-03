import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams} from 'react-router-dom'
import properties from './mqttClient'

function Game({login, setGame2, inGame, Reload}) {
    const { id } = useParams()
    const [game, setGame] = useState({})
    const [players, setPlayers] = useState([])
    const [cards, setCards] = useState({})
    const [organs, setOrgans] = useState({})
    const [chosenCard, setChosenCard] = useState({})
    const [target, setTarget] = useState('')
    const [win, setWin] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        axios.get(`http://localhost:5000/games/${id}`)
            .then(async (response) => {
                setGame(response.data)
                setPlayers(response.data.players)
                setCards(response.data.playersCards)
                setOrgans(response.data.playersOrgans)
            }).catch((e) => {
                if (e.response){
                    console.log(e.response.data)
                }
            });
        Reload_Game()
        Reload()
        return () => {
            setGame({})
            setPlayers([])
            setCards({})
            setOrgans({})
        }
    }, [id]);

    function Reload_Game (){
        if(properties.gameReload){
            axios.get(`http://localhost:5000/games/${id}`)
            .then(async(response)=>{
                setGame(response.data)
                setPlayers(response.data.players)
                setCards(response.data.playersCards)
                setOrgans(response.data.playersOrgans)
            }).catch((e)=>{
                if (e.response){
                    console.log(e.response.data)
                }
            }).finally(()=>{
                properties.gameReload = false
                properties.gamePlayersReload = false
            });
        }
    }
    setInterval(Reload_Game, 1000);

    function Play(){
        if (chosenCard.cardColor !== undefined && chosenCard.cardType !== undefined ) {
            axios.post(`http://localhost:5000/games/play/${id}`, {
                login: login,
                card: chosenCard,
                target: target
            }).then(async(response) => {
                properties.client.publish(`/game/${id}`, id)
                console.log(response.data)
                setGame(response.data.game)
                setPlayers(response.data.game.players)
                setCards(response.data.game.playersCards)
                setOrgans(response.data.game.playersOrgans)
                setWin(response.data.win)
                setError('')
                if(response.data.win){
                    properties.client.publish(`/chat/${id}`, `${login} won the game!`)
                    setGame2(response.data.game)
                    Reload()
                }
            }).catch((e) => {
                if (e.response){
                    setError(e.response.data)
                    console.log(e.response.data)
                }
            }).finally(() => {
                setChosenCard({})
                setTarget('')
                Reload_Game()
                Reload()
            });
        }
    }

    function Discard(){
        if (chosenCard.cardColor !== undefined && chosenCard.cardType !== undefined ) {
            axios.post(`http://localhost:5000/games/discard/${id}`, {
                login: login,
                card: chosenCard
            }).then(async (response) => {
                properties.client.publish(`/game/${id}`, id)
                console.log(response.data)
                setGame(response.data)
                setPlayers(response.data.players)
                setCards(response.data.playersCards)
                setOrgans(response.data.playersOrgans)
                setError('')
            }).catch((e) => {
                if (e.response){
                    setError(e.response.data)
                    console.log(e.response.data)
                }
            }).finally(() => {
                setChosenCard({})
                Reload_Game()
            });
        }
    }

    return (
        <div>
            <div className='oponents'>
                {players.filter(player => player.login !== login).map((player, index) => {
                    if (player.login === target) {
                        return (
                            <button key={index} onClick={() => setTarget(player.login)} className='chosen' >
                                <div key={index} className='oponent'>
                                    <h3>{player.login}</h3>
                                    {organs[player.login] && organs[player.login].map((card, index) => {
                                        if (card.infected) {
                                            return (
                                                <div key={index} className='card'>
                                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-infected.png`).default} alt={card.cardColor + card.cardType} />
                                                </div>
                                            )
                                        }
                                        if (card.treated && !card.cured) {
                                            return (
                                                <div key={index} className='card'>
                                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-treated.png`).default} alt={card.cardColor + card.cardType} />
                                                </div>
                                            )
                                        }
                                        if (card.cured) {
                                            return (
                                                <div key={index} className='card'>
                                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-cured.png`).default} alt={card.cardColor + card.cardType} />
                                                </div>
                                            )
                                        }
                                        return (
                                            <div key={index} className='card'>
                                                <img src={require(`../img/${card.cardType}-${card.cardColor}.png`).default} alt={card.cardColor + card.cardType} />
                                            </div>
                                        )
                                    })}
                                </div>
                            </button>
                        )}
                    return (
                        <button key={index} onClick={() => setTarget(player.login)}>
                            <div key={index} className='oponent'>
                                <h3>{player.login}</h3>
                                {organs[player.login] && organs[player.login].map((card, index) => {
                                    if (card.infected) {
                                        return (
                                            <div key={index} className='card'>
                                                <img src={require(`../img/${card.cardType}-${card.cardColor}-infected.png`).default} alt={card.cardColor + card.cardType} />
                                            </div>
                                        )
                                    }
                                    if (card.treated && !card.cured) {
                                        return (
                                            <div key={index} className='card'>
                                                <img src={require(`../img/${card.cardType}-${card.cardColor}-treated.png`).default} alt={card.cardColor + card.cardType} />
                                            </div>
                                        )
                                    }
                                    if (card.cured) {
                                        return (
                                            <div key={index} className='card'>
                                                <img src={require(`../img/${card.cardType}-${card.cardColor}-cured.png`).default} alt={card.cardColor + card.cardType} />
                                            </div>
                                        )
                                    }
                                    return (
                                        <div key={index} className='card'>
                                            <img src={require(`../img/${card.cardType}-${card.cardColor}.png`).default} alt={card.cardColor + card.cardType} />
                                        </div>
                                    )
                                })}
                            </div>
                        </button>
                    )
                })}
            </div>

            {!win && <div>
                {players.filter(player => player === players[game.turn]).map((player, index) => {
                    return (
                        <div key={index}>
                            <h3>Kolejka: {player.login}</h3>
                        </div>
                        )
                })}
            </div>}

            {win && <div>
                <h3>Wygrał gracz: {win}</h3>
            </div>}

            {inGame && <div className='player'>
                <div className='organs'>
                    <h3>Your organs</h3>    
                    {organs[login] && organs[login].map((card, index) => {
                        if (card.infected) {
                            return (
                                <div key={index} className='card'>
                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-infected.png`).default} alt={card.cardColor + card.cardType} />
                                </div>
                            )
                        }
                        if (card.treated && !card.cured) {
                            return (
                                <div key={index} className='card'>
                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-treated.png`).default} alt={card.cardColor + card.cardType} />
                                </div>
                            )
                        }
                        if (card.cured) {
                            return (
                                <div key={index} className='card'>
                                    <img src={require(`../img/${card.cardType}-${card.cardColor}-cured.png`).default} alt={card.cardColor + card.cardType} />
                                </div>
                            )
                        }
                        return (
                            <div key={index} className='card'>
                                <img src={require(`../img/${card.cardType}-${card.cardColor}.png`).default} alt={card.cardColor + card.cardType} />
                            </div>
                        )
                    })}
                </div><div className='cards'>
                    <h3>Your cards</h3>
                    {cards[login] && cards[login].map((card, index) => {
                        if (card === chosenCard) {
                            return (
                                <div key={index} className='card'>
                                    <button className='chosen'>
                                        <img src={require(`../img/${card.cardType}-${card.cardColor}.png`).default} alt={card.cardColor + card.cardType} />
                                    </button>
                                </div>
                            )
                        }
                        return (
                            <div key={index} className='card'>
                                <button onClick={() => setChosenCard(card)}>
                                    <img src={require(`../img/${card.cardType}-${card.cardColor}.png`).default} alt={card.cardColor + card.cardType} />
                                </button>
                            </div>
                        )
                    })}
                    { players.find(player => player.login === login) === players[game.turn] && <div>
                        <button onClick={Play}>Play</button>
                        <button onClick={Discard}>Discard</button>
                    </div> }
                    {error && <div className='error'>{error}</div>}
                </div>
            </div>}

        </div>
    )
}
export default Game;