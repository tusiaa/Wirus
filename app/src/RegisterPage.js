import axios from 'axios'
import {useState} from 'react'
import {useNavigate} from 'react-router-dom'


function RegisterPage(){
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

    function Register (){
        if(login.length > 0 && password.length > 0){
            axios.post('http://localhost:5000/register', {
                login: login,
                password: password
            }).then(async (response)=>{
                console.log(response.data)
                alert('Zarejestrowano jako ' + response.data.login)
                navigate('/login')
            }, (e)=>{
                if (e.response && e.response.status === 401){
                    setError('Login is already taken')
                } else {
                    console.log(e)
                }
            });
        }
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
                <button onClick={ Register }> Register </button>
            </div>
            <div>
                <button onClick={ () => {navigate('/login')} }> Cancel </button>
            </div>

        </div>
    )
}

export default RegisterPage;