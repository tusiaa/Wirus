import axios from 'axios'
import {useState, useEffect} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import properties from './mqttClient'

function GamesPage({login, setMainLogin}){
    const navigate = useNavigate()
    const [games, setGames] = useState([])
    const [users, setUsers] = useState([])
    const [chat, setChat] = useState([])
    const [message, setMessage] = useState('')
    const [search, setSearch] = useState('')
    const [invites, setInvites] = useState([])

    useEffect(()=>{
        properties.client.subscribe('/games');
        properties.client.subscribe('/login');
        properties.client.subscribe('/logout');
        properties.client.subscribe('/guest');
        properties.client.subscribe('/main-chat');
        if (login){
            properties.client.subscribe(`/messages/${login}/+`)
            properties.client.subscribe(`/messages/+/${login}`)
            properties.client.subscribe(`/invites/${login}`)
        }
        setChat(properties.mainChat)
        setInvites(properties.invites)
        Reload()
        axios.get('http://localhost:5000/games')
        .then(async(response)=>{
          setGames(response.data)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        });
        axios.get('http://localhost:5000/online-users')
        .then(async(response)=>{
            setUsers(response.data)
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        });
        return () => {
            setGames([])
            setUsers([])
        }
      }, []);

    function Reload (){
        if(properties.usersReload){
            axios.get('http://localhost:5000/online-users')
            .then(async(response)=>{
                setUsers(response.data)
            }).catch((e)=>{
                if (e.response){
                    console.log(e.response.data)
                }
            }).finally(()=>{
                properties.usersReload = false
            });
        }
        if(properties.gamesReload){
            axios.get(`http://localhost:5000/games/?search=${search}`)
            .then(async(response)=>{
                setGames(response.data)
            }).catch((e)=>{
                if (e.response){
                    console.log(e.response.data)
                }
            }).finally(()=>{
                properties.gamesReload = false
            });
        }
        if(properties.mainChatReload){
            setChat(properties.mainChat)
            properties.mainChatReload = false
        }
        if(properties.invitesReload){
            setInvites(properties.invites)
            properties.invitesReload = false
        }
    }
    setInterval(Reload, 1000)

    function logOut(){
        axios.post('http://localhost:5000/logout', {login: login}, { withCredentials: true})
        .then(async(response)=>{
            console.log(response.data)
            properties.client.unsubscribe(`/messages/${login}/+`)
            properties.client.unsubscribe(`/messages/+/${login}`)
            properties.client.publish('/logout', login)
            setMainLogin('')
            properties.messages = []
        }).catch((e)=>{
            if (e.response){
                console.log(e.response.data)
            }
        }).finally(()=>{
            Reload();
        });
    }

    function CreateRoom(){
        const roomName = prompt("Podaj nazwę pokoju")
        if(roomName){
            axios.post('http://localhost:5000/games/', {
                admin: login,
                name: roomName
            }).then(async(response)=>{
                console.log(response.data)
                setGames([...games, response.data])
                properties.client.publish('/games', response.data.name)
                navigate('/games/' + response.data.id)
            }).catch((e)=>{
                if (e.response){
                    console.log(e.response.data)
                }
            });
        }
    }

    function onChangeMessage(e){
        setMessage(e.target.value)
        if (e.keyCode === 13)
            Send()
    }

    function Send(){
        if(message.trim().length > 0){
            properties.client.publish('/main-chat', `${login}: ${message}`)
            setChat([...chat, `${login}: ${message}`])
            setMessage('')
        }
    }

    function Search(){
        axios.get(`http://localhost:5000/games/?search=${search}`)
            .then(async(response)=>{
                setGames(response.data)
            }).catch((e)=>{
                if (e.response){
                    console.log(e.response.data)
                }
            })
    }
    
    return(
        <div className="games-page">
            <h1>WIRUS</h1>

            <div className="user-menu">
                {login !== '' && 
                    <h3> Logged as: 
                        <Link to={`/users/${login}`} style={{ color: 'inherit', textDecoration: 'inherit'}}><div>{login}</div></Link>
                    </h3>}
                {login !== '' && <button onClick={logOut}> Log Out </button>}

                {login === '' && <Link to="/login"><button> Log In </button></Link>}

                {login !== '' &&
                <div>
                    <button onClick={CreateRoom}> Create room </button>
                </div>
                }
                {invites.length > 0 && <div className='invitesSection'>
                    <h3>Invites:</h3>
                    <div className='invites'>
                        {invites.map((invite)=>{
                            return(
                                <div key={invite.id} className='invite'>
                                    <Link to={`/games/${invite.id}`} style={{ color: 'inherit', textDecoration: 'inherit'}}>{invite.name}</Link>
                                </div>
                            )
                        })}
                    </div>
                </div>}
            </div>

            <div className="chat">
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

            <div className="users-list">
                {users.length === 0 && <h3> No users online </h3>}

                {users.length > 0 &&
                    <div>
                        <h3>Online users:</h3>
                        <div>
                            {users.map(user => {
                                return (<Link key={user.login} style={{ color: 'inherit', textDecoration: 'inherit'}} to={`/users/${user.login}`}>
                                    <div>{user.login}</div>
                                </Link>)
                            })}
                        </div>
                    </div>
                }
            </div>

            <div className="rooms-list">
                <div className='search'>
                    <input type="text" value={search} onChange={(e)=>{setSearch(e.target.value)}} onKeyUp={(e)=>{if (e.keyCode === 13) Search()}} />
                    <button onClick={Search}> Search </button>
                </div>

                {games.length === 0 && <h3> No rooms available </h3>}

                {games.length > 0 &&
                    <div>
                        <h2>Available rooms:</h2>
                        {games.map(game => {
                            if ( game.status === "public") {
                                return (
                                <Link key={game.id} style={{ color: 'inherit', textDecoration: 'inherit'}} to={`/games/${game.id}`}>
                                    <div className="room">
                                        <h3>{game.name}</h3>
                                        <div>{game.players.length} / {game.maxPlayers}</div>
                                        { game.gameStarted && <h4>(started)</h4>}
                                    </div>
                                </Link>)
                            } else if (game.status === "private") {
                                return(
                                    <div className="unavailable room" key={game.id}>
                                        <h3>{game.name}</h3>
                                        <div>{game.players.length} / {game.maxPlayers}</div>
                                    </div>)
                            } else {
                                return null
                            }
                        })}
                    </div>
                }
            </div>

        </div>
    )

}


export default GamesPage;