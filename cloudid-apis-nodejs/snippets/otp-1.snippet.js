// Call CI to initiate OTP.  This will send OTP.
// Response contains information required for validation
ci.generateOTP(method, destination).then(body => {

  // Extract hint from response
  var hint = body.correlation;

  // If no hint, this means the OTP send failed
  if (!(hint)) {
    res.render('error', {
      message: "Something went wrong with OTP generation.",
      status: "400"
    });
  } else { // We got a good response
    // Store the response in session.  It is needed for validation.
    req.session.otpInitResponse = body;
