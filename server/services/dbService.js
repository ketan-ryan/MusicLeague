const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

dotenv.config();
var connection;

async function initDb() {
    try {
        connection = await mysql.createConnection({
            host: process.env.JAWSDB_URL,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });

        console.log('Successfully connected to db');

        var query = `
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id VARCHAR(100),
            email VARCHAR(100),
            last_song_uri VARCHAR(100),
            last_song_title VARCHAR(100),
            last_song_artist VARCHAR(100)
        )`;
        await connection.execute(query);

        query = `
        CREATE TABLE IF NOT EXISTS telegram (
            user_id INT AUTO_INCREMENT PRIMARY KEY,
            user_name VARCHAR(100),
            chat_id BIGINT
        )`;
        await connection.execute(query);

        console.log('Tables created successfully')
    } catch (err) {
        console.error('Error connecting to the database:', err);
    }
}

initDb();

async function getUser(userId) {
    const query = `
        SELECT * FROM users
        WHERE user_id = (?)
    `;
    try {
        const [rows, _] = await connection.execute(query, [userId]);
        if (rows.length == 0) {
            return '';
        } else {
            return rows[0];
        }
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function createUser(userId, email) {
    const query = `
        INSERT INTO users (user_id, email)
        VALUES ((?), (?))
    `;
    try {
        await connection.execute(query, [userId, email]);
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function updateUser(userId, songUri, songTitle, songArtist) {
    const query = `
        UPDATE users
        SET last_song_uri = (?),
        last_song_title = (?),
        last_song_artist = (?)
        WHERE user_id = (?)
    `;
    try {
        await connection.execute(query, [songUri, songTitle, songArtist, userId]);
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function getCount() {
    const query = `
        SELECT COUNT (*)
        AS count
        FROM users
    `;
    try {
        [rows, _] = await connection.execute(query);
        return rows[0].count;
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function getSongs() {
    const query = `
        SELECT last_song_title, last_song_artist
        FROM users
    `;
    try {
        [rows, _] = await connection.execute(query);
        return rows;
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function getEmails() {
    const query = `
        SELECT email
        FROM users
    `;
    try {
        [rows, _] = await connection.execute(query);
        return rows;
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function getTgUserExists(user) {
    const query = `
        SELECT * FROM telegram
        WHERE user_name = (?)
    `;
    try {
        [rows, _] = await connection.execute(query, [user]);
        return rows.length;
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function createTgUser(userName, chatId) {
    const query = `
        INSERT INTO telegram (user_name, chat_id)
        VALUES ((?), (?))
    `;
    try {
        await connection.execute(query, [userName, chatId]);
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function updateTgUser(userName, chatId) {
    const query = `
        UPDATE telegram
        SET chat_id = (?)
        WHERE user_name = (?)
    `;
    try {
        await connection.execute(query, [chatId, userName]);
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

async function getTgChatId() {
    const query = `
        SELECT chat_id
        FROM telegram`
    ;
    try {
        [rows, _] = await connection.execute(query);
        return rows;
    } catch (err) {
        console.error('Error executing query: ', err);
        throw(err);
    }
}

module.exports = {
    getUser,
    createUser,
    updateUser,
    getCount,
    getSongs,
    getEmails,
    getTgUserExists,
    getTgChatId,
    createTgUser,
    updateTgUser,
}