// SAM SAML 2.0 IdP Mapping rule
// for use with IBM Cloud Identity "Access Manager as an Identity Source" Cookbook
importClass(Packages.com.tivoli.am.fim.trustserver.sts.uuser.Attribute);
importClass(Packages.com.tivoli.am.fim.trustserver.sts.uuser.AttributeStatement);

// Replace yourtenantid with your own Cloud Idenity Tenant ID.
// This will be used to generate an e-mail style User ID
var tenantid = "yourtenantid";


// Method for converting JavaScript array into Java array.
// This is used for building Java Array needed for multi-value SAML Attribute.
function jsToJavaArray(jsArray) {
  var javaArray = Packages.java.lang.reflect.Array.newInstance(java.lang.String, jsArray.length);
  for (var i = 0; i < jsArray.length; i++) {
    javaArray[i] = jsArray[i];
  }
  return javaArray;
}

// Get username from incoming principal name (ISAM Username)
var username = stsuu.getPrincipalName();

// Set qualified_username to form <tenantid>/<username>
var qualified_username = tenantid + "/" + username;

var groups = [];

// For each SAM group the user belongs to
for (var it = stsuu.getGroups(); it.hasNext();) {
  var group = it.next();
  var name  = group.getName();

  // If SAM group is IBMCloudIdentityAdmins
  if ("IBMCloudIdentityAdmins" == name) {
    // Send group "admin" in SAML which is CIC Administrators group.
    groups.push("admin")

  // If SAM group is admin
  } else if ("admin" == name) {
     // Do nothing (we don't want to send admin group to CIC)

  // For all other groups
  } else {
  // Send group name as it is in SAML to IBM Cloud Identity.
      groups.push(name);
  }
}

// Start with an empty group of attributes.
var finalAttrs = [];

// Build saas_userid with form <username>@<tenantID>.ice.ibmcloud.com
var saas_userid = username + "@" + tenantid + ".ice.ibmcloud.com";
finalAttrs.push(new Attribute("saas_userid", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", saas_userid));

// Get the user description (which container e-mail and mobile number).
var description = stsuu.getAttributeContainer().getAttributeValueByName("description");

if (description != null) {
  // Get the first part of the description - before space - as the e-mail address.
  var email = description.substring(0,description.indexOf(" "));

  // If we got an e-mail address, add it to final Attributes as "email"
  if (email != null) {
      finalAttrs.push(new Attribute("email", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", email));
  }

  // Get the second part of the description - after space - as the mobile number.
  var mobile = description.substring(description.indexOf(" "));

  // If we got a mobile number, add it to final Attributes as "mobile_number"
  if (mobile != null) {
      finalAttrs.push(new Attribute("mobile_number", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", mobile));
  }
}

// Set given_name from commonName
var given_name = stsuu.getAttributeContainer().getAttributeValueByName("commonName");
finalAttrs.push(new Attribute("given_name", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", given_name));

// Set family_name from familyName
var family_name = stsuu.getAttributeContainer().getAttributeValueByName("familyName");
finalAttrs.push(new Attribute("family_name", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", family_name));

// Build displayName from commonName and Surname and then add it to attributes as "displayName"
finalAttrs.push(new Attribute("displayName", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", given_name + " " + family_name));

// Set the AuthnContextClassRef element of the SAML assertion to PasswordProtectedTransport.
finalAttrs.push(new Attribute("AuthnContextClassRef", "urn:oasis:names:tc:SAML:2.0:assertion", "urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport"));

// Set the "group" attribute of the SAML assertion to the modified group list.
finalAttrs.push(new Attribute("groups", "urn:oasis:names:tc:SAML:2.0:attrname-format:basic", jsToJavaArray(groups)));

//Clear the working object.  We will explicitly add back everything we waant to send in the SAML to CIC.
stsuu.clear();

// Set the NameID attribute of the SAML assertion to the generated qualified_username
stsuu.addPrincipalAttribute(new Attribute("name", "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress", qualified_username));

// Add attributes from finaAttrs
for (var i = 0; i < finalAttrs.length; i++) {
	stsuu.addAttribute(finalAttrs[i]);
}

// Done.
