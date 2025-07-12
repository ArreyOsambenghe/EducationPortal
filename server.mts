import  {createServer} from "node:http";
import next from "next";
import {Server} from 'socket.io';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port  = parseInt(process.env.PORT || '3000');

const app = next({dev,hostname,port});

const handle = app.getRequestHandler()

app.prepare().then(() => {
    const server = createServer((req, res) => {
        handle(req, res)
    }) 
    const io = new Server(server, {
        
    })
    io.on('connection', (socket) => {
        console.log('a user connected');
        socket.on('disconnect', () => {
            console.log('user disconnected');
        });
    });
    server.listen(port, () => {
        console.log(`** Ready on http://${hostname}:${port}`);
    })
    
})