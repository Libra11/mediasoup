/*
 * @Author: Libra
 * @Date: 2023-04-29 19:15:12
 * @LastEditTime: 2023-04-29 23:04:55
 * @LastEditors: Libra
 * @Description: room client
 */
import { EventEmitter } from 'events'
import { io } from 'socket.io-client'
import * as mediaSoupClient from 'mediasoup-client'
import { socketPromise } from './util'

export default class Room extends EventEmitter {
  constructor(roomId, userName, producer, consumer, video, audio, screen) {
    super()
    this._roomId = roomId
    this._userName = userName
    this._socket = null
    this._device = null
    this._video = video
    this._audio = audio
    this._screen = screen
    this._producer = producer
    this._consumer = consumer
    this._consumers = new Map()
    this._mediasoupDevice = null
    this._sendTransport = null
    this._recvTransport = null
    this._audioProducer = null
    this._videoProducer = null
    this._screenProducer = null
  }

  close(reason) {
    if (this._socket && this._socket.connected) {
      this._socket.close()
    }
    if (this._audioProducer) {
      this._audioProducer.close()
    }
    if (this._videoProducer) {
      this._videoProducer.close()
    }
    if (this._screenProducer) {
      this._screenProducer.close()
    }
    if (this._sendTransport) {
      this._sendTransport.close()
    }
    if (this._recvTransport) {
      this._recvTransport.close()
    }
    this.emit('close', reason)
  }

  async joinRoom(addr, path) {
    const socket = io(addr, {
      path,
      query: {
        roomId: this._roomId,
        userName: this._userName
      }
    })
    socket.on('connect', async () => {
      await this.initRoom(socket)
      await this.produce(this._video, this._audio, this._screen)
      if (this._consumer) {
        await this.join()
      }
    })
    socket.on('disconnect', (reason) => {
      console.log('socket disconnect:', reason)
      this.close(reason)
    })
    socket.on('connect_error', (err) => {
      console.log('socket connect_error:', err)
      this.close(err.message)
    })
    this.otherSocketEvent(socket)
    this._socket = socket
  }

  otherSocketEvent(socket) {
    socket.on('consumerClosed', ({ consumerId }) => {
      try {
        const consumer = this._consumers.get(consumerId)
        if (!consumer) {
          console.error(`consumer with id ${consumerId} not found`)
        }
        consumer.close()
        this._consumers.delete(consumerId)
      } catch (error) {
        console.error(error)
      }
    })
    socket.on('consumerPaused', ({ consumerId }) => {
      try {
        const consumer = this._consumers.get(consumerId)
        if (!consumer) {
          console.error(`consumer with id ${consumerId} not found`)
        }
        consumer.pause()
      } catch (error) {
        console.error(error)
      }
    })
    socket.on('consumerResumed', ({ consumerId }) => {
      try {
        const consumer = this._consumers.get(consumerId)
        if (!consumer) {
          console.error(`consumer with id ${consumerId} not found`)
        }
        consumer.resume()
      } catch (error) {
        console.error(error)
      }
    })

    socket.on('newConsumer', async (data, callback) => {
      try {
        const { producerId, id, kind, rtpParameters, appData } = data
        const consumer = await this._recvTransport.consume({
          id,
          producerId,
          kind,
          rtpParameters,
          appData
        })
        this._consumers.set(consumer.id, consumer)
        consumer.on('transportclose', () => {
          this._consumers.delete(consumer.id)
        })
        this.emit('consumers', this._consumers)
        callback()
      } catch (error) {
        console.error(error)
        callback({ error: error.message })
      }
    })
  }

  async initRoom(socket) {
    try {
      this._mediasoupDevice = new mediaSoupClient.Device()
      const routerRtpCapabilities = await socketPromise(socket, 'getRouterRtpCapabilities')
      console.log('routerRtpCapabilities: ', routerRtpCapabilities)
      await this._mediasoupDevice.load({ routerRtpCapabilities })
      const transportParams = await socketPromise(socket, 'createWebRtcTransport', {
        producer: this._producer,
        consumer: this._consumer
      })
      this.initSendTransport(socket, transportParams)
      this.initRecvTransport(socket, transportParams)
    } catch (error) {
      console.error('initRoom error: ', error)
      this.close(error.message)
    }
  }

