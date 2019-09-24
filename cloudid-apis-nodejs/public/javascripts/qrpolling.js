function processResponse() {
  if(req.readyState == 4) {
    if(req.status == 200) {
      var jsonResponse = JSON.parse(req.responseText);
      if(jsonResponse && jsonResponse.state != null) {
          var state = jsonResponse.state;
          if (state != 'SUCCESS') {
            // re-poll after a short wait
            setTimeout(startPolling, 1000);
          } else {
            // we must have an answer - get the browser moving again
            window.location.href = "/" + jsonResponse.next;
          }
      } else {
        // Error handling for invalid response
      }
     } else {
        // Error handling for non-200 response
     }
   } else {
        // Error handling for unexpected readyState
   }
 }

 function startPolling() {
  req = new XMLHttpRequest();
  req.onreadystatechange = processResponse;
  req.open("GET", "/userlogin/qrcheck", true);
  req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
  req.setRequestHeader("Accept", "application/json;charset=UTF-8");
  req.send();
 }

 startPolling()
