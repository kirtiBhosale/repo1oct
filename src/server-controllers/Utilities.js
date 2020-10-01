const HttpsProxyAgent = require('proxy-agent');

 function createProxyAgent() {
  let proxyAgent;
  if (process.env.NODE_ENV === 'development') {
    // const HttpsProxyAgent = require('https-proxy-agent');
    // HTTP/HTTPS proxy to connect to
    const proxy = process.env.PROXY;
    console.log('Using proxy server: %s', proxy);
    // create an instance of the `HttpsProxyAgent` class with the proxy server information
    proxyAgent = new HttpsProxyAgent(proxy);
  }
  return proxyAgent;
}

 function externalLandingPage() {
  this.title = '';
  this.logo = '';
  this.url = '';
  this.description = '';
  this.isComingSoon = '';
  this.displaysection = '';
}

exports.createProxyAgent=createProxyAgent;
exports.externalLandingPage=externalLandingPage;