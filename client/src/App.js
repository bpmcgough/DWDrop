import React, { Component } from 'react';
import './App.css';
import { apiFunctions } from './api.js'
import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();

class App extends Component {
  constructor(){
    super();
    const params = this.getHashParams();
    const token = params.access_token;
    if (token) {
      spotifyApi.setAccessToken(token);
    }

    this.state = {
      loggedIn: token ? true : false,
      username: '',
      token: token,
      userProgramStatus: 'ON',
    }
  }

  getHashParams() {
    var hashParams = {};
    var e, r = /([^&;=]+)=?([^&;]*)/g,
        q = window.location.hash.substring(1);
    e = r.exec(q)
    while (e) {
       hashParams[e[1]] = decodeURIComponent(e[2]);
       e = r.exec(q);
    }
    return hashParams;
  }

  getUser(){
    spotifyApi.getMe()
    .then((response) => {
      this.setState({username: response.display_name})
    })
  }

  toggleProgram(){
    this.setState({userProgramStatus: !this.state.userProgramStatus})
  }

  render() {
    this.getUser();

    return (
      <div className="App">
        <h1>Discover Weekly Drop</h1>
        {!this.state.loggedIn &&
          <a href='http://localhost:8888/login'> Login to Spotify </a>
        }
        { this.state.loggedIn &&
          <div>
            <h3>Hi {this.state.username}</h3>
            <button onClick={() => apiFunctions.runProgram(this.state.token)}>
              Run Program
            </button>
            <br/>
            Program is {this.state.userProgramStatus}
            <br/>
            <label className="switch">
              <input type="checkbox"/>
              <span className="slider round"></span>
            </label>
          </div>
        }
      </div>
    );
  }
}

export default App;
