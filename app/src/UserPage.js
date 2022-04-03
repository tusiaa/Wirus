import axios from 'axios'
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import bcrypt from 'bcryptjs'
import Cookies from 'js-cookie';
import properties from './mqttClient'

function UserPage({userLogin, setMainLogin}) {
    const navigate = useNavigate()
    const { login } = useParams()
    const [user, setUser] = useState({})
    const [edit, setEdit] = useState(false)
    const [editNewPassword, setEditNewPassword] = useState('')
    const [editOldPassword, setEditOldPassword] = useState('')
    const [editLogin, setEditLogin] = useState('')
    const [wrongPassword, setWrongPassword] = useState(false)
    const [deleteUser, setDeleteUser] = useState(false)
    const [sendMessage, setSendMessage] = useState(false)
    const [message, setMessage] = useState('')
    const [messages, setMessages] = useState([])

    useEffect(() => {
        if (userLogin){
            properties.client.subscribe(`/messages/${userLogin}/+`)
            properties.client.subscribe(`/messages/+/${userLogin}`)
            properties.client.subscribe(`/invites/${userLogin}`)
        }
        axios.get(`http://localhost:5000/${login}`)
            .then(async (response) => {
                setUser(response.data)
            }).catch((e) => {
                if (e.response && e.response.status === 401) {
                    setUser(undefined)
                } else if (e.response){
                    console.log(e.response.data)
                }
            });
        setMessages(properties.messages)
        return () => {
            setUser({})
        }
    }, [login]);

    function Reload() {
        if (properties.usersReload) {
            axios.get(`http://localhost:5000/${login}`)
                .then(async (response) => {
                    setUser(response.data)
                }).catch((e) => {
                    if (e.response && e.response.status === 401) {
                        setUser(undefined)
                    } else if (e.response){
                        console.log(e.response.data)
                    }
                }).finally(() => {
                    properties.usersReload = false
                });
        }
        if (properties.messagesReload){
            setMessages(properties.messages)
            properties.messagesReload = false
        }
    }
    setInterval(Reload, 1000);

    function Save(){
        if(bcrypt.compareSync(editOldPassword, user.password)){
            axios.put(`http://localhost:5000/${login}`, {
                login: editLogin,
                password: editNewPassword
            }).then(async (response) => {
                properties.client.publish('/login', 'edit')
                setMainLogin(response.data.login)
                Cancel()
                Cookies.set('login', response.data.login)
                navigate(`/users/${response.data.login}`)
            }).catch((e) => {
                if (e.response){
                    console.log(e.response.data)
                }
            });
        } else {
            setWrongPassword(true)
        }
    }

    function Delete(){
        if (bcrypt.compareSync(editOldPassword, user.password)) {
            axios.delete(`http://localhost:5000/${login}`)
                .then(async (response) => {
                    properties.client.publish('/login', 'edit')
                    setMainLogin('')
                    Cancel()
                    Cookies.remove('login')
                    navigate('/')
                }).catch((e) => {
                    if (e.response){
                        console.log(e.response.data)
                    }
                });
        }
        else {
            setWrongPassword(true)
        }
    }

    function Send(){
        if(message.trim().length > 0){
            properties.client.publish(`/messages/${login}/${userLogin}`, JSON.stringify({from: userLogin, to:login, message: message, at: new Date()}))
            setMessage('')
            Cancel()
        }
    }

    function Cancel(){
        setEditNewPassword('')
        setEditOldPassword('')
        setEditLogin('')
        setEdit(false)
        setWrongPassword(false)
        setDeleteUser(false)
        setSendMessage(false)
        setMessage('')
    }

    return (
        <>
            {!user && <h1>User not found</h1>}
            {user && <div className='userPage'>
                <h1>{user.login} PAGE</h1>
                <div className='info'>
                    <h3>
                        {user.login}
                        {user.loggedIn && <div className='online'>(online)</div>}
                    </h3>
                    {edit && <form>
                        {wrongPassword && <div className='wrongPassword'>Wrong password</div>}

                        <label> New login: </label>
                        <input type="text" id="login" onChange={(e) => setEditLogin(e.target.value)}></input>
                    
                        <label> New password: </label>
                        <input type="password" id="newpassword" onChange={(e) => setEditNewPassword(e.target.value)}></input>

                        <label> Old password: </label>
                        <input type="password" id="oldpassword" onChange={(e) => setEditOldPassword(e.target.value)}></input>

                        <button type='button' onClick={Save}> Save </button>
                        <button type='button' onClick={Cancel}> Cancel </button>
                    </form> }
                    {deleteUser && <form>
                        {wrongPassword && <div className='wrongPassword'>Wrong password</div>}
                        <label> Password: </label>
                        <input type="password" id="password" onChange={(e) => setEditOldPassword(e.target.value)}></input>

                        <button type='button' onClick={Delete}> Delete </button>
                        <button type='button' onClick={Cancel}> Cancel </button>
                    </form> }
                    {sendMessage && <form>
                        <label> Message: </label>
                        <textarea id="message" onChange={(e) => setMessage(e.target.value)}></textarea>

                        <button type='button' onClick={Send}> Send </button>
                        <button type='button' onClick={Cancel}> Cancel </button>
                    </form> }
                    {user.login === userLogin && user.login && !(user.login.startsWith('guest-')) && !edit && <button onClick={() => setEdit(true)}>Edit profile</button>}
                    {user.login === userLogin && user.login && !(user.login.startsWith('guest-')) && !deleteUser && <button onClick={() => setDeleteUser(true)}>Delete profile</button>}
                    {!(user.login === userLogin) && userLogin && user.loggedIn && !sendMessage && <button onClick={() => setSendMessage(true)}> Send message </button>}
                    <button onClick={() => navigate('/')}> Go back </button>
                </div>
                {userLogin && messages.length > 0 && <div className='messagesSection'>
                    <h2>Messages</h2>
                    <div className='messages'>
                        {messages.map((message, index) => {
                            if (message.from === login || message.to === login) {
                                return (<div key={index} className='message'>
                                    <div className='from'>From: 
                                        <Link to={`/users/${message.from}`} style={{ color: 'inherit', textDecoration: 'inherit'}}>{message.from}</Link>
                                    </div>
                                    <div className='to'>To: 
                                        <Link to={`/users/${message.to}`} style={{ color: 'inherit', textDecoration: 'inherit'}}>{message.to}</Link>
                                    </div>
                                    <div className='at'>At: {new Date(message.at).getHours()}:{new Date(message.at).getMinutes()}</div>
                                    <div className='messageText'>{message.message}</div>
                                </div>)
                            }
                            return null
                        })}
                    </div>
                </div>}
            </div>}
        </>
    )
}

export default UserPage;