exports.elancopartnerlogin = (req, res) => {
  global.appServer.locals.title = 'myEEM Login';
  const janrainenv = process.env.JANRAINENV;
  res.render('login', { data: janrainenv });
};
exports.elancopartnerregistration = (req, res) => {
  const janrainenv = process.env.JANRAINENV;
  res.render('registration', { data: janrainenv });
};
