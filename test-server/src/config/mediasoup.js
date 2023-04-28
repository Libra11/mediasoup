/*
 * @Author: Libra
 * @Date: 2023-04-28 10:48:48
 * @LastEditTime: 2023-04-28 14:35:36
 * @LastEditors: Libra
 * @Description: mediasoup config
 */
const os = require("os");
const { getIPAddress } = require("../util/index");

module.exports = {
  // the number of mediasoup workers to launch
  numWorkers: Object.keys(os.cpus()).length,
  // mediasoup Worker settings
  workerSettings: {
    // (optional) the level of log, default is error
    logLevel: "warn",
    // (optional) mediasoup Worker's logTags, default is an empty array
    logTags: [
      "info",
      "ice",
      "dtls",
      "rtp",
      "srtp",
      "rtcp",
      "rtx",
      "bwe",
      "score",
      "simulcast",
      "svc",
      "sctp",
    ],
    // (optional) rtcMinPort and rtcMaxPort for UDP and TCP, default is 10000 and 59999
    rtcMinPort: 40000,
    rtcMaxPort: 49999,
    // (optional) dtlsCertificateFile and dtlsPrivateKeyFile for DTLS, default is null
    dtlsCertificateFile: null,
    dtlsPrivateKeyFile: null,
    // (optional) custom application data, default is {}
    appData: {},
  },
  // mediasoup Router settings
  routerOptions: {
    // (optional) Router media codecs (default: [])
    mediaCodecs: [
      {
        kind: "audio",
        mimeType: "audio/opus",
        clockRate: 48000,
        channels: 2,
      },
      {
        kind: "video",
        mimeType: "video/VP8",
        clockRate: 90000,
        parameters: { "x-google-start-bitrate": 1000 },
      },
      {
        kind: "video",
        mimeType: "video/VP9",
        clockRate: 90000,
        parameters: {
          "profile-id": 2,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "4d0032",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
      {
        kind: "video",
        mimeType: "video/h264",
        clockRate: 90000,
        parameters: {
          "packetization-mode": 1,
          "profile-level-id": "42e01f",
          "level-asymmetry-allowed": 1,
          "x-google-start-bitrate": 1000,
        },
      },
    ],
    // (optional) custom application data, default is {}
    appData: {},
  },
  // mediasoup WebRtcTransport settings
  webRtcTransportOptions: {
    // (required) listenIp in mediasoup WebRtcTransport settings, one or more listening IP addresses in order of preference (first one is the preferred one)
    listenIps: [
      {
        ip: "0.0.0.0",
        announcedIp: getIPAddress(),
      },
    ],
    // default output bit rate (bps)
    initialAvailableOutgoingBitrate: 1000000,
    // max incoming bitrate (bps) for remote peers
    maxIncomingBitrate: 1500000,
  },
};
