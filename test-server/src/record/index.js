/*
 * @Author: Libra
 * @Date: 2023-05-12 11:04:22
 * @LastEditTime: 2023-05-12 11:14:23
 * @LastEditors: Libra
 * @Description: 
 */
const { spawn } = require("child_process");

let _recordVideoConsumer = null;
let _recordVideoTransport = null;
let _recordAudioConsumer = null;
let _recordAudioTransport = null;
async function record(producer, router) {
  console.log("record producer", producer.kind);
  const rtpCapabilities = router.rtpCapabilities;
  if (producer.kind === "video") {
    _recordVideoTransport = await router.createPlainTransport({
      listenIp: { ip: "127.0.0.1", announcedIp: null },
      rtcpMux: false,
      comedia: false,
    });
    _recordVideoTransport.connect({
      ip: "127.0.0.1",
      port: 5006,
      rtcpPort: 5007,
    });
    _recordVideoConsumer = await _recordVideoTransport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true,
    });
  } else {
    _recordAudioTransport = await router.createPlainTransport({
      listenIp: { ip: "127.0.0.1", announcedIp: null },
      rtcpMux: false,
      comedia: false,
    });
    _recordAudioTransport.connect({
      ip: "127.0.0.1",
      port: 5004,
      rtcpPort: 5005,
    });
    _recordAudioConsumer = await _recordAudioTransport.consume({
      producerId: producer.id,
      rtpCapabilities,
      paused: true,
    });
  }
  setTimeout(() => {
    startRecordingFfmpeg();
  }, 10000);
}
function stopMediasoupRtp() {
  console.log("Stop mediasoup RTP transport and consumer");
  global.process.kill("SIGINT");

  const useAudio = _recordAudioConsumer !== null;
  const useVideo = _recordVideoConsumer !== null;

  if (useAudio) {
    recordAudioConsumer.close();
    recordAudioTransport.close();
  }

  if (useVideo) {
    recordVideoConsumer.close();
    recordVideoTransport.close();
  }
}
function startRecordingFfmpeg() {
  // Return a Promise that can be awaited
  let recResolve;
  const promise = new Promise((res, _rej) => {
    recResolve = res;
  });

  const useAudio = _recordAudioConsumer !== null;
  const useVideo = _recordVideoConsumer !== null;

  let cmdInputPath = `${__dirname}/recording/input-vp8.sdp`;
  let cmdOutputPath = `${__dirname}/recording/output-ffmpeg-vp${Math.random()}.webm`;
  let cmdCodec = "";
  let cmdFormat = "-f webm -flags +global_header";
  if (useAudio) {
    cmdCodec += " -map 0:a:0 -c:a copy";
  }
  if (useVideo) {
    cmdCodec += " -map 0:v:0 -c:v copy";
  }

  // Run process
  const cmdArgStr = [
    "-nostdin",
    "-protocol_whitelist file,rtp,udp",
    // "-loglevel debug",
    // "-analyzeduration 5M",
    // "-bufsize 5M",
    // "-probesize 5M",
    "-fflags +genpts",
    `-i ${cmdInputPath}`,
    cmdCodec,
    cmdFormat,
    `-y ${cmdOutputPath}`,
  ]
    .join(" ")
    .trim();

  // console.log(`Run command: ${cmdProgram} ${cmdArgStr}`);
  console.log(`Run command: ffmpeg ${cmdArgStr}`);

  let recProcess = spawn("ffmpeg", cmdArgStr.split(/\s+/));
  recProcess.on("error", (err) => {
    console.error("Recording process error:", err);
  });

  recProcess.stdout.on("data", (data) =>
    console.log("ffmpeg::process::data [data:%o]", data)
  );

  recProcess.on("message", (message) =>
    console.log("ffmpeg::process::message [message:%o]", message)
  );

  recProcess.stderr.on("data", (data) =>
    console.log("ffmpeg::process::data [data:%o]", data)
  );

  recProcess.on("exit", (code, signal) => {
    console.log("Recording process exit, code: %d, signal: %s", code, signal);
    // stopMediasoupRtp();

    if (!signal || signal === "SIGINT") {
      console.log("Recording stopped");
    } else {
      console.warn(
        "Recording process didn't exit cleanly, output file might be corrupt"
      );
    }
  });

  // FFmpeg writes its logs to stderr
  recProcess.stderr.on("data", (chunk) => {
    chunk
      .toString()
      .split(/\r?\n/g)
      .filter(Boolean) // Filter out empty strings
      .forEach((line) => {
        console.log(line);
        if (line.startsWith("ffmpeg version")) {
          setTimeout(() => {
            recResolve();
          }, 1000);
        }
      });
  });


  if (useAudio) {
    _recordAudioConsumer.resume();
  }
  if (useVideo) {
    _recordVideoConsumer.resume();
  }

  return promise;
}

module.exports = {
  record
}