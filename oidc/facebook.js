importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);
importClass(Packages.com.ibm.security.access.httpclient.HttpClient);
importClass(Packages.com.ibm.security.access.httpclient.HttpResponse);
importClass(Packages.com.ibm.security.access.httpclient.Headers);
importClass(Packages.com.ibm.security.access.httpclient.Parameters);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.uuser);
importPackage(Packages.com.tivoli.am.fim.trustserver.sts.utilities);

IDMappingExtUtils.traceString("\noidc_rp advanced mapping rule called with stsuu:\n " + stsuu.toString() + "\n");

var attr = stsuu.getContextAttributes().getAttributeByName("access_token");
var access_token = attr.getValues()[0];

IDMappingExtUtils.traceString("\n*****Access Token Value:\n " + access_token.toString() + "\n");

var profileAttrToISAMCredAttrMap = {
		"first_name":"firstName",
		"last_name":"lastName",
		"email":"email"
};

var principalReam = "Facebook/"; // used as prefix for principal name
var resourceURL = "https://graph.facebook.com/v2.8/me?fields=first_name,last_name,email&access_token=";  // used to get user info
var resourceStr = resourceURL + access_token;
hrr = HttpClient.httpGet(resourceStr);
if (hrr != null) {
	var rc = hrr.getCode();
	IDMappingExtUtils.traceString("got a response code: " + rc);
	if (rc == 200) {
		var body = hrr.getBody();
		IDMappingExtUtils.traceString("got a response body: " + body);
		var rspJson = JSON.parse(body);

		var username = principalReam + rspJson.id;
		IDMappingExtUtils.traceString("got a id: " + username);
		IDMappingExtUtils.traceString("adding Attrs" );

    var email = rspJson["email"];
		if (email != null && email.length > 0) {
			IDMappingExtUtils.traceString("e-mail found.  Setting username to: " + email);
			stsuu.setPrincipalName(email);
		}
		else {
			IDMappingExtUtils.traceString("No e-mail found.  Setting username to: " + username);
			stsuu.setPrincipalName(username);
		}

		var idattr = new com.tivoli.am.fim.trustserver.sts.uuser.Attribute("FacebookID", "urn:ibm:names:ITFIM:5.1:accessmanager", rspJson.id);
		stsuu.addAttribute(idattr);

		for (key in rspJson) {
			var isamCredAttrName = profileAttrToISAMCredAttrMap[key];
			if (isamCredAttrName != null) {
				IDMappingExtUtils.traceString("mapping profile attribute: " + key + " to ISAM credential attribute: " + isamCredAttrName + " value: " + rspJson[key] );

				var attr = new com.tivoli.am.fim.trustserver.sts.uuser.Attribute(key, "urn:ibm:names:ITFIM:5.1:accessmanager", rspJson[key]);
				stsuu.addAttribute(attr);
			} else {
				IDMappingExtUtils.traceString("Skipping profile attribute: " + key + " because there is no mapping defined to an ISAM credential attribute." );
			}
		}

	}
}
