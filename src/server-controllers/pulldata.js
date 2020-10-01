const request = require('request');

const API_URL = process.env.MYEEM_API_URL;
const username = process.env.MYEEM_API_USERNAME;
const password = process.env.MYEEM_API_PASSWORD;
const auth = `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`;
const options = {
  headers: {
    Authorization: auth,
  },
};

function pullCMDetails(req, res, next) {
  try {
    request.get(`${API_URL}/api/pullcmdetails/${req.params.partnercode}`, options, (error, response, body) => {
      if (!error && response.statusCode === 200) {
        const result = JSON.parse(body);
        if (result.data.length > 0) {
          request.get(`${API_URL}/api/pullproductdetails/${req.params.partnercode}`, options, (errorp, responsep, bodyp) => {
            if (!error && response.statusCode === 200) {
              const resultp = JSON.parse(bodyp);
              result.productData = resultp.data;
              res.send(result);
            } else {
              next(error);
            }
          });
        } else {
          res.send(result);
        }
      } else {
        next(error);
      }
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  pullCMDetails,
};
