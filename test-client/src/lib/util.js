/*
 * @Author: Libra
 * @Date: 2023-04-29 19:18:55
 * @LastEditTime: 2023-04-29 19:20:12
 * @LastEditors: Libra
 * @Description: util
 */
async function socketPromise(socket, event, data) {
  return new Promise((resolve, reject) => {
    socket.emit(event, data, (res, error) => {
      if (error) {
        reject(error)
      } else {
        resolve(res)
      }
    })
  })
}

export { socketPromise }
