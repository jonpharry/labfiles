// Handle GET request for login page
router.get('/', function(req, res, _next) {
  // Call to CI to initiate QRCode Login flow
  ci.initiateQRLogin(reg_id).then((qrTxn) => {
    // Store the response in session.  Needed for validation.
    req.session.qrtxn = qrTxn;
    // Render the login page.  The QR Code image is sent (base64 encoded)
    // in qrCode.  It is rendered directly on the page.
    res.render('userlogin', {
      title: 'Login',
      qrCode: qrTxn.qrCode
    });
  });
});
