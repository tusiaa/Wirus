import './App.css';
import { useState, useEffect } from 'react';
import {BrowserRouter as Router, Route, Routes} from "react-router-dom";
import Cookies from 'js-cookie';
import LoginPage from './LoginPage';
import RegisterPage from './RegisterPage';
import GamesPage from './GamesPage';
import GamePage from './GamePage';
import UserPage from './UserPage';

function App() {
  const [login, setLogin] = useState('')

  useEffect(() => {
    const cookie = Cookies.get('login')
    if(cookie){
      setLogin(cookie)
    }
  }, []) 

  return (
    <div className="App">
      <Router>
        <Routes>

          <Route exact path="/" element={<GamesPage login={login} setMainLogin={setLogin} />} />

          <Route exact path ="/login" element={<LoginPage setMainLogin={setLogin} />} />

          <Route exact path="/register" element={<RegisterPage />} />

          <Route exact path="/games" element={<GamesPage login={login} setMainLogin={setLogin} />} />

          <Route exact path="/games/:id" element={<GamePage login={login} />} />

          <Route exact path="/users/:login" element={<UserPage userLogin={login} setMainLogin={setLogin} />} />

        </Routes>
      </Router>
    </div>
  );
}

export default App;
