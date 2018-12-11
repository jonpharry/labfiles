importClass(Packages.com.ibm.security.access.policy.decision.Decision);
importClass(Packages.com.ibm.security.access.policy.decision.HtmlPageDenyDecisionHandler);
importClass(Packages.com.ibm.security.access.policy.decision.RedirectDenyDecisionHandler);
importClass(Packages.com.ibm.security.access.policy.decision.HtmlPageChallengeDecisionHandler);
importClass(Packages.com.ibm.security.access.policy.decision.RedirectChallengeDecisionHandler);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.utilities);


IDMappingExtUtils.traceString("ACR Access Policy ENTRY");

var protocolContext = context.getProtocolContext();
var authContext = protocolContext.getAuthenticationRequest().getAuthenticationContext();
var acrList = authContext.getAuthenticationClassReference();

if ((acrList != null) && (acrList.contains("urn:demo:totp"))) {

  //If something needs to be logged into the trace.log use the IDMappingExtUtils.traceString() function.
  //To enable the trace, set the trace string to com.tivoli.am.fim.*:ALL
  IDMappingExtUtils.traceString("ACR requests TOTP");

  //Retrieve user context.
  var user = context.getUser();

  //Check the authenticationTypes that the user has performed, since we are about to challenge the user, we want to make sure that the user has not already completed the challenge
  var authenticationTypesAttribute = user.getAttribute("authenticationTypes");

  //Check is the authenticationTypesAttribute is not null, if it is null it means the user has not performed an authentication yet.
  if (authenticationTypesAttribute != null) {

   //If authenticationTypes Attribute is not null, we check if the user has performed the desired authentication, in this case a totp,

	var authenticationTypes = authenticationTypesAttribute.getValues()
        IDMappingExtUtils.traceString("Value: " + authenticationTypes);
        IDMappingExtUtils.traceString("Type: " + authenticationTypes.getClass().getName());
        
        var totpDone = false;

        // Check for TOTP when OP using single comma-separated attribute
        if (authenticationTypes.get(0).contains("urn:ibm:security:authentication:asf:totp")) {
          totpDone = true;
        }

        // Check for TOTP when OP using multi-valued attributes
        if (authenticationTypes.contains("urn:ibm:security:authentication:asf:totp")) {
          totpDone = true;
        }

        //If user has already performed TOTP, they are allowed to continue with the Single Sign on.
        if (totpDone) {
                IDMappingExtUtils.traceString("TOTP Already done");
    		context.setDecision(Decision.allow());

         //Otherwise we need to challenge for TOTP
	} else {

		    var handler = new RedirectChallengeDecisionHandler();
		    IDMappingExtUtils.traceString("CHALLENGE WITH TOTP");
		    handler.setRedirectUri("/sps/authsvc?PolicyId=urn:ibm:security:authentication:asf:totp&Target=https://www.op.ibm.com/mga@ACTION@");
  	    context.setDecision(Decision.challenge(handler));
        }
  } else {
	//If authenticationTypesAttribute is null it means the user has not performed the desired authentication, the user is asked to challenge or step up by completing a totp authentication.
	var handler = new RedirectChallengeDecisionHandler();
	IDMappingExtUtils.traceString("CHALLENGE WITH TOTP");
	handler.setRedirectUri("/sps/authsvc?PolicyId=urn:ibm:security:authentication:asf:totp&Target=https://www.op.ibm.com/mga@ACTION@");
  context.setDecision(Decision.challenge(handler));
  }
} else {
        IDMappingExtUtils.traceString("ACR doesn't request TOTP");
  	context.setDecision(Decision.allow());
}
