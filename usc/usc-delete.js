/*********************************************************************
 *   Licensed Materials - Property of IBM
 *   (C) Copyright IBM Corp. 2016. All Rights Reserved
 *
 *   US Government Users Restricted Rights - Use, duplication, or
 *   disclosure restricted by GSA ADP Schedule Contract with
 *   IBM Corp.
 *********************************************************************/

importClass(Packages.com.tivoli.am.fim.trustserver.sts.utilities.IDMappingExtUtils);
importPackage(Packages.com.ibm.security.access.scimclient);

IDMappingExtUtils.traceString("entry usc-delete-js");

var errors = [];
var stillok = true;

var scimConfig = context.get(Scope.SESSION, "urn:ibm:security:asf:policy", "scimConfig");

var username = context.get(Scope.SESSION, "urn:ibm:security:asf:response:token:attributes", "username");
var scimJson = null;

var id = ScimClient.computeIDForUsername(username);
IDMappingExtUtils.traceString("Loaded SCIM user/id: "+username+"/"+id);

/*
 * Get the SCIM user.
 */

function getUser(id) {
  var resp = ScimClient.httpGet(scimConfig, "/Users/"+id);
  var json = null;

  if (resp == null) {
    // Something went wrong.
    stillok = false;
    errors.push("An error occurred contacting the SCIM endpoint.");

  } else {
    IDMappingExtUtils.traceString("SCIM resp.getCode(): "+resp.getCode());
    IDMappingExtUtils.traceString("SCIM resp.getBody(): "+resp.getBody());

    if (resp.getCode() == 200) {
      // success!
      stillok = true;
    } else {
      var respJson = JSON.parse(resp.getBody());
      if (respJson && respJson.detail) {
        errors.push("SCIM API error: "+respJson.detail);
      } else {
        errors.push("An internal error occurred.");
      }
      stillok =false;
    }
    json = JSON.parse(resp.getBody());
  }

  return json;
}

if (username != null && username != "sec_master") {
  scimJson = stillok ? getUser(id) : null;
} else {
  stillok = false;
  errors.push("No user logged in.");
}

/*
 * Delete the User
 */

if (stillok == true) {
  IDMappingExtUtils.traceString("About to delete user");
  var resp = ScimClient.httpDelete(scimConfig, "/Users/"+id);
  if (resp == null) {

    // Something went wrong.
    stillok = false;
    errors.push("An error occurred contacting the SCIM endpoint.");
    IDMappingExtUtils.traceString("Response is null!");

  } else {
    IDMappingExtUtils.traceString("SCIM resp.getCode(): "+resp.getCode());
    IDMappingExtUtils.traceString("SCIM resp.getBody(): "+resp.getBody());

    if (resp.getCode() == 204) {
      IDMappingExtUtils.traceString("Successfully deleted user.");
      stillok = true;

    } else {
      IDMappingExtUtils.traceString("Failed to delete user.");

      var respJson = JSON.parse(resp.getBody());
      if (respJson && respJson.detail) {
        errors.push("SCIM API error: "+respJson.detail);
      } else {
        errors.push("An internal error occurred.");
      }

      stillok = false;
    }
  }
}

/*
 * Handle errors.
 */

function buildErrorString(errors) {
  var errorString = "";

  for (var error in errors) {
    if (errorString != "") errorString += "   ";
    errorString += "Error: "
    errorString += errors[error];
  }
  return errorString;
}

var errorString = buildErrorString(errors);
if (errorString.length != 0) {
  macros.put("@ERROR_MESSAGE@", errorString);
}

if (stillok == true) {
  /*
   * Set macros for success page
   */
   IDMappingExtUtils.traceString("populating macros:");
   IDMappingExtUtils.traceString("@OLD_USER@ = "+scimJson["userName"]);
   IDMappingExtUtils.traceString("@FIRSTNAME@ = "+scimJson["name"]["givenName"]);

   macros.put("@OLD_USER@", scimJson["userName"]);
   macros.put("@FIRSTNAME@", scimJson["name"]["givenName"])
   context.set(Scope.SESSION, "urn:ibm:security:asf:response:token:attributes", "username", "logged_out");
   IDMappingExtUtils.traceString("Returning SUCCESS");
}
else {
   IDMappingExtUtils.traceString("Returning ERROR");
   page.setValue("/authsvc/user_error.html");
}

success.endPolicyWithoutCredential();

IDMappingExtUtils.traceString("exit usc-delete.js");

