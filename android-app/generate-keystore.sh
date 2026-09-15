#!/bin/bash

# Script to generate Android release keystore and provide base64 encoding
# This should be run in the android-app directory

echo "=========================================="
echo "Android Release Keystore Generator"
echo "=========================================="
echo ""

# Check if keytool is available
if ! command -v keytool &> /dev/null; then
    echo "Error: keytool not found. Please ensure Java JDK is installed and in PATH."
    exit 1
fi

# Default values
KEYSTORE_NAME="release-key.jks"
KEY_ALIAS="swayog-release-key"
KEY validity=10000

echo "This script will generate a release keystore for signing your Android APK."
echo "Please provide the following information:"
echo ""

# Prompt for keystore password
read -sp "Enter keystore password (min 6 characters): " KEYSTORE_PASSWORD
echo ""
read -sp "Confirm keystore password: " KEYSTORE_PASSWORD_CONFIRM
echo ""

if [ "$KEYSTORE_PASSWORD" != "$KEYSTORE_PASSWORD_CONFIRM" ]; then
    echo "Error: Passwords do not match."
    exit 1
fi

if [ ${#KEYSTORE_PASSWORD} -lt 6 ]; then
    echo "Error: Password must be at least 6 characters."
    exit 1
fi

# Prompt for key password
read -sp "Enter key password (min 6 characters, or press Enter to use same as keystore): " KEY_PASSWORD
echo ""

if [ -z "$KEY_PASSWORD" ]; then
    KEY_PASSWORD="$KEYSTORE_PASSWORD"
fi

if [ ${#KEY_PASSWORD} -lt 6 ]; then
    echo "Error: Password must be at least 6 characters."
    exit 1
fi

# Prompt for certificate information
echo ""
echo "Certificate Information:"
read -p "First and Last Name: " DNAME_CN
read -p "Organizational Unit: " DNAME_OU
read -p "Organization: " DNAME_O
read -p "City or Locality: " DNAME_L
read -p "State or Province: " DNAME_ST
read -p "Country Code (2 letters): " DNAME_C

# Generate the keystore
echo ""
echo "Generating keystore..."
keytool -genkey -v -keystore "$KEYSTORE_NAME" \
    -alias "$KEY_ALIAS" \
    -keyalg RSA \
    -keysize 2048 \
    -validity $KEY_VALIDITY \
    -storepass "$KEYSTORE_PASSWORD" \
    -keypass "$KEY_PASSWORD" \
    -dname "CN=$DNAME_CN, OU=$DNAME_OU, O=$DNAME_O, L=$DNAME_L, ST=$DNAME_ST, C=$DNAME_C"

if [ $? -ne 0 ]; then
    echo "Error: Failed to generate keystore."
    exit 1
fi

echo ""
echo "✅ Keystore generated successfully: $KEYSTORE_NAME"

# Generate base64 encoding
echo ""
echo "Generating base64 encoding for GitHub Secrets..."
BASE64_KEYSTORE=$(base64 -i "$KEYSTORE_NAME")

echo ""
echo "=========================================="
echo "ADD THESE TO YOUR GITHUB SECRETS:"
echo "=========================================="
echo ""
echo "RELEASE_KEYSTORE_BASE64:"
echo "$BASE64_KEYSTORE"
echo ""
echo "RELEASE_KEY_ALIAS: $KEY_ALIAS"
echo "RELEASE_STORE_PASSWORD: $KEYSTORE_PASSWORD"
echo "RELEASE_KEY_PASSWORD: $KEY_PASSWORD"
echo ""
echo "=========================================="
echo "IMPORTANT SECURITY NOTES:"
echo "=========================================="
echo "1. Keep the keystore file ($KEYSTORE_NAME) secure and backed up"
echo "2. Never commit the keystore or passwords to git"
echo "3. Store these secrets in GitHub repository settings"
echo "4. If you lose this keystore, you won't be able to update existing installations"
echo ""
echo "=========================================="
echo "NEXT STEPS:"
echo "=========================================="
echo "1. Add the above secrets to GitHub: Settings → Secrets and variables → Actions"
echo "2. Keep the keystore file locally for future builds"
echo "3. Create a git tag to trigger your first release"
echo "=========================================="