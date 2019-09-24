  }).catch(e => {
    res.render('error', {
      message: "Something went wrong",
      status: "500"
    });
    console.log("Error: " + e.error);
  });
