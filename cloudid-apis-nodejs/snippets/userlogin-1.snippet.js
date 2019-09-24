// Call CI to check username and password
// If username and password good, id in response will contain
// CI user ID for authenticated user.
ci.passwordLogin(req.body.username, req.body.password).then((userJson) => {
  // Attempt to populate session with id from response
