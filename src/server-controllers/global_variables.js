const HttpsProxyAgent = require('https-proxy-agent');

exports.createProxyAgent = () => {
  let proxyAgent;
  if (process.env.NODE_ENV === 'development') {
      // HTTP/HTTPS proxy to connect to
    const proxy = process.env.PROXY;
    console.log('Using proxy server: %s', proxy);
      // create an instance of the `HttpsProxyAgent` class with the proxy server information
    proxyAgent = new HttpsProxyAgent(proxy);
  }
  return proxyAgent;
};
