import { API_URL } from '../constants';
import sendRequest from '../ApiService';
import { useState, useRef, useEffect } from 'react';
import '../App.css';
import './ALert';
// import Alert from './ALert';

function Login(setLoggedIn) {
    // const [isAlertOpen, setAlertOpen] = useState(false);
    // const openAlert = () => {    setAlertOpen(true); };
    // const closeAlert = () => {   setAlertOpen(false);  };
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // const [token, setToken] = useState('');
    const handleLogin = async (e) => {
        document.getElementById("login-btn").innerHTML="Logging In...";
        document.getElementById("login-btn").style.backgroundColor="#555";
        document.getElementById("login-btn").disabled=true;
        e.preventDefault();
        try {
            const res = await sendRequest({
              url: `${API_URL}/login`, // Change to your API endpoint
              method: 'POST',
              body: { username, password }, // Include the login data in the body
            });
            // setToken(res.data.token);
            // setLoggedIn(true);
            if(res.token){
                localStorage.setItem('token',res.token);
                document.location.reload();
            }else {
                alert(JSON.parse(res).message);
                
                document.getElementById("login-btn").innerHTML="Login";
                document.getElementById("login-btn").style.backgroundColor="#4CAF50";
                document.getElementById("login-btn").disabled=false;
            }
            
        } catch (err) {
            console.error(err);
            alert('Login failed');
            
            document.getElementById("login-btn").innerHTML="Login";
            document.getElementById("login-btn").style.backgroundColor="#4CAF50";
            document.getElementById("login-btn").disabled=false;
        }
    };

    return (
        <>
           <div className="container v-100">
    <header className="App-header"></header>
    <div className="body-bar">
        <div className="card mx-auto mt-5 shadow-sm" style={{ maxWidth: '22rem' }}>
            <div className="card-body">
                <div className="text-center">
                    <h2 className="text-dark">Login</h2>
                    <form className="mx-auto mt-4" onSubmit={ handleLogin }>
                        <div className="row g-3">
                            <div className="col-12">
                                <div className="mb-3">
                                    <input type="text" className="form-control" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} autoFocus/>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="mb-3">
                                    <input type="password" className="form-control" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} />
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="mb-3">
                                    <button type="submit" className="create-chat-btn" id="login-btn" onClick={handleLogin}>Login</button>
                                </div>
                            </div>
                            <div className="col-12">
                                <div className="mb-3">
                                    {/* <button className="btn btn-secondary" onClick={handleRegister}>Register</button> */}
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>
</div>
{/* <Alert title={"Error"} isOpen={ isAlertOpen } onClose={ closeAlert }><p><br></br>Login Failed!</p></Alert> */}
        </>
    )
}

export default Login;