import express from "express";
import { WebSocketServer } from 'ws';
import { createServer } from 'http';

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Creates a key value pair where the key is the userid and the value is the websocket for each client
export let clients: { [key: string]: any } = {};

wss.on('connection', (ws) => {

    let id = "";

    // Attaches the generated id to the users cookie

    ws.on('close', () => {
        console.log(`Client ${id} disconnected`);
    });
    
    ws.on('message', (message) => {
      console.log(`Received: ${message}`);
      if (message.toString().startsWith("session:")) {
        id = message.toString().split(": ")[1];
        clients[id] = ws;
        console.log(`client ${id} connected`)
      }
    });

});
  
server.listen(8080);