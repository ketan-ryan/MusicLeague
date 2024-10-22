const path = require('path');
const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const SpotifyStrategy = require('passport-spotify').Strategy;

const dbService = require('./services/dbService');
const tgService = require('./services/telegramService');

const port = 5000;
const baseUrl = process.env.NODE_ENV === 'production' ? 'https://music-league-dd4b5eb904d4.herokuapp.com' : `http://localhost:${port}`

global.access_token = '';
dotenv.config();

const app = express();

/** ===================Database Connection=================== */
app.get(`${baseUrl}/api/user`, async (req, res) => {
    const user_id = req.query.user_id;
    try {
        const user = await dbService.getUser(user_id);
        if (user == null) {
            res.status(500).send(user);
            return;
        } else if (user == '') {
            res.status(404).json({ message: 'User not found '});
        } else {
            res.json(user);
        }
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
        return;
    }
});

app.get(`${baseUrl}/api/createUser`, async (req, res) => {
    const user_id = req.query.user_id;
    const email = req.query.email;
    try {
        await dbService.createUser(user_id, email);
        res.status(200).json({ message: 'Table updated successfully' });
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
        return;
    }
});

app.get(`${baseUrl}/api/updateUser`, async (req, res) => {
    const userId = req.query.user_id;
    const songUri = req.query.song_uri;
    const songTitle = req.query.song_title;
    const songArtist = req.query.song_artist;

    try {
        await dbService.updateUser(userId, songUri, songTitle, songArtist);
        res.status(200).json({ message: 'User updated successfully' });
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
        return;
    }
});

app.get(`${baseUrl}/api/count`, async (req, res) => {
    try {
        const count = await dbService.getCount();
        res.json(count);
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
        return;
    }
});

/** ===================Spotify Connection=================== */

var spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
var spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
var spotify_redirect_uri = 'http://192.168.86.37:3000/auth/callback';

// Serialize user into the session
passport.serializeUser((user, done) => {
    done(null, user);
});

// Deserialize user from the session
passport.deserializeUser((obj, done) => {
    done(null, obj);
});

// Configure Passport with Spotify strategy
passport.use(new SpotifyStrategy({
    clientID: spotify_client_id,
    clientSecret: spotify_client_secret,
    callbackURL: spotify_redirect_uri,
  },
  function(accessToken, refreshToken, expires_in, profile, done) {
    // User.findOrCreate({ spotifyId: profile.id, accessToken: accessToken }, function(err, user) {
    //   return done(err, user);
    // });
    return done(null, { profile, accessToken });
  }
));

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true
    }));

app.use(passport.initialize());
app.use(passport.session());

var generateRandomString = function (length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

app.get(`${baseUrl}/auth/login`, (req, res) => {
    const state = generateRandomString(16); // Generate a random state
    req.session.state = state; // Store it in the session
    passport.authenticate('spotify', { state: state })(req, res);
});

// app.get('/auth/login', (req, res) => {
//   var scope = "streaming user-read-email user-read-private user-library-read"
//   var state = generateRandomString(16);

//   var auth_query_parameters = new URLSearchParams({
//     response_type: "code",
//     client_id: spotify_client_id,
//     scope: scope,
//     redirect_uri: spotify_redirect_uri,
//     state: state
//   });

//   res.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
// });

app.get(
    `${baseUrl}/auth/spotify`,
    passport.authenticate('spotify', {
      scope: ['streaming', 'user-read-email', 'user-read-private', 'user-library-read'],
      showDialog: true,
    }),
);

app.get(`${baseUrl}/auth/callback`,
    passport.authenticate('spotify', { failureRedirect: '/login' }),
    (req, res) => {
        // Successful authentication, redirect to your desired page
        res.redirect('/');  // Or wherever you want to redirect after login
    }
);

// app.get('/auth/callback', (req, res) => {
//   var code = req.query.code;

//   var authOptions = {
//     url: 'https://accounts.spotify.com/api/token',
//     form: {
//       code: code,
//       redirect_uri: spotify_redirect_uri,
//       grant_type: 'authorization_code'
//     },
//     headers: {
//       'Authorization': 'Basic ' + (Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64')),
//       'Content-Type' : 'application/x-www-form-urlencoded'
//     },
//     json: true
//   };

//   request.post(authOptions, function(error, response, body) {
//     if (!error && response.statusCode === 200) {
//       access_token = body.access_token;
//       res.redirect('/');
//     }
//   });
// });

app.get(`${baseUrl}/auth/token`, (req, res) => {
    if (req.isAuthenticated()) {
      return res.json({ access_token: req.user.accessToken });
    } 
    return res.status(401).json({ error: 'User not authenticated' });
});

// Clear session on logout
app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/login');
});

// app.get('/auth/token', (req, res) => {
//   res.json({ access_token: access_token})
// });

/** ===================Telegram Connection=================== */
app.get(`${baseUrl}/telegram/poll`, async (req, res) => {
    try {
        const rows = await dbService.getTgChatId();

        if (rows.length === 0) {
            console.error('No results found, global.bot not initialized properly');
            return;
        }

        const songs = await dbService.getSongs();
        const songTitles = songs.map(song => song.last_song_title);
        const artists = songs.map(song => song.last_song_artist);
        const fullSongs = [];

        const emails = [process.env.E1, process.env.E2, process.env.E3, process.env.E4, process.env.E5];

        var dbEmails = await dbService.getEmails();
        dbEmails = dbEmails.map(email => email.email);
        console.log(dbEmails);

        const hasEveryoneAnswered = emails.sort().toString() === dbEmails.sort().toString();

        for (let i = 0; i < artists.length; i++) {
            fullSongs.push(`${artists[i]} - ${songTitles[i]}`)
        }

        if(hasEveryoneAnswered) {
            tgService.createPoll(rows[0].chat_id, fullSongs);
        }
    } catch(error) {
        console.error(error);
        res.status(500).send(error);
        return;
    }
});

app.use(express.json());
app.use(express.urlencoded({extended: true}))
app.use(express.static(path.join(__dirname, '../build')));

// For any other routes, serve the React app
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(process.env.PORT || port, () => {
  console.log(`Listening at http://localhost:${port}`)
});