/*
 * @Author: Libra
 * @Date: 2023-04-28 12:53:16
 * @LastEditTime: 2023-05-12 11:18:38
 * @LastEditors: Libra
 * @Description: room class
 */
const EventEmitter = require("events").EventEmitter;
const {
  routerOptions,
  webRtcTransportOptions,
} = require("../config/mediasoup");
const { socketPromise, getIPAddress } = require("../util");
// const { record } = require("../record");
class Room extends EventEmitter {
  constructor(roomId, mediasoupRouter) {
    super();
    this._roomId = roomId;
    this._mediasoupRouter = mediasoupRouter;
    this._sockets = [];
    this._AppData = new Map();
  }
  static async createRoom(mediasoupWorker, roomId) {
    const router = await mediasoupWorker.createRouter(routerOptions);
    return new Room(roomId, router);
  }

  close() {
    this._mediasoupRouter.close();
    this.emit("close");
  }

  initSocket(userName, socket) {
    // if socket already exists in this room, remove it
    this._sockets = this._sockets.filter((s) => s.id !== socket.id);
    this._AppData.set(socket.id, {
      userName,
      device: undefined,
      rtpCapabilities: undefined,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    });
    socket.join(this._roomId);
    socket.on("disconnecting", (reason) => {
      this.socketDisconnecting(socket, reason);
    });
    socket.on("disconnect", (reason) => {
      // if sockets length is 0, close the room
      if (this._sockets.length === 0) {
        this.close();
      }
      console.info(
        `${this._roomId}-${socket.id} is disconnected, reason: ${reason}`
      );
    });
    this.handleSocketRequest(socket);
    this._sockets.push(socket);
  }

  socketDisconnecting(socket, reason) {
    // delete socket from sockets array
    this._sockets = this._sockets.filter((s) => s.id !== socket.id);
    // delete socket data from AppData
    this._AppData.delete(socket.id);
    console.info(
      `${this._roomId}-${socket.id} is disconnecting..., reason: ${reason}`
    );
  }

  // handle socket request
  handleSocketRequest(socket) {
    // get router rtpCapabilities
    socket.on("getRouterRtpCapabilities", (_, callback) => {
      callback(this._mediasoupRouter.rtpCapabilities);
    });
    // createWebRtcTransport
    socket.on("createWebRtcTransport", async (data, callback) => {
      try {
        const { producer, consumer } = data;
        const { transport, params } = await this.createWebRtcTransport(
          producer,
          consumer,
          socket
        );
        this._AppData.get(socket.id).transports.set(transport.id, transport);
        callback(params);
      } catch (error) {
        console.error("createWebRtcTransport error", error);
        callback({ error: error.message });
      }
    });
    // connectServerWebRtcTransport
    socket.on("connectTransport", async (data, callback) => {
      try {
        const { transportId, dtlsParameters } = data;
        const transport = this._AppData
          .get(socket.id)
          .transports.get(transportId);
        if (!transport) {
          console.error(`transport with id ${transportId} not found`);
        }
        await transport.connect({ dtlsParameters });
        callback();
      } catch (error) {
        console.error("connectServerWebRtcTransport error", error);
        callback({ error: error.message });
      }
    });
    // produce
    socket.on("produce", async (data, callback) => {
      try {
        const { kind, rtpParameters, transportId, appData } = data;
        const transport = this._AppData
          .get(socket.id)
          .transports.get(transportId);
        if (!transport) {
          console.error(`transport with id ${transportId} not found`);
        }
        const producer = await transport.produce({
          kind,
          rtpParameters,
          appData,
        });
        this._AppData.get(socket.id).producers.set(producer.id, producer);
        producer.on("transportclose", () => {
          this._AppData.get(socket.id).producers.delete(producer.id);
        });
        callback({ id: producer.id });
        // record
        // record(producer, this._mediasoupRouter);
        for (const client of this._sockets.filter((s) => s.id !== socket.id)) {
          this.createConsumer(client, producer);
        }
      } catch (error) {
        console.error("produce error", error);
        callback({ error: error.message });
      }
    });

    // join room
    socket.on("joinRoom", async (data, callback) => {
      try {
        const { rtpCapabilities, device } = data;
        this._AppData.get(socket.id).rtpCapabilities = rtpCapabilities;
        this._AppData.get(socket.id).device = device;
        for (const client of this._sockets.filter((s) => s.id !== socket.id)) {
          for (const producer of this._AppData
            .get(client.id)
            .producers.values()) {
            this.createConsumer(socket, producer);
          }
        }
      } catch (error) {
        console.error("joinRoom error", error);
        callback({ error: error.message });
      }
    });

    // close producer
    socket.on("closeProducer", async (data, callback) => {
      try {
        const { producerId } = data;
        const producer = this._AppData.get(socket.id).producers.get(producerId);
        if (!producer) {
          console.error(`producer with id ${producerId} not found`);
        }
        producer.close();
        callback();
      } catch (error) {
        console.error("closeProducer error", error);
        callback({ error: error.message });
      }
    });

    // pause producer
    socket.on("pauseProducer", async (data, callback) => {
      try {
        const { producerId } = data;
        const producer = this._AppData.get(socket.id).producers.get(producerId);
        if (!producer) {
          console.error(`producer with id ${producerId} not found`);
        }
        await producer.pause();
        callback();
      } catch (error) {
        console.error("pauseProducer error", error);
        callback({ error: error.message });
      }
    });

    socket.on("resumeProducer", async (data, callback) => {
      try {
        const { producerId } = data;
        const producer = this._AppData.get(socket.id).producers.get(producerId);
        if (!producer) {
          console.error(`producer with id ${producerId} not found`);
        }
        await producer.resume();
        callback();
      } catch (error) {
        console.error("resumeProducer error", error);
        callback({ error: error.message });
      }
    });

    socket.on("message", (message) => {
      // send broadcast message
      this._sockets.forEach((s) => {
        if (s.id !== socket.id) {
          s.emit("message", message);
        }
      });
    });
  }

