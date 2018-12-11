importPackage(Packages.com.tivoli.am.fim.trustserver.sts);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.uuser);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.utilities);

//If something needs to be logged into the trace.log use the IDMappingExtUtils.traceString() function.
//To enable the trace, set the trace string to com.tivoli.am.fim.*:ALL
IDMappingExtUtils.traceString("ACR OIDC RP mapping rule called with stsuu: " + stsuu.toString());

/*
 * Construct a basic identity made up of iss and sub
 */
var iss = stsuu.getAttributeContainer().getAttributeValueByName("iss");
var sub = stsuu.getAttributeContainer().getAttributeValueByName("sub");

/*
 * Build local username from subject received from OP.
 * Format is OIDC/<OP User>
 */
stsuu.setPrincipalName("OIDC/" + sub);

/*
 * Attributes from id_token come as Attributes - copy those we want to AttributeList
 * to be built into the credential. You can add to this list if you know what is in
 * the id_token you expect. Only those with values will be copied.
 */
var attrNames = [
	// authenticationTypes added to the received attribute to be added to credential
	"given_name",
	"family_name",
	"name",
	"email",
	"access_token",
	"authenticationTypes"
];


/*
 * We will build a finalAttrs list from incoming token.
 * Then we will clear the token and re-populate with only finalAttrs.
 */
var finalAttrs = [];

for (var i = 0; i < attrNames.length; i++) {
	var attr = stsuu.getAttributeContainer().getAttributeByName(attrNames[i]);
	if (attr != null) {
		finalAttrs.push(attr);
	}
}

//Clear the attribute list
stsuu.clearAttributeList();

/*
 * Add back in the final attributes
 */
for (var i = 0; i < finalAttrs.length; i++) {
	stsuu.addAttribute(finalAttrs[i]);
}

IDMappingExtUtils.traceString("oidc_rp mapping rule finished with new stsuu: " + stsuu.toString());
