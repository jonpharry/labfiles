#!/bin/bash

# Get directory for this script
RUNDIR="`dirname \"$0\"`"         # relative
RUNDIR="`( cd \"$RUNDIR\" && pwd )`"  # absolutized and normalized
if [ -z "$RUNDIR" ] ; then
  echo "Failed to get local path"
  exit 1  # fail
fi

# OpenLDAP Docker Container
OPENLDAP="iamlab_openldap_1"

# Run LDAP Modify against OpenLDAP
docker exec -i ${OPENLDAP} ldapmodify -H "ldaps://localhost:636" -D "cn=root,secAuthority=Default" -w "Passw0rd" -c < ${RUNDIR}/updateEmail.ldif

echo Done.
