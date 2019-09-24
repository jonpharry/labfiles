// Call CI to validate the submitted OTP value
// This Response from initation is supplied.  It contains the
// transaction ID needed for validation.
ci.validateOTP(req.session.otpInitResponse, req.body.otp).then(body => {

  // If a good response was received
  if (body.messageDescription) {
    // If response message contains "successful"
    if (body.messageDescription.search("successful") != -1) {
      // Clean up session data
      delete req.session.otpInitResponse
