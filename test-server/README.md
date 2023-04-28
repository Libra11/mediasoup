<!--
 * @Author: Libra
 * @Date: 2023-04-28 14:16:03
 * @LastEditTime: 2023-04-28 14:17:15
 * @LastEditors: Libra
 * @Description:
-->

## 服务端 transport（mediasoup）：

服务端的 transport 主要负责处理 RTP、RTCP 和 SCTP 数据包的发送和接收。在 mediasoup 服务器端，有两种主要的 transport 类型：PlainTransport 和 WebRtcTransport。WebRtcTransport 是最常用的类型，它使用 DTLS 和 SRTP 加密进行安全传输，同时支持 ICE 连接建立。PlainTransport 用于 RTP/RTCP over UDP，它不支持加密和 ICE。

服务端的 transport 通常在 mediasoup 服务器上创建。当你创建一个新的 transport 时，你需要为其配置相关参数，如 listenIps 和可选的 initialAvailableOutgoingBitrate。创建 transport 后，你将与客户端共享 transport 的参数，以便客户端能够建立一个对应的 transport。

## createTransport

listenIps 是一个包含一个或多个 IP 地址的数组，这些 IP 地址用于告诉 mediasoup 在哪些网络接口上监听传入的 RTP 和 RTCP 数据包。listenIps 数组中的每个对象包含以下属性：

- ip：这是 mediasoup 实际在服务器上监听的 IP 地址。在多数情况下，这应该是服务器的公共 IP 地址或者是私有 IP 地址（如果服务器位于 NAT 环境中）。
- announcedIp：这是一个可选属性，用于指定 mediasoup 应在 SDP（Session Description Protocol）中宣告的 IP 地址。当服务器位于 NAT 环境中时，这个属性尤为重要，因为在这种情况下，服务器的公共 IP 地址与其实际监听的私有 IP 地址不同。如果没有指定 announcedIp，mediasoup 将在 SDP 中使用 ip 属性。

当在 listenIps 配置选项中设置多个监听地址时，mediasoup 服务器将在所有指定的 IP 地址上监听传入的 RTP 和 RTCP 数据包。这在某些场景下可能是有用的，比如：
当你的服务器有多个网络接口或者 IP 地址时，例如，一个公共 IP 地址和一个或多个私有 IP 地址。这样，mediasoup 可以在所有这些地址上监听，从而实现更好的网络连接和路由选择。
当你需要支持 IPv4 和 IPv6 双栈时，你可以在 listenIps 中同时设置 IPv4 和 IPv6 地址，这样 mediasoup 将在这两种地址类型上进行监听。

当你设置了多个监听地址时，这些地址将被包含在服务器向客户端发送的 SDP（会话描述协议）中。客户端的 WebRTC 实现将使用 ICE（交互式连接建立）协议来选择一个最佳的地址对（服务器地址和客户端地址），以建立最佳的网络连接。

```js
listenIps: [
// IPv4 public IP
{ ip: '203.0.113.1', announcedIp: null },
// IPv4 private IP (behind NAT)
{ ip: '192.168.1.10', announcedIp: '203.0.113.1' },
// IPv6 public IP
{ ip: '2001:0db8:85a3:0000:0000:8a2e:0370:7334', announcedIp: null },
],
```
