/**
 * This is an example of a basic node.js script that performs
 * the Authorization Code oAuth2 flow to authenticate against
 * the Spotify Accounts.
 *
 * For more information, read
 * https://developer.spotify.com/web-api/authorization-guide/#authorization_code_flow
 */

const express = require('express'); // Express web server framework
const request = require('request-promise'); // "Request" library
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const $ = require('jquery');
// const Promise = require('bluebird');

let client_id = '9f8d803e2d394afe80e3415ba058e404'; // Your client id
let client_secret = '647a5ef49c624217acbab1368e34740f'; // Your secret
let redirect_uri = 'http://localhost:8888/callback'; // Your redirect uri
let user_id;
let targetPlaylistId;
let authOptions;
let initialPromise;
let dumpId;
let dwID;
let playlistArray;
let targetPlaylistHash = {};
let refresh_token;
let access_token;

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
let generateRandomString = function(length) {
  let text = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

let stateKey = 'spotify_auth_state';

let app = express();

app.use(express.static(__dirname + '/public'))
   .use(cookieParser())
   .use(bodyParser());

app.get('/login', function(req, res) {
  // console.log('you logged in great job')

  let state = generateRandomString(16);
  res.cookie(stateKey, state);

  // your application requests authorization
  let scope = 'playlist-modify-private playlist-modify-public';
  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
      state: state
    }));
});

app.get('/getMyPlaylists', (req, res)=>{
  
  console.log('hello')
  let authOptions = {
    url: `https://api.spotify.com/v1/me/playlists`,
    headers: {
      'Authorization': 'Bearer ' + theToken,
      'Content-Type': 'application/json'
    }
  };

  let thePromise = Promise.resolve(request.get(authOptions));

  thePromise.then(playlistsString=>{
    console.log('inside get playlist promise');
    let playlists = JSON.parse(playlistsString).items;

    res.redirect('/#' +
      querystring.stringify({
        access_token: access_token,
        refresh_token: refresh_token,
        playlists: playlists
      })
    );

    // console.log('playlistArray: ');
  }).catch(e=>{console.error(e)});
});

app.get('/getDiscoverWeekly', (req, res)=>{

  // gets users playlists
  let authOptions = {
    url: `https://api.spotify.com/v1/me/playlists`,
    headers: {
      'Authorization': 'Bearer ' + theToken,
      'Content-Type': 'application/json'
    }
  };

  let thePromise = Promise.resolve(request.get(authOptions));

  thePromise.then(playlistsString=>{
    let playlists = JSON.parse(playlistsString).items;
    playlistArray = playlists.slice(0);

    console.log('playlistArray: ', playlistArray);

    // find Discover Weekly
    playlists.forEach(playlist=> {
      if(playlist.name === "Discover Weekly"){
        dwID = playlist.id;
      } else if(playlist.name === "DW Dump 400"){
        targetPlaylistId = playlist.id;
      }
    });
  }).then(()=>{
    // get user's DW Dump tracks
    let plAuth = {
        url: `https://api.spotify.com/v1/users/${user_id}/playlists/${targetPlaylistId}/tracks`,
        headers: {
          'Authorization': 'Bearer ' + theToken,
          'Content-Type': 'application/json'
        }
    };
    console.log('getting DW Dump tracks');

    return request.get(plAuth, (error, response, body)=>{});
  }).then(body=>{

    // make playlist hash to avoid duplicates
    JSON.parse(body).items.map(song=>{
      targetPlaylistHash[song.track.uri] = true;
    });

    // gets tracks of Discover Weekly
    let plAuth = {
        url: `https://api.spotify.com/v1/users/spotify/playlists/${dwID}/tracks`,
        headers: {
          'Authorization': 'Bearer ' + theToken,
          'Content-Type': 'application/json'
        }
    };

    console.log('getting DW ');

    return request.get(plAuth, (error, response, body)=>{});
  }).then(body=>{

    console.log('targetPlaylistHash', targetPlaylistHash);
    console.log('uriArray0: ', JSON.parse(body).items[0].track.uri);

    // create array of Discover Weekly song URIs
    let uriArray = [];

    JSON.parse(body).items.forEach(song=>{
      // if the song is not in DW Dump already...
      if(!targetPlaylistHash[song.track.uri]) {
        console.log('song.track.uri: ', song.track.uri);
        uriArray.push(song.track.uri);
      }
    });
    console.log('uriArray: ', uriArray);

    let auth = {
        url: `https://api.spotify.com/v1/users/${user_id}/playlists/${targetPlaylistId}/tracks`,
        headers: {
          'Authorization': 'Bearer ' + theToken,
          'Content-Type': 'application/json'
        },
        dataType: 'json',
        body: JSON.stringify({
          uris: uriArray
        }),
        success: (response)=>{
          console.log('success!', response);
        }
    };

    return request.post(auth, (error, response, body)=>{
      console.log('addTracks error: ', error);
      console.log('addTracks body: ', body);
    });

  })
  .catch(e=>console.log(e));
});

