const express = require('express')
const http = require('http')
const {Server} = require('socket.io')
const app = express()
const server = http.createServer(app)
const jwt = require('jsonwebtoken')
const Conversation = require ("../models/Conversation");
const Message = require ("../models/Message");
const mongoose = require('mongoose')
const EventEmitter = require("events")
const saveMessageEvent = new EventEmitter()



const io = new Server(server, {
    cors: {
        origin :"http://localhost:3000",
        methods: ["GET", "POST"],
    }
})

io.use((socket, next) => {
    const token = socket.handshake.auth?.token 
    if(!token){
        console.log("Socket connection rejected: Token missing");
        return next(new Error('Authentication error: Token missing'))
    }
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET,(err, decoded)=> {
        if(err){console.log("error");return next(new Error('Authentication error: Invalid or expired token'))}
        socket.userId = decoded.UserInfo.userId;
        next();
    })
    
})

const onlineUsers = {};

saveMessageEvent.on("saveMessage", async(data) => {
    try{
        const {tempId, receiverId, message, senderId} = data
        let conversation = await Conversation.findOne({
            participants: { $all: [senderId, receiverId] }
        });
        console.log("added a message to a conversation")

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [senderId, receiverId],
            });
            console.log("created new conversation")
        }

        // let conversation = await Conversation.findOneAndUpdate(
        //     {participants: {$all: [senderId, receiverId]}},
        //     {$setOnInsert:{participants: [senderId, receiverId]}},
        //     {new: true, upsert:true}
        // )
        const newMessage = new Message({
            _id: tempId,
            senderId,
            receiverId,
            message,
        });

        if (newMessage) {
            conversation.messages.push(newMessage._id);
            console.log(`added message to conversation ${newMessage}`)
        }
        await Promise.all([conversation.save(), newMessage.save()]);
    }catch (error){
        console.error("Error saving message:", error)
    }
})
io.on("connection", (socket) => {
    console.log(`A user connected: ${socket.id}`)
    const userId = socket.userId
    if (!onlineUsers[userId]) {
        onlineUsers[userId] = [];
    }
    onlineUsers[userId].push(socket.id);
    console.log(onlineUsers)

    io.emit("onlineUsers", Object.keys(onlineUsers))

    socket.on("message", (data) => {
        console.log("Message received from client:", data)
        const tempId = new mongoose.Types.ObjectId()
        const {receiverId, message} = data

        if (!receiverId || !message) {
            console.error("Invalid message data:", data);
            return;
        }

        saveMessageEvent.emit("saveMessage", {receiverId, message, tempId, senderId: socket.userId})
        
        const recipientSocketId = onlineUsers[receiverId];
        if (recipientSocketId) {
            io.to(recipientSocketId).emit("newMessage", {
                _id: tempId,
                senderId: socket.userId,
                message,
            })
        }
        socket.emit("messageReceived", `Server received:${data}`)
    })


    socket.on('updateToken', (data)=> {
        console.log("new access token", data)
    })
    socket.on("disconnect", () => {
        console.log(`A user disconnected: ${socket.id}`)
        onlineUsers[userId] = onlineUsers[userId].filter((id) => id !== socket.id);
    if (onlineUsers[userId].length === 0) {
        delete onlineUsers[userId];
    }
    io.emit("onlineUsers", Object.keys(onlineUsers));
    console.log("Updated online users:", onlineUsers);
    })
})

module.exports = {app, io, server}