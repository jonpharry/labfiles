} else { // Message doesn't contain "successful".  OTP Fail.
  res.render('error', {
    message: "OTP Validation failed",
    status: "400"
  });
}
} else { // Bad response from server
res.render('error', {
  message: "OTP Validation failed",
  status: "500"
});
}
}).catch(e => {
res.render('error', {
message: "Something went wrong",
status: "500"
});
console.log("Error: " + e.error);
});
