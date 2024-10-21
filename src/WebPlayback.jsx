import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const track = {
    name: "",
    album: {
        images: [
            { url: "" }
        ]
    },
    artists: [
        { name: "" }
    ]
}

function WebPlayback(props) {
    const [is_paused, setPaused] = useState(false);
    const [is_active, setActive] = useState(false);
    const [player, setPlayer] = useState(undefined);
    const [current_track, setTrack] = useState(track);
    const [startedPlaying, setStartedPlaying] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [firstRun, setFirstRun] = useState(true);
    const [userId, setUserId] = useState('');
    const [storedSong, setStoredSong] = useState('');

    const navigate = useNavigate();

    const createUser = async(user_id, email) => {
        console.log('creating user ', user_id, email)
        var response = await fetch(`/api/user?user_id=${user_id}`);
        if(response.status == 404) {
            // User doesn't exist in table, we need to create it
            await fetch(`/api/createUser?user_id=${user_id}&email=${email}`);
            setUserId(user_id);
        } else {
            const json = await response.json();
            console.log(json);
            if(json.last_song_uri) {
                setStoredSong(json.last_song_uri);
            }
            setUserId(json.user_id);
        }
    }

    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        console.log(props.token)

        fetch('https://api.spotify.com/v1/me', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${props.token}`
            }
        }).then(response => response.json())
        .then(data => {
            createUser(data.id, data.email);
        })
        .catch(error => {
            console.error('Error fetching user info:', error);
        });

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new window.Spotify.Player({
                name: 'Web Playback SDK',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

            setPlayer(player);

            // Transfer playback to this device
            // const transferPlaybackToDevice = (device_id) => {
            //     fetch('https://api.spotify.com/v1/me/player', {
            //         method: 'PUT',
            //         headers: {
            //             'Content-Type': 'application/json',
            //             'Authorization': `Bearer ${props.token}`
            //         },
            //         body: JSON.stringify({
            //             device_ids: [device_id],
            //             play: true
            //         })
            //     }).then(response => {
            //         if (!response.ok) {
            //             console.error('Failed to transfer playback', response.statusText);
            //         }
            //     });
            // };

            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
                setDeviceId(device_id)
                // transferPlaybackToDevice(device_id);
            });

            player.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            player.addListener('player_state_changed', ( state => {
                if (!state) {
                    return;
                }
                setTrack(state.track_window.current_track);
                setPaused(state.paused);

                // if(!state.paused) {
                    // setStartedPlaying(true);
                // }

                player.getCurrentState().then( state => {
                    (!state)? setActive(false) : setActive(true)
                });

            }));

            player.connect().then(() => {
                console.log('connected')
            });
        };
    }, []);

    const getTotalSongs = async () => {
        const response = await fetch('https://api.spotify.com/v1/me/tracks', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${props.token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Failed to fetch playlist: ${response.statusText}`);
        }

        const playlistData = await response.json();
        console.log(playlistData)
        const totalTracks = playlistData.total; // Get total number of tracks

        return totalTracks;
    }

    function randInt(min, max) {
        return Math.random() * (max - min) + min;
    }

    const getNthSongFromPlaylist = async (n) => {
        const offset = n - 1; // Subtract 1 for zero-based index

        try {
            const response = await fetch(`https://api.spotify.com/v1/me/tracks?offset=${offset}&limit=1`, {
                headers: {
                    'Authorization': `Bearer ${props.token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch playlist track');
            }

            const data = await response.json();
            const nthTrack = data.items[0].track; // Get the nth track
            return nthTrack;
        } catch (error) {
            console.error('Error fetching nth track:', error);
            return null;
        }
    };

    const updateUser = async(user_id, song_uri, song_title, song_artist) => {
        const response = await fetch(`/api/updateUser?user_id=${user_id}&song_uri=${song_uri}&song_title=${song_title}&song_artist=${song_artist}`);
        console.log(response);
        navigate('/completed');
    }

    const startPlaying = async () => {
        // If we have a song, don't store a new one
        console.log(storedSong)
        if (storedSong != "") {
            navigate("/completed");
            return;
        }
        // Otherwise find and store one
        const totalSongs = await getTotalSongs();
        const songNo = Math.floor(randInt(0, totalSongs));
        const song = await getNthSongFromPlaylist(songNo);

        var uri = song.uri;
        uri = uri.substr(uri.lastIndexOf(':') + 1);
        console.log(userId)
        console.log(song.name)
        console.log(song.artists[0].name)
        updateUser(userId, uri, song.name, song.artists[0].name);

        // // Start playing a track by its Spotify URI
        // fetch(`https://api.spotify.com/v1/me/player/play?device_id=${device_id}`, {
        //     method: 'PUT',
        //     body: JSON.stringify({
        //         uris: [`${song.uri}`]
        //     }),
        //     headers: {
        //         'Content-Type': 'application/json',
        //         'Authorization': `Bearer ${props.token}`
        //     }
        // }).then(response => {
        //     if (response.ok) {
        //         console.log('Track is playing');
        //     } else {
        //         console.error('Failed to play track:', response.statusText);
        //     }
        // });
    }

    useEffect(() => {
        console.log(userId)
        if (firstRun && userId != "" && userId != undefined && userId != null) {
            startPlaying();
            setFirstRun(false);
        }
    }, [userId]);

    if (!is_active) {
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">
                        <b> Connecting to Spotify... </b>
                    </div>
                </div>
            </>)
    } else if (storedSong.length === 0) {
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">

                        <img src={current_track.album.images[0].url} className="now-playing__cover" alt="" />

                        <div className="now-playing__side">
                            <div className="now-playing__name">{current_track.name}</div>
                            <div className="now-playing__artist">{current_track.artists[0].name}</div>

                            <button className="btn-spotify" onClick={() => { player.previousTrack() }} >
                                &lt;&lt;
                            </button>

                            <button className="btn-spotify" onClick={() => { player.togglePlay() }} >
                                { is_paused ? "PLAY" : "PAUSE" }
                            </button>

                            <button className="btn-spotify" onClick={() => { player.nextTrack() }} >
                                &gt;&gt;
                            </button>
                        </div>
                    </div>
                </div>
            </>
        );
    } else {
        return (
            <>
                <div className="container">
                    <div className="main-wrapper">
                        <b> Song already stored. </b>
                    </div>
                </div>
            </>)
    }
}

export default WebPlayback
