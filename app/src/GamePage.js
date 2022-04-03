import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import properties from './mqttClient'
import Game from './Game'

function GamePage({login}) {
    const navigate = useNavigate()
    const { id } = useParams()
    const [game, setGame] = useState({})
    const [admin, setAdmin] = useState({})
    const [players, setPlayers] = useState([{login: ''}])
    const [inGame, setInGame] = useState(false)
    const [edit, setEdit] = useState(false)
    const [editForm, setEditForm] = useState({})
    const [chat, setChat] = useState([])
    const [message, setMessage] = useState('')
    const [invite, setInvite] = useState(false)
    const [userToInvite, setUserToInvite] = useState('')
    const [onlineUsers, setOnlineUsers] = useState([])
    const [error, setError] = useState('')

    useEffect(() => {
        properties.client.unsubscribe('/games');
        properties.client.unsubscribe('/login');
        properties.client.unsubscribe('/logout');
        properties.client.unsubscribe('/guest');
        properties.client.unsubscribe('/main-chat');
        properties.client.subscribe(`/game/${id}`);
        properties.client.subscribe(`/players/${id}`);
        properties.client.subscribe(`/chat/${id}`);
        if (login){
            properties.client.subscribe(`/messages/${login}/+`)
            properties.client.subscribe(`/messages/+/${login}`)
            properties.client.subscribe(`/invites/${login}`)
        }
        properties.gameChat = []
        axios.get(`http://localhost:5000/games/${id}`)
            .then(async (response) => {
                console.log(response.data)
                setGame(response.data)
                setAdmin(response.data.admin)
                setPlayers(response.data.players)
            }).catch((e) => {
                if (e.response){
                    console.log(e.response.data)
                    setError(e.response.data)
                }
            });
        return () => {
            setGame({})
            setAdmin({})
            setPlayers([])
        }
    }, [id]);
    useEffect(() => {
        if (players === undefined || players.length === 0) {
            properties.client.publish(`/games`, id);
            GoBack()
        }
        if (players !== undefined) {
            for (var i=0; i<players.length; i++) {
                if (players[i].login === login) {
                    setInGame(true)
                    break
                } else {
                    setInGame(false)
                }
            }
        }
    }, [players]);

    function Reload (){
        if(properties.gameReload || properties.gamePlayersReload){
            axios.get(`http://localhost:5000/games/${id}`)
            .then(async(response)=>{
                console.log(response.data)
                setGame(response.data)
                setAdmin(response.data.admin)
                setPlayers(response.data.players)
            }).catch((e)=>{
                if (e.response && e.response.status === 404) {
                    GoBack()
                } else if (e.response){
                    console.log(e.response.data)
                }
            }).finally(()=>{
                properties.gameReload = false
                properties.gamePlayersReload = false
            });
        }
        if(properties.gameChatReload){
            setChat(properties.gameChat)
            properties.gameChatReload = false
        }
    }
    setInterval(Reload, 1000);

    function Leave(){
        axios.post(`http://localhost:5000/games/leave`, { 
            login: login
        }).then(async (response) => {
            setInGame(false)
            console.log(response.data)
            properties.client.publish(`/players/${id}`, login)
            properties.client.publish(`/chat/${id}`, `${login} has left the game`)
            setPlayers(response.data.players)
        }).catch((e) => {
            if (e.response){
                console.log(e.response.data)
            }
        })
    }

    function Join(){
        axios.post('http://localhost:5000/games/join', {
            id: id,
            login: login
        }).then(async(response)=>{
            console.log(response.data)
            setPlayers(response.data.players)
            setInGame(true)
            properties.client.publish(`/players/${id}`, login)
            properties.client.publish(`/chat/${id}`, `${login} has joined the game`)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        })
    }

    function Edit(){
        axios.put(`http://localhost:5000/games/${id}`, { 
            name: editForm.name,
            maxPlayers: editForm.maxPlayers,
            status: editForm.status,
            admin: editForm.admin
        }).then(async(response)=>{
            console.log(response.data)
            setGame(response.data)
            setAdmin(response.data.admin)
            properties.client.publish(`/game/${id}`, id)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        }).finally(()=>{
            setEdit(false)
            setEditForm({})
        });
    }

    function GoBack(){
        properties.client.unsubscribe(`/game/${id}`)
        properties.client.unsubscribe(`/players/${id}`)
        properties.client.unsubscribe(`/chat/${id}`)
        navigate('/games')
    }

    function onChangeMessage(e){
        setMessage(e.target.value)
        if (e.keyCode === 13)
            Send()
    }

    function Send(){
        if(message.trim().length > 0){
            properties.client.publish(`/chat/${id}`, `${login}: ${message}`)
            setChat([...chat, `${login}: ${message}`])
            setMessage('')
        }
    }

    function Start(){
        axios.post(`http://localhost:5000/games/start/${id}`)
        .then(async(response)=>{
            properties.client.publish(`/game/${id}`, id)
            console.log(response.data)
            setGame(response.data)
            setAdmin(response.data.admin)
            setPlayers(response.data.players)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        })
    }

    function CheckInvite(){
        setInvite(true)
        axios.get('http://localhost:5000/online-users')
        .then(async(response)=>{
            setOnlineUsers(response.data)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        });
    }

    function Invite(){
        setInvite(false)
        properties.client.publish(`/invites/${userToInvite}`, JSON.stringify({id: id, name: game.name}))
    }

    return (
        <>
            {!error && <div>
                {players &&
                <div className='game-page'>
                    <h1>{game.name}</h1>

                    <div className='menu'>

                        { (login !== admin.login || edit === false) && <div className='info'>
                            <div>maxPlayers: {game.maxPlayers}</div>
                            <div>Status: {game.status}</div>
                            <div>Admin: {admin.login}</div>
                            <div>Players: {players.length}</div>
                        </div>}

                        {login === admin.login && edit === true && <div className='edit-game info'>
                            <form>
                                <div>
                                    <label>Nazwa gry:</label>
                                    <input type='text' defaultValue={game.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})}/>
                                </div>
                                <div>
                                <label> Admin: </label>
                                    <select defaultValue={admin.login} onChange={(e) => setEditForm({...editForm, admin: e.target.value})}>
                                    {players.map((player) => 
                                        (<option key={player.login} value={player.login}>{player.login}</option>)
                                    )}
                                    </select>
                                </div>
                                <div>
                                    <label> maxPlayers: </label>
                                    <select defaultValue={game.maxPlayers} onChange={(e) => setEditForm({...editForm, maxPlayers: e.target.value})}>
                                        <option value="2">2</option>
                                        <option value="3">3</option>
                                        <option value="4">4</option>
                                        <option value="5">5</option>
                                    </select>
                                </div>
                                <div>
                                    <label> Status: </label>
                                    <select defaultValue={game.status} onChange={(e) => setEditForm({...editForm, status: e.target.value}) }>
                                        <option value="public">public</option>
                                        <option value="private">private</option>
                                    </select>
                                </div>
                            </form>
                        </div>}

                        { login === admin.login && edit === false && !game.gameStarted && players.length > 1 && <button onClick={Start}> Start game </button>}
                        { login === admin.login && edit === false && !game.gameStarted && <button onClick={() => setEdit(true)}> Edit </button>}
                        { login === admin.login && edit === true && <button onClick={Edit}> Save </button>}
                        { login === admin.login && edit === true && <button onClick={() => {setEdit(false); setEditForm({})}}> Cancel </button>}

                        { login !== ""  && <div>
                            { inGame === false && players.length < game.maxPlayers && !game.gameStarted && <button onClick={Join}> Join game </button> }
                            { inGame === true && <button onClick={Leave}> Leave game </button> }
                        </div> }
                        { inGame === false && <button onClick={GoBack}> Go back </button>}
                        
                    </div>

                    <div className='players'>
                        <h2>Players:</h2>
                        {players.map((player) => {
                            return (
                                <div key={player.login}> {player.login} </div>
                            )
                        })}
                        {login === admin.login && !invite && <div>
                            <button onClick={CheckInvite}> Invite player </button>
                        </div>}
                        {invite && <form>
                            <select defaultValue={admin.login} onChange={(e) => setUserToInvite(e.target.value)}>
                                {onlineUsers.map((player) => 
                                    (<option key={player.login} value={player.login}>{player.login}</option>)
                                )}
                            </select>
                            <button type='button' onClick={Invite}> Invite </button>
                            <button type='button' onClick={() => setInvite(false)}> Cancel </button>
                        </form>}
                    </div>

                    <div className='game-chat'>
                        <div>
                            {chat.map((message, index)=>{
                                return(
                                    <p key={index}>
                                        {message}
                                    </p>
                                )}
                            )}
                        </div>
                        { login && <input type="text" value={message} onChange={onChangeMessage} onKeyUp={onChangeMessage} />}
                        { login && <button onClick={Send}> Send </button>}
                    </div>

                    { !game.gameStarted && <div className='game wait-container'>
                        <h1 className='wait'> Wait for admin to start the game </h1>
                    </div>}

                    { game.gameStarted && <div className='game'>
                        < Game login={login} setGame2={setGame} inGame={inGame} Reload={Reload} />
                    </div>}


                </div>
                }
            </div>}
            {error && <h1> {error} </h1>}
        </>
    )
}

export default GamePage;