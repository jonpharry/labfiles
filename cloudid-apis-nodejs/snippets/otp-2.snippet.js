}).catch(e => {
  res.render('error', {
    message: "Something went wrong with OTP generation",
    status: "400"
  });
  console.log(e);
});
}
