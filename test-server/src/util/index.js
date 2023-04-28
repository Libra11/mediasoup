/*
 * @Author: Libra
 * @Date: 2023-04-28 11:21:02
 * @LastEditTime: 2023-04-28 15:42:47
 * @LastEditors: Libra
 * @Description: util function
 */
function getIPAddress() {
  let interfaces = require("os").networkInterfaces();
  for (var devName in interfaces) {
    var iface = interfaces[devName];
    for (var i = 0; i < iface.length; i++) {
      let alias = iface[i];
      if (
        alias.family === "IPv4" &&
        alias.address !== "127.0.0.1" &&
        !alias.internal
      ) {
        return alias.address;
      }
    }
  }
}
async function socketPromise(socket, event, data) {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (res, error) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}

module.exports = {
  getIPAddress,
  socketPromise,
};
