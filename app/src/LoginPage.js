import axios from 'axios'
import {useState} from 'react'
import {Link, useNavigate} from 'react-router-dom'
import properties from './mqttClient'

function LoginPage({setMainLogin}){
    const navigate = useNavigate()
    const [login, setLogin] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    function onChangeLogin(event){
        setLogin(event.target.value)
    }

    function onChangePassword(event){
        setPassword(event.target.value)
    }

    function logIn (){
        axios.post('http://localhost:5000/login', {
            login: login,
            password: password
        }, { withCredentials: true})
        .then(async(response)=>{
            console.log(response.data)
            setMainLogin(response.data.login)
            properties.client.subscribe(`/messages/${response.data.login}/+`)
            properties.client.subscribe(`/messages/+/${response.data.login}`)
            properties.client.publish('/login', response.data.login)
            navigate('/games')
        }, (e)=>{
            if (e.response && e.response.status === 401){
                setError('Wrong login or password')
            } else {
                console.log(e)
            }
        });
    }

    function Guest(){
        axios.post('http://localhost:5000/guest',{}, { withCredentials: true})
        .then(async(response)=>{
            console.log(response.data)
            setMainLogin(response.data.login)
            properties.client.subscribe(`/messages/${response.data.login}/+`)
            properties.client.subscribe(`/messages/+/${response.data.login}`)
            properties.client.subscribe(`/invites/${response.data.login}`)
            properties.client.publish('/guest', response.data.login)
            navigate('/games')
        }).catch((e)=>{
            alert('Wystąpił błąd')
            console.log(e)
        });
    }

    return(
        <div className="login-page">
            <form>
                
                <label> Login: </label>
                <input type="text" id="login" onChange={onChangeLogin}></input>
            
                <label> Password: </label>
                <input type="password" id="password" onChange={onChangePassword}></input>
            
            </form> 

            {error && <div className="error">{error}</div>}

            <div>
                <button onClick={ logIn }> Login </button>
            </div>

            <div>
                <button onClick={ Guest }> Login as guest </button>
            </div>
            <Link to={`/register`}>
                <div>
                    <button onClick={() => {} }> Register </button>
                </div>
            </Link>

            <Link to={`/`}>
                <div>
                    <button onClick={() => {} }> Cancel </button>
                </div>
            </Link>

        </div>
    )
}

export default LoginPage;