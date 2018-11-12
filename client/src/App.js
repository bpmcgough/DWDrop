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

    this.handlePlaylistGet = this.handlePlaylistGet.bind(this);

    this.state = {
      loggedIn: token ? true : false,
      nowPlaying: { name: 'Not Checked', albumArt: ''},
      playlistName: 'placeholder name',
      token: token,
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

  getNowPlaying(){
    spotifyApi.getMyCurrentPlaybackState()
      .then((response) => {
        this.setState({
          nowPlaying: {
              name: response.item.name,
              albumArt: response.item.album.images[0].url
            }
        });
      })
  }

  handlePlaylistGet(playlist){
    this.setState({playlistName: playlist});
  }

  render() {
    return (
      <div className="App">
          <a href='http://localhost:8888'> Login to Spotify </a>
        { this.state.loggedIn &&
          <button onClick={() => apiFunctions.login(this.state.token)}>
            Login to that shit mf
          </button>
        }
      </div>
    );
  }
}

export default App;
