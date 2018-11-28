import React, { Component } from 'react';
import './App.css';
import firebase from './firebase';
import { apiFunctions } from './api.js'
import SpotifyWebApi from 'spotify-web-api-js';
const spotifyApi = new SpotifyWebApi();

const firestore = firebase.firestore();
const settings = {timestampsInSnapshots: true};
firestore.settings(settings);

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
      is_active: false,
      is_checked: false,
    }

    this.getUser();
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

  getUser(/*userName*/){
    let userData;
    let userName = 'gary1'

    var docRef = firestore.collection('users').doc(userName);

    docRef.get().then(doc=>{
      if(doc.exists){
        console.log('doc exists: ', doc.data());
        this.setState({userProgramStatus: doc.data().status})
      } else {
        docRef.set({is_active: 'inactive'})
        this.setState({userProgramStatus: 'inactive'})
      }
      console.log('pye', doc);
    })

    spotifyApi.getMe()
    .then((response) => {
      this.setState({username: response.display_name})
    })
  }

  toggleProgram(event){
    let newValue = (this.state.is_checked === "on" || this.state.is_checked === true) ? false : true;
    this.setState({
      is_checked: newValue
    });
  }

  render() {
    return (
      <div className="App">
        <h1>Discover Weekly Drop</h1>
        <a href='http://localhost:8888/login'> Login to Spotify </a>
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
              <input type="checkbox" checked={this.state.is_checked} onChange={this.toggleProgram.bind(this)}/>
              <span className="slider round"></span>
            </label>
          </div>
        }
      </div>
    );
  }
}

export default App;
