/*
 * @Author: Libra
 * @Date: 2023-04-28 11:00:04
 * @LastEditTime: 2023-04-28 15:13:26
 * @LastEditors: Libra
 * @Description: mediasoup workers
 */

const mediasoupConfig = require("../config/mediasoup");
const mediaSoup = require("mediasoup");
const Room = require("../room/index");

let mediaSoupWorkers = [];
let nextWorkerIdx = 0;
let roomsMap = new Map();

/**
 * @description: create mediasoup workers
 */
async function createMediaSoupWorkers() {
  const { numWorkers, workerSettings } = mediasoupConfig;
  for (let i = 0; i < numWorkers; ++i) {
    const worker = await mediaSoup.createWorker(workerSettings);
    worker.on("died", () => {
      console.error(
        `mediasoup worker died, exiting in 2 seconds... [pid:${worker.pid}]`
      );
      setTimeout(() => process.exit(1), 2000);
    });
    mediaSoupWorkers.push(worker);
  }
}

/**
 * @description: get next worker
 */
function getMediaSoupWorker() {
  const worker = mediaSoupWorkers[nextWorkerIdx];
  if (++nextWorkerIdx === mediaSoupWorkers.length) {
    nextWorkerIdx = 0;
  }
  return worker;
}

/**
 *
 * @description: get or create room
 * @param {*} roomId
 * @returns room
 */
async function getOrCreateRoom(roomId) {
  let room = roomsMap.get(roomId);
  if (!room) {
    const mediaSoupWorker = getMediaSoupWorker();
    room = await Room.createRoom(mediaSoupWorker, roomId);
    room.on("close", () => {
      console.log(`room ${roomId} closed, deleting it...`);
      roomsMap.delete(roomId);
    });
    roomsMap.set(roomId, room);
  }
  return room;
}

module.exports = {
  createMediaSoupWorkers,
  getOrCreateRoom,
};
