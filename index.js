const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const multer = require("multer");
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.use(cors());
app.use(express.json());

// SQL Database setup
// const db = mysql.createPool({
//     host: 'localhost',
//     user: 'root',         // Use your database username
//     password: '', // Use your database password
//     database: 'zoaic_newdb2020'
// });

const db = mysql.createPool({
    host: '204.155.156.216',
    user: 'stagingmate4trad_msg',         // Use your database username
    password: '=mUg}meTRUGY', // Use your database password
    database: 'stagingmate4trad_messenger',
    port: 3306
});
// SQL Table Creation
const initializeDatabase = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) UNIQUE NOT NULL,
            password VARCHAR(255) NOT NULL
        )
    `);

    await db.query(`
        CREATE TABLE IF NOT EXISTS messages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            sender VARCHAR(255) NOT NULL,
            content TEXT NOT NULL,
            timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);
};
initializeDatabase();

// Authentication Middleware
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization');
    if (!token) return res.status(401).json({ message: 'Access denied' });
    try {
        const verified = jwt.verify(token, 'SECRET');
        req.user = verified;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token' });
    }
};

const getLoggedInUser = (token) => {
    try {
        return jwt.verify(token, 'SECRET');
    } catch (err) {
        return false;
    }
}

// Routes
const staticFolderPath = path.join(__dirname, 'dist');
app.use(express.static(staticFolderPath));

// app.get('/', async (req,res)=>{
//     console.log('method called');
//     res.sendFile(path.join(staticFolderPath,'index.html'));
// })

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    try {
        const [result] = await db.query("INSERT INTO users (username, password) VALUES (?, ?)", [username, hashedPassword]);
        res.send({ message: 'User registered successfully' });
    } catch (err) {
        res.status(400).send(err);
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [username]);
    if (rows.length === 0) return res.status(400).json({ message: 'User not found' });

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: user.id }, 'SECRET');
    res.header('Authorization', token).send({ token });
});

app.post('/validateToken', authenticateToken, async (req, res) => {
    // console.log('validating');
    if (req.user) {
        const [sqres] = await db.query(`SELECT id,username FROM users WHERE id=${req.user.id}`);
        res.json(sqres);
    } else {
        res.json({ error: 'Invalid User.' });
    }
})

app.post('/messages', authenticateToken, async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    // const [messages] = await db.query(`
    //     SELECT * FROM messages1 ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    //     [parseInt(limit), offset]
    // );
    const [messages] = await db.query(`
        SELECT 
        m.message_id,
        m.message_text,
        m.created_at,
        m.user_id,
        u.username AS sender_name
    FROM 
        messages1 m
    JOIN 
        users u ON m.user_id = u.id
    WHERE 
        m.chat_id = ${req.body.chat_id}
    ORDER BY 
        m.created_at DESC
    LIMIT ${limit} OFFSET ${offset}; 
        `,);
    // console.log(messages);
    res.json(messages.reverse());
});
app.get('/list', authenticateToken, async (req, res) => {
    const [contactlist] = await db.query(`SELECT id, dept, username AS name FROM users`);
    // console.log(contactlist);
    res.json(contactlist);
});
app.post('/createchat', authenticateToken, async (req, res) => {
    const { chatType, users } = req.body;
    if (!chatType || users.length === 0) {
        return res.status(400).json({ message: 'Chat name and users array are required.' });
    }
    if(users.find((usr)=>{ return usr.id==req.user.id}) && users.length==1){
        return res.status(400).json({ message: 'Bad Request, Shame on you.'});
    }
    // const promisePool = db.promise();
    const connection = await db.getConnection();
    try {
        await connection.beginTransaction();
        let chat_type = chatType == 'individual' ? 'direct' : 'group';
        let chat_name = chatType == 'individual' ? '' : 'Group';
        // Insert new chat into the 'chats' table
        const [chatResult] = await connection.query(
            'INSERT INTO chats (chat_type, chat_name) VALUES (?, ?)',
            [chat_type, chat_name]
        );
        const chatId = chatResult.insertId; // Get the last inserted ID for the new chat
        //also add the current user in the insert loop
        
        if(!users.find((usr)=>{ return usr.id==req.user.id})){
            users.push({ id: req.user.id });
            console.log("creating")
        }
        
        // Prepare an array of user data to insert into the 'chat_users' table
        const userInsertPromises = users.map(user => {
            return connection.query(
                "INSERT INTO chat_members (chat_id, user_id, role) VALUES (?, ?, 'member')",
                [chatId, user.id]
            );
        });
        // Execute all user insertions concurrently
        await Promise.all(userInsertPromises);
        // Commit the transaction
        await connection.commit();
        // Send response with chat ID
        res.status(201).json({ message: 'Chat created successfully', chatId });
    } catch (err) {
        // If any error occurs, rollback the transaction
        await connection.rollback();
        console.error('Error in /createchat route:', err);
        res.status(500).json({ message: 'Internal server error', error: err.message });
    } finally {
        // Release the connection back to the pool
        connection.release();
    }
});

const upload = multer({ dest: "uploads/" });
app.post("/upload", upload.single("image"), (req, res) => {
    if (!req.file) { return res.status(400).send("No file uploaded."); }
    const filePath = path.join(__dirname, "uploads", req.file.originalname);
    const fs = require("fs");
    fs.rename(req.file.path, filePath, (err) => {
        if (err) return res.status(500).send("Error storing the file.");
        res.json({ message: "File uploaded successfully", file: req.file.originalname });
    });
});

