import request from 'superagent';
let user_id;
let targetPlaylistObject = {};
let discoverWeeklySongs = {"uris": []};

//////////////////////////////////////////////
///////////////////utils//////////////////////
//////////////////////////////////////////////

const createPlaylist = (token, name, userId) => {
  request.get('https://api.spotify.com/v1/me')
    .set('Authorization', `Bearer ${token}`)
    .then(res=>{
      request.post(`https://api.spotify.com/v1/users/${userId}/playlists?limit=50`)
        .set('Authorization', `Bearer ${token}`)
        .send(JSON.stringify({name}))
    })
    .catch(e=>console.error(e));
}

const addSongsToPlaylist = (token, songArray, playlistId, userId) => {
  return request.post(`https://api.spotify.com/v1/users/${userId}/playlists/${playlistId}/tracks`)
    .set('Authorization', `Bearer ${token}`)
    .send(songArray)
    .catch(e=>console.error(e));
}

const getTracksFromPlaylist = (token, playlistId, handler) => {
  return request.get(`https://api.spotify.com/v1/users/spotify/playlists/${playlistId}/tracks`)
    .set('Authorization', `Bearer ${token}`)
    .then(res=>{
      res.body.items.forEach(item => {
        discoverWeeklySongs.uris.push(item.track.uri);
      });
    })
    .catch(e=>console.error(e));
}

// const getPlaylists = (token, handler) => {
//   request.get('https://api.spotify.com/v1/me/playlists')
//     .set('Authorization', `Bearer ${token}`)
//     .then(res=>{
//       handler(res.body.items[0].name)
//     })
//     .catch(e=>console.error(e))
// }

const setUserId = (token) => {
  return request.get('https://api.spotify.com/v1/me')
    .set('Authorization', `Bearer ${token}`)
    .then((res)=>{
      user_id = res.body.id;
    })
    .catch(e=>console.error(e));
}

//////////////////////////////////////////////
//////////////////////////////////////////////
//////////////////////////////////////////////

const findTargetPlaylists = (token) => {
  return request.get('https://api.spotify.com/v1/me/playlists')
    .set('Authorization', `Bearer ${token}`)
    .then(playlistsString=>{
      let playlists = playlistsString.body.items;

      // find Discover Weekly
      playlists.forEach(playlist=> {
        if(playlist.name === "Discover Weekly"){
          targetPlaylistObject['discoverWeeklyId'] = playlist.id;
        } else if(playlist.name === "Discover Weekly Drop"){
          targetPlaylistObject['discoverWeeklyDropId'] = playlist.id;
        }
      });
    })
    .catch(e=>console.error(e))
}

const createDWDrop = (token) => {
  return findTargetPlaylists(token)
    .then(playlistIdObject=>{
      // if they dont have DW Drop, create it
      if(typeof targetPlaylistObject.discoverWeeklyDropId === 'undefined'){
        createPlaylist(token, 'Discover Weekly Drop', user_id);
      }
    })
    .catch(e=>console.error(e))
}

const masterDWRun = (token) => {
  createDWDrop(token)
    .then(()=> {
      // takes DW tracks and adds to discoverWeeklySongs
      return getTracksFromPlaylist(token, targetPlaylistObject['discoverWeeklyId']);
    })
    .then(()=>{
      // adds from discoverWeeklySongs to DW drop
      return addSongsToPlaylist(token, discoverWeeklySongs, targetPlaylistObject.discoverWeeklyDropId, user_id)
    })
    .catch(e=>console.error(e));
}

const runProgram = (token) => {
  setUserId(token)
    .then(()=>{
      masterDWRun(token)
    })
    .catch(e=>console.error(e));
}

export const apiFunctions = {
  createDWDrop,
  setUserId,
  runProgram,
}