  initSendTransport(socket, transportParams) {
    this._sendTransport = this._mediasoupDevice.createSendTransport(transportParams)
    this._sendTransport.on('connect', async ({ dtlsParameters }, callback) => {
      try {
        await socketPromise(socket, 'connectTransport', {
          transportId: this._sendTransport.id,
          dtlsParameters
        })
        callback()
      } catch (error) {
        console.error(error)
        callback(error)
      }
    })
    this._sendTransport.on('produce', async ({ kind, rtpParameters }, callback, errback) => {
      try {
        const { id } = await socketPromise(socket, 'produce', {
          transportId: this._sendTransport.id,
          kind,
          rtpParameters
        })
        callback({ id })
      } catch (error) {
        errback(error)
      }
    })
    this._sendTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          console.log('send transport connecting')
          break
        case 'connected':
          console.log('send transport connected')
          break
        case 'failed':
          console.log('send transport failed')
          this._sendTransport.close()
          break
        default:
          break
      }
    })
  }

  initRecvTransport(socket, transportParams) {
    this._recvTransport = this._mediasoupDevice.createRecvTransport(transportParams)
    this._recvTransport.on('connect', async ({ dtlsParameters }, callback) => {
      try {
        await socketPromise(socket, 'connectTransport', {
          transportId: this._recvTransport.id,
          dtlsParameters
        })
        callback()
      } catch (error) {
        console.error(error)
        callback(error)
      }
    })
    this._recvTransport.on('connectionstatechange', (state) => {
      switch (state) {
        case 'connecting':
          console.log('recv transport connecting')
          break
        case 'connected':
          console.log('recv transport connected')
          break
        case 'failed':
          console.log('recv transport failed')
          this._recvTransport.close()
          break
        default:
          break
      }
    })
  }

  async join() {
    try {
      await socketPromise(this._socket, 'joinRoom', {
        device: this._device,
        rtpCapabilities: this._mediasoupDevice.rtpCapabilities
      })
    } catch (error) {
      console.error('join error', error)
    }
  }

  async produce(video, audio, screen) {
    if (video) {
      console.log('produce: ', video, audio, screen)
      this.produceVideo()
    }
    if (audio) {
      this.produceAudio()
    }
    if (screen) {
      this.produceScreen()
    }
  }

  async produceAudio() {
    if (!this._mediasoupDevice.canProduce('audio')) {
      console.error('cannot produce audio')
      return
    }
    let track
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      track = stream.getAudioTracks()[0]
      const params = {
        track,
        codecOptions: {
          opusStereo: 1,
          opusDtx: 1
        },
        appData: {
          roomId: this._roomId
        }
      }
      const audioProducer = await this._sendTransport.produce(params)
      audioProducer.on('transportclose', () => {
        this._audioProducer = null
        console.log('audio producer transport close')
      })
      audioProducer.on('trackended', () => {
        console.log('audio track ended')
        this.closeMic()
      })
      this._audioProducer = audioProducer
    } catch (error) {
      console.error('produce audio error: ', error)
      if (track) track.stop()
    }
  }

  async closeMic() {
    if (!this._audioProducer) return
    this._audioProducer.close()
    try {
      await socketPromise(this._socket, 'closeProducer', {
        producerId: this._audioProducer.id
      })
    } catch (error) {
      console.error('close mic producer error: ', error)
    }
    this._audioProducer = null
  }

  async produceVideo() {
    if (!this._mediasoupDevice.canProduce('video')) {
      console.error('cannot produce video')
      return
    }
    let track
    let device
    try {
      device = this.getWebcamDevice()
      if (!device) {
        console.error('no webcam device')
        return
      }
      const VIDEO_CONSTRAINS = {
        qvga: { width: { ideal: 320 }, height: { ideal: 240 } },
        vga: { width: { ideal: 640 }, height: { ideal: 480 } },
        hd: { width: { ideal: 1280 }, height: { ideal: 720 } }
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          deviceId: { exact: device.deviceId },
          ...VIDEO_CONSTRAINS['hd']
        }
      })
      track = stream.getVideoTracks()[0]
      const params = {
        track,
        encodings: [{ maxBitrate: 100000 }, { maxBitrate: 300000 }, { maxBitrate: 900000 }],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        },
        appData: {
          roomId: this._roomId
        }
      }
      const videoProducer = await this._sendTransport.produce(params)
      videoProducer.on('transportclose', () => {
        this._videoProducer = null
        console.log('video producer transport close')
      })
      videoProducer.on('trackended', () => {
        console.log('video track ended')
        this.closeWebcam()
      })
      this._videoProducer = videoProducer
    } catch (error) {
      console.error('produce video error: ', error)
      if (track) track.stop()
    }
  }

  async getWebcamDevice() {
    const webcams = new Map()
    const devices = await navigator.mediaDevices.enumerateDevices()
    for (const device of devices) {
      if (device.kind !== 'videoinput') {
        continue
      }
      webcams.set(device.deviceId, device)
    }
    const array = Array.from(webcams.values())
    return new Promise((resolve, reject) => {
      if (array.length > 0) {
        resolve(array[0])
      }
      reject()
    })
  }

  async closeWebcam() {
    if (!this._videoProducer) return
    this._videoProducer.close()
    try {
      await socketPromise(this._socket, 'closeProducer', {
        producerId: this._videoProducer.id
      })
    } catch (error) {
      console.error('close webcam producer error: ', error)
    }
    this._videoProducer = null
  }

  async produceScreen() {
    if (!this._mediasoupDevice.canProduce('video')) {
      console.error('cannot produce screen video')
      return
    }
    let track
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        audio: false,
        video: {
          displaySurface: 'monitor',
          logicalSurface: true,
          cursor: true,
          width: { max: 1920 },
          height: { max: 1080 },
          frameRate: { max: 30 }
        }
      })
      if (!stream) {
        console.error('no screen stream')
        return
      }
      track = stream.getVideoTracks()[0]
      const params = {
        track,
        encodings: [{ maxBitrate: 100000 }, { maxBitrate: 300000 }, { maxBitrate: 900000 }],
        codecOptions: {
          videoGoogleStartBitrate: 1000
        },
        appData: { share: true, roomId: this._roomId }
      }
      const screenProducer = await this._sendTransport.produce(params)
      screenProducer.on('transportclose', () => {
        this._screenProducer = null
        console.log('screen producer transport close')
      })
      screenProducer.on('trackended', () => {
        console.log('screen track ended')
        this.closeScreen()
      })
      this._screenProducer = screenProducer
    } catch (error) {
      console.error('produce screen error: ', error)
      if (track) track.stop()
    }
  }

  async closeScreen() {
    if (!this._screenProducer) return
    this._screenProducer.close()
    try {
      await socketPromise(this._socket, 'closeProducer', {
        producerId: this._screenProducer.id
      })
    } catch (error) {
      console.error('close screen producer error: ', error)
    }
    this._screenProducer = null
  }

  async muteMic() {
    if (!this._audioProducer) return
    this._audioProducer.pause()
    try {
      await socketPromise(this._socket, 'pauseProducer', {
        producerId: this._audioProducer.id
      })
    } catch (error) {
      console.error('mute mic error: ', error)
    }
  }

  async unmuteMic() {
    if (!this._audioProducer) return
    this._audioProducer.resume()
    try {
      await socketPromise(this._socket, 'resumeProducer', {
        producerId: this._audioProducer.id
      })
    } catch (error) {
      console.error('unmute mic error: ', error)
    }
  }
}