app.get("/file/:filename", (req, res) => {
    const filePath = path.join(__dirname, "uploads", req.params.filename);
    fs.exists(filePath, (exists) => {
        if (!exists) {
            return res.status(404).send("File not found.");
        }
        res.sendFile(filePath);
    });
});

app.get('/contacts', authenticateToken, async (req, res) => {
    // console.log('contacts fetched');
    const [contacts] = await db.query(`SELECT 
    c.chat_id,
    CASE 
        WHEN c.chat_type = 'group' THEN c.chat_name 
        ELSE u2.username 
    END AS chat_name,
    COALESCE(m.message_text, '') AS last_message, 
    m.created_at AS message_time,
    sender.username AS sender_name,
    sender.id AS sender_id
FROM 
    chats c
JOIN 
    chat_members cm ON c.chat_id = cm.chat_id
LEFT JOIN 
    messages1 m ON c.chat_id = m.chat_id 
    AND m.message_id = (
        SELECT MAX(message_id) 
        FROM messages1 
        WHERE chat_id = c.chat_id
    )
LEFT JOIN 
    users sender ON m.user_id = sender.id 
LEFT JOIN 
    users u2 ON (c.chat_type = 'direct' AND u2.id = (
        SELECT user_id 
        FROM chat_members 
        WHERE chat_id = c.chat_id 
        AND user_id != cm.user_id LIMIT 1
    ))
WHERE 
    cm.user_id = ${req.user.id}
ORDER BY 
    -- Prioritize non-null messages (group chats without messages will appear last)
    (m.created_at IS NOT NULL) DESC, 
    m.created_at DESC;
`,
    );
    res.json(contacts);
});

const userSockets = {}; // Store userId -> socketId mappings

io.on('connection', (socket) => {
    console.log('New client connected');
    // console.log("Total Connections:- "+userSockets.length);
    let user_id = '';
    // Listen for user authentication to map user ID to socket ID
    socket.on('authenticate', ({ userId }) => {
        if (!userId) {
            console.error('Authentication failed: User ID not provided');
            return;
        }
        user_id = getLoggedInUser(userId).id;
        userSockets[user_id] = socket.id;
        console.log(`User ${user_id} authenticated with socket ID: ${socket.id}`);
    });


    socket.on('sendMessage', async ({ sender, content, chat_id = '', rcvr_id = '' }) => {
        try {
            let message;
            let wsrcvr_id;
            if (chat_id) {
                // Insert message if chat_id exists
                const [result] = await db.query(`
                    INSERT INTO messages1 (chat_id, user_id, message_text)
                    VALUES (?, ?, ?);
                `, [chat_id, user_id, content]);
                [wsrcvr_id] = await db.query("SELECT user_id FROM chat_members WHERE chat_id = ? AND user_id != ?;", [chat_id, user_id]);
                [message] = await db.query("SELECT messages1.*,users.username AS sender_name FROM messages1 JOIN users on users.id=messages1.user_id WHERE message_id = ?", [result.insertId]);
            } else {
                // If chat_id does not exist, create a new chat and members, then insert the message
                await db.query("START TRANSACTION");

                // 1. Insert into `chats`
                const [chatResult] = await db.query(`
                    INSERT INTO chats (chat_type)
                    VALUES ('direct');
                `);

                const newChatId = chatResult.insertId;

                // 2. Insert into `chat_members`
                await db.query(`
                    INSERT INTO chat_members (chat_id, user_id, role)
                    VALUES (?, ?, 'member'), (?, ?, 'member');
                `, [newChatId, user_id, newChatId, rcvr_id]);

                // 3. Insert message in `messages1`
                const [messageResult] = await db.query(`
                    INSERT INTO messages1 (chat_id, user_id, message_text)
                    VALUES (?, ?, ?);
                `, [newChatId, user_id, content]);

                // Commit the transaction
                await db.query("COMMIT");

                // [message] = await db.query("SELECT * FROM messages1 WHERE message_id = ?", [messageResult.insertId]);

                [message] = await db.query("SELECT m.*,u.username AS sender_name FROM messages1 m LEFT JOIN users u ON m.user_id = u.id WHERE m.message_id = ?", [messageResult.insertId]);

            }
            console.log(message);
            if (message.length > 0) {
                // console.log(wsrcvr_id[0]);
                // const recipientSocketId = userSockets[wsrcvr_id[0].user_id];

                // if (recipientSocketId) {
                //     io.to(recipientSocketId).emit('receiveMessage', message[0]);
                //     console.log('Message emitted to recipient: ' + recipientSocketId + " ", message[0]);
                // } else {
                //     console.log('Recipient not connected');
                // }
                wsrcvr_id.forEach(receiver => {
                    const recipientSocketId = userSockets[receiver.user_id];
                
                    if (recipientSocketId) {
                        io.to(recipientSocketId).emit('receiveMessage', message[0]);
                        console.log('Message emitted to recipient: ' + recipientSocketId + " ", message[0]);
                    } else {
                        console.log('Recipient not connected');
                    }
                });
                const senderSocketId = userSockets[user_id];
                if (senderSocketId) {
                    io.to(senderSocketId).emit('receiveMessage', message[0]);
                    console.log('Message emitted to sender: ' + senderSocketId + " ", message[0]);
                } else {
                    console.log('Recipient not connected');
                }
            } else {
                console.log('Error: Message could not be retrieved after insert');
            }
        } catch (error) {
            await db.query("ROLLBACK");  // Rollback in case of error
            console.error('Error handling sendMessage:', error);
        }
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');

        // Find and remove the disconnected user's socket ID from userSockets
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                console.log(`User ${userId} disconnected and removed from userSockets`);
                break;
            }
        }
    });
});


const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));