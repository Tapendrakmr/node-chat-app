//server and express not run simultanously .so we have to done some refracting here
const path=require('path')
//for that we need hhtp module
const http=require('http')
const express=require('express')
const socketio=require('socket.io')
const Filter=require('bad-words')
const {generateMessage,generateLocationMessage}= require('./utils/messages')
const {addUser,removeUser,getUser,getUsersInRoom} =require('./utils/users')



const app=express()
//it allow to run both module together
const server=http.createServer(app)
//express could not connect with socketio directly .so connect them by the help of http
const io=socketio(server)

const port=process.env.PORT||3000 
const publicDirectory=path.join(__dirname,'../public')


app.use(express.static(publicDirectory)) 

//let count=0
io.on('connection' ,(socket)=>{
    console.log('New WebSocket connection')

const message='Welcome'
 

  socket.on('join',(options,callback)=>{
  const {error,user}=addUser({id:socket.id,...options})

  if(error)
  {
     return callback(error)
  }

  socket.join(user.room)
    
  socket.emit('message',generateMessage('Admin','Welcome'))
  socket.broadcast.to(user.room).emit('message',generateMessage('Admin',`${user. username} has joined`))
  io.to(user.room).emit('roomData',{
    room:user.room,
    users:getUsersInRoom(user.room)
  })
  callback()
  })

 
  socket.on('sendMessage',(message,callback)=>{
    const user=getUser(socket.id)
   const filter =new Filter()
 
   if(filter.isProfane(message))
   {  
       return callback('Profanity is not allowed')
   }
      
   io.to(user.room).emit('message',generateMessage(user.username,message))
   callback()
})

   socket.on('sendLocation',(coords,callback)=>{
      const user=getUser(socket.id)
    io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,`https://google.com/maps?q=${coords.lat},${coords.long}`))
   callback( )
 }) 
 
 



socket.on('disconnect',()=>{
     const user=removeUser(socket.id)
      if(user){
        io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left`))
        io.to(user.room).emit('roomData',{
           room:user.room,
           users:getUsersInRoom(user.room) 
        })
     
      }   
  })  
})

//here instead of using app,we gonna use sever
server.listen(port,()=>{
    console.log('Server is up on port '+port)
})