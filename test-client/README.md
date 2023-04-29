<!--
 * @Author: Libra
 * @Date: 2023-04-26 18:50:03
 * @LastEditTime: 2023-04-29 19:49:42
 * @LastEditors: Libra
 * @Description:
-->

      /**
       * dtlsParameters 是在 WebRTC 连接过程中，用于传递 DTLS 相关信息的一个对象。它包含了 DTLS 连接所需的关键参数，如指纹（fingerprint）和角色（role）。指纹是 DTLS 证书的哈希值，用于确保证书的完整性和真实性。角色定义了在 DTLS 握手过程中的主动（client）和被动（server）方。

        在 mediasoup 中，dtlsParameters 用于在客户端（如浏览器）和 mediasoup 服务器之间建立安全的 WebRTC 连接。当你创建一个服务端 transport（例如，WebRtcTransport）时，mediasoup 将生成相应的 dtlsParameters。你需要将这些参数传递给客户端，以便客户端在创建 SendTransport 和 RecvTransport 时使用这些参数建立与 mediasoup 服务器的 DTLS 连接。
       */