app.post('/createPlaylist', (req, res)=>{

  let authOptions = {
    url: 'https://api.spotify.com/v1/users/' + user_id + '/playlists?limit=50',
    body: JSON.stringify({
      'name': 'DW Dump 400'
    }),
    dataType: 'json',
    headers: {
      'Authorization': 'Bearer ' + theToken,
      'Content-Type': 'application/json'
    },
    success: (response)=>{
      console.log('success! ', response);
    }
  };

  request.post(authOptions, (error, response, body)=>{
    // if(error)console.log('error on createPlaylist post: ', error);
    // console.log('response createPlaylist: ', typeof response.body);
  });
});

let theToken;

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  let code = req.query.code || null;
  let state = req.query.state || null;
  let storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    let authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        access_token = body.access_token,
        refresh_token = body.refresh_token;
        theToken = body.access_token;

        let options = {
          url: 'https://api.spotify.com/v1/me',
          headers: { 'Authorization': 'Bearer ' + access_token },
          json: true
        };

        // use the access token to access the Spotify Web API
        request.get(options, function(error, response, body) {
          console.log(body);
          user_id = body.id;
        }).then(()=>{
          let authOptions1 = {
            url: `https://api.spotify.com/v1/me/playlists`,
            headers: {
              'Authorization': 'Bearer ' + theToken,
              'Content-Type': 'application/json'
            }
          };

          console.log('before the promise');

          let thePromise = Promise.resolve(request.get(authOptions1));

          thePromise.then(playlistsString=>{
            let playlists = JSON.parse(playlistsString).items;
            playlistArray = playlists.slice(0);

            // find Discover Weekly
            playlists.forEach(playlist=> {
              if(playlist.name === "Discover Weekly"){
                dwID = playlist.id;
              } else if(playlist.name === "DW Dump 400"){
                targetPlaylistId = playlist.id;
              }
            });
          });

          // we can also pass the token to the browser to make requests from there
          res.redirect('http://localhost:3000/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token,
            }));
        })

        console.log('body outside get: ', body);

      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/delete_duplicates', (req, res)=>{
  // gets the id of a playlist, deletes all of the duplicates inside of one

  // let playlistID = req.body.playlistID;

  // for now, use targetPlaylistId

  // get user's playlists
  let authOptions = {
    url: `https://api.spotify.com/v1/me/playlists`,
    headers: {
      'Authorization': 'Bearer ' + theToken,
      'Content-Type': 'application/json'
    }
  };

  let thePromise = Promise.resolve(request.get(authOptions));

  thePromise.then(playlistsString=>{
    let playlists = JSON.parse(playlistsString).items;
    let dwID;

    console.log('findings');
    // find Discover Weekly
    playlists.forEach(playlist=> {
      if(playlist.name === "DW Dump 400"){
        console.log('found playlist');
        targetPlaylistId = playlist.id;
      }
    });

    // get targetPlaylist tracks
    let plAuth = {
        url: `https://api.spotify.com/v1/users/spotify/playlists/${targetPlaylistId}/tracks`,
        headers: {
          'Authorization': 'Bearer ' + theToken,
          'Content-Type': 'application/json'
        }
    };

    return request.get(plAuth, (error, response, body)=>{});
  }).then(body=>{
    let duplicatePlaylistHash = {};
    let songArray = JSON.parse(body).items;
    let songsToDelete = [];

    songArray.forEach(song=>{
      if(duplicatePlaylistHash[song.track.uri]){
        // basically, delete that song
        // songsToDelete.push(song.track.uri);
        // ^^ can't do that, would probably delete all instances of the song
        // want to just delete the later instances
      } else {
        duplicatePlaylistHash[song.track.uri] = true;
      }
    });
  });
});

app.get('/add_recommended_songs', (req, res)=>{
  // adds all of the recommended songs to a playlist
});

app.get('/compare_playlists', (req, res)=>{
  // let's compare andie's discotheque and flim flam
  // because i'm petty
  // how much of andie's discotheque are songs that I added to flim flam?
})

app.get('/refresh_token', function(req, res) {

  // requesting access token from refresh token
  let refresh_token = req.query.refresh_token;
  let authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      let access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 8888');
app.listen(8888);
