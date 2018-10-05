import request from 'superagent';

const getPlaylists = (token, handler) => {
  console.log('hey i')
  request.get('https://api.spotify.com/v1/me/playlists')
    .set('Authorization', `Bearer ${token}`)
    .then(res=>{
      handler(res.body.items[0].name)
    }).catch(e=>console.error(e))
}

const findTargetPlaylists = (token) => {
  let discoverWeeklyId;
  let discoverWeeklyDropId;
  console.log('sup fam', token)
  
  return request.get('https://api.spotify.com/v1/me/playlists')
    .set('Authorization', `Bearer ${token}`)
    .then(playlistsString=>{
      let playlists = playlistsString.body.items;
      let playlistArray = playlists.slice(0);

      // find Discover Weekly
      playlists.forEach(playlist=> {
        if(playlist.name === "Discover Weekly"){
          discoverWeeklyId = playlist.id;
        } else if(playlist.name === "Discover Weekly Drop1"){
          discoverWeeklyDropId = playlist.id;
        }
      });
      return {discoverWeeklyId, discoverWeeklyDropId}
    })
}

const getTracksFromPlaylist = (token, playlistId, handler) => {
  request.get(`https://api.spotify.com/v1/users/spotify/playlists/${playlistId}/tracks`)
    .set('Authorization', `Bearer ${token}`)
    .then(res=>{
      handler(JSON.parse(res.body).items)
    })
    .catch(e=>console.error(e))
}

const createPlaylist = (token) => {
  request.get('https://api.spotify.com/v1/me')
    .set('Authorization', `Bearer ${token}`)
    .then(res=>{
      request.post(`https://api.spotify.com/v1/users/${res.body.id}/playlists?limit=50`)
        .set('Authorization', `Bearer ${token}`)
        .send(JSON.stringify({name: 'Discover Weekly Drop'}))
        .then(res=>{
          console.log('success:', res.body)
          // handler(JSON.parse(res.body).items)
        })
    }).catch(e=>console.error(e))
}

const createDWDrop = (token) => {
  findTargetPlaylists(token)
    .then(playlistIdObject=>{
      // if they dont have DW Drop, create it
      if(typeof playlistIdObject.discoverWeeklyDropId === 'undefined'){
        createPlaylist(token);
      }
    })
    .catch(e=>console.error(e))
}

// check if DW drop exists
  // if it doesn't, create 
  // if it does exist, move on 
// get target playlist ids
// get target playlist songs 
// create array of songs from DW
// compare DW song array against DW Drop, removing songs in DW array that are already in DW Drop
// add songs to DW drop

export const apiFunctions = {
  createDWDrop
}
