/*
 * @Author: Libra
 * @Date: 2023-04-26 18:20:39
 * @LastEditTime: 2023-04-28 15:22:08
 * @LastEditors: Libra
 * @Description:
 */
const https = require("https");
const { Server } = require("socket.io");
const fs = require("fs");
const Koa = require("koa");
const app = new Koa();
const path = require("path");

const {
  getOrCreateRoom,
  createMediaSoupWorkers,
} = require("./src/worker/index");
const { sslCrt, sslKey, listenPort } = require("./src/config/server");

const options = {
  key: fs.readFileSync(path.resolve(__dirname, sslKey)),
  cert: fs.readFileSync(path.resolve(__dirname, sslCrt)),
};
const server = https.createServer(options, app.callback());

async function startWorkers() {
  server.listen(listenPort, async () => {
    console.log(`server listening on ${listenPort}`);
    await startSocket();
    await createMediaSoupWorkers();
  });
}

startWorkers();

async function startSocket() {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
    path: "/libra", //连接路径
  });
  // io.use((socket, next) => {
  //   // const {auth:{token},query:{roomId}} = socket.handshake;
  //   // some auth logic
  // });
  io.on("connection", async (socket) => {
    console.log(`${socket.id} connected`);
    const { roomId, userName } = socket.handshake.query;
    const room = await getOrCreateRoom(roomId);
    room.initSocket(userName, socket);
  });
}
