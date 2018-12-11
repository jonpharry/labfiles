importPackage(Packages.com.tivoli.am.fim.trustserver.sts);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.uuser);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.utilities);

//If something needs to be logged into the trace.log use the IDMappingExtUtils.traceString() function.
//To enable the trace, set the trace string to com.tivoli.am.fim.*:ALL
IDMappingExtUtils.traceString("\nACR OIDC RP advanced mapping rule called with stsuu:\n " + stsuu.toString() + "\n");

// Get the operation
var operation = stsuu.getContextAttributes().getAttributeValueByNameAndType("operation","urn:ibm:SAM:oidc:rp:operation");

if(operation == "authorize") {
  var traceString = "\n\tadv mapping at kickoff\n";
  // Authorize operation, so the kickoff url was just invoked

  //Do some useful tracing
  //Extract the authorize url:
  var authorize_url = stsuu.getContextAttributes().getAttributeValueByNameAndType("url", "urn:ibm:SAM:oidc:rp:authorize:uri");
  traceString += "\n url for /authorize will be: \n"
  traceString += authorize_url

  //Trace Authorize Request Parameters
  traceString += "\n OIDC authorize request parameters are: "
  var attributes = stsuu.getContextAttributes().getAttributesByType("urn:ibm:SAM:oidc:rp:authorize:req:param");
  for( var i in attributes) {
    var attr = attributes[i];
    traceString += "\n\trequest attribute name: " + attr.getName();
    traceString += "\n\trequest attribute value: " + attr.getValues()[0];
  }

  //Trace Kickoff URL Request Parameters
  traceString += "\n OIDC kickoff incoming request parameters are: "
  var attributes = stsuu.getContextAttributes().getAttributesByType("urn:ibm:SAM:oidc:rp:kickoff:param");
  for( var i in attributes) {
    var attr = attributes[i];
    traceString += "\n\tkickoff attribute name: " + attr.getName();
    traceString += "\n\tkickoff attribute value: " + attr.getValues()[0];
  }
  IDMappingExtUtils.traceString(traceString);

  //Get level parameter from query-string of the kickoff URL
  var myLevels = stsuu.getContextAttributes().getAttributeValuesByName("level");

  //If it is set, get the value
  if ((myLevels != null) && (myLevels.length > 0)) {
    var myLevel = myLevels[0];
    IDMappingExtUtils.traceString("Level: " + myLevel);

    //Send ACR of password...
    var myAcr = "urn:demo:password";

    //...Unless level is 2, in which case send ACR of totp
    if (myLevel == "2") {
      myAcr = "urn:demo:totp";
    }

    // Add the ACR value to "acr_values" in OIDC request
    stsuu.getContextAttributes().setAttribute(new Attribute("acr_values", "urn:ibm:SAM:oidc:rp:authorize:req:param", myAcr));
  }
}

// Request that authenticationTypes be returned by the OP (so we will know what authentication user has done)
var claims = { "id_token": {
    "authenticationTypes": {"essential": false}
  }
};
stsuu.addContextAttribute(new Attribute("claims", "urn:ibm:SAM:oidc:rp:authorize:req:param", JSON.stringify(claims)));

IDMappingExtUtils.traceString("\noidc_rp advanced mapping rule finished with stsuu:\n " + stsuu.toString() + "\n");