  // createWebRtcTransport
  async createWebRtcTransport(producer, consumer, socket) {
    const { listenIps, maxIncomingBitrate, initialAvailableOutgoingBitrate } =
      webRtcTransportOptions;
    const transport = await this._mediasoupRouter.createWebRtcTransport({
      listenIps,
      initialAvailableOutgoingBitrate,
      appData: { producer, consumer },
    });
    transport.on("dtlsstatechange", (dtlsState) => {
      if (dtlsState === "closed") {
        console.log(`${socket.id} transport closed`);
        transport.close();
      }
    });
    if (maxIncomingBitrate) {
      try {
        await transport.setMaxIncomingBitrate(maxIncomingBitrate);
      } catch (error) {
        console.error("setMaxIncomingBitrate error", error);
      }
    }
    return {
      transport,
      params: {
        id: transport.id,
        iceParameters: transport.iceParameters,
        iceCandidates: transport.iceCandidates,
        dtlsParameters: transport.dtlsParameters,
      },
    };
  }

  // createConsumer
  async createConsumer(socket, producer) {
    const { rtpCapabilities, transports, recordTransports } = this._AppData.get(
      socket.id
    );
    if (
      !rtpCapabilities ||
      !this._mediasoupRouter.canConsume({
        producerId: producer.id,
        rtpCapabilities,
      })
    )
      return;
    const transport = Array.from(transports.values()).find(
      (t) => t.appData.consumer
    );
    if (!transport) {
      console.error("transport for consumer not found");
      return;
    }
    let consumer;
    try {
      consumer = await transport.consume({
        producerId: producer.id,
        rtpCapabilities,
        paused: true,
      });
      consumer.on("transportclose", () => {
        ffmpeg.stdin.end();
        this._AppData.get(socket.id).consumers.delete(consumer.id);
      });
      consumer.on("producerclose", () => {
        this._AppData.get(socket.id).consumers.delete(consumer.id);
        socket.emit("consumerClosed", { consumerId: consumer.id });
      });
      consumer.on("producerpause", () => {
        socket.emit("consumerPaused", { consumerId: consumer.id });
      });
      consumer.on("producerresume", () => {
        socket.emit("consumerResumed", { consumerId: consumer.id });
      });
    } catch (error) {
      console.error("consume error", error);
      return;
    }
    this._AppData.get(socket.id).consumers.set(consumer.id, consumer);
    try {
      await socketPromise(socket, "newConsumer", {
        id: consumer.id,
        producerId: producer.id,
        kind: consumer.kind,
        rtpParameters: consumer.rtpParameters,
        type: consumer.type,
        producerPaused: consumer.producerPaused,
        appData: producer.appData,
      });
      await consumer.resume();
    } catch (error) {
      console.error("newConsumer error", error);
    }
  }
}

module.exports = Room;
