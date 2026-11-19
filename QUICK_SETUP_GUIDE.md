# Android Release Distribution Setup

This guide covers the Android APK release workflow in
[`.github/workflows/release-apk.yml`](./.github/workflows/release-apk.yml) and its
Cloudflare R2 storage. The API also serves the current manifest at
`/api/v1/app/update/latest.json`.

> **Repository prerequisite:** This checkout does not contain the `android-app/`
> source directory that the workflow builds. Make sure the Android project is
> present on the release branch before running the workflow.

## Prerequisites

- Access to this repository's GitHub Actions settings.
- A Cloudflare R2 bucket and an R2 API token with read/write access to that bucket.
- The production Android signing keystore and its passwords. Use the same
  keystore as previous production releases; a different signing key prevents
  existing installations from accepting updates.
- The Android project under `android-app/`.

## Configure GitHub Actions

Add these repository Actions secrets:

| Secret | Required | Purpose |
| --- | --- | --- |
| `R2_ENDPOINT` | Yes | S3-compatible endpoint, such as `https://<account-id>.r2.cloudflarestorage.com`. |
| `R2_ACCESS_KEY_ID` | Yes | R2 API token access key. |
| `R2_SECRET_ACCESS_KEY` | Yes | R2 API token secret. |
| `RELEASE_KEYSTORE_BASE64` | Yes | Base64-encoded production keystore. |
| `RELEASE_KEY_ALIAS` | Yes | Signing key alias. |
| `RELEASE_STORE_PASSWORD` | Yes | Keystore password. |
| `RELEASE_KEY_PASSWORD` | Yes | Signing key password. |
| `R2_BUCKET_NAME` | No | Bucket name; defaults to `swayog-dashboard`. |
| `R2_PUBLIC_URL` | No | Public CDN/custom-domain base URL for APK downloads. |
| `PUBLIC_DISTRIBUTION_URL` | No | Public download base URL fallback. |
| `API_BASE_URL` | No | API base URL; defaults to the production API. |
| `WS_BASE_URL` | No | WebSocket base URL; defaults to the production host. |
| `WEB_DOMAIN` | No | Web application URL used in release metadata. |

If `PRODUCTION_CERT_SHA256` is configured as a repository Actions variable, the
workflow checks the release certificate against it.

Store secrets in GitHub Actions settings only. Do not commit keystores,
credentials, or populated environment files to the repository.

## Configure R2

1. Create a bucket or select the bucket configured by `R2_BUCKET_NAME`.
2. Create an R2 API token restricted to that bucket, with object read/write
   permissions.
3. Set `R2_ENDPOINT`, `R2_ACCESS_KEY_ID`, and `R2_SECRET_ACCESS_KEY` in GitHub
   Actions secrets.
4. If APKs should be served through a public CDN or custom domain, configure it
   and set its base URL in `R2_PUBLIC_URL` or `PUBLIC_DISTRIBUTION_URL`.

Keep the bucket private when using presigned download URLs. Public access is
only needed when intentionally serving files through a public distribution
domain.

The release script uploads the versioned APK under
`releases/android/{versionName}/build-{versionCode}/app-release.apk`, plus the
latest APK and manifest objects used for compatibility.

## Run a release

The workflow runs on pushes to `main` that change Android or release-related
files, and it can also be started manually:

1. Open the repository's **Actions** tab and select **Build and Deploy Android
   Release APK**.
2. Select **Run workflow**.
3. Optionally enter a version name, version code, minimum supported version,
   mandatory-update flag, and release notes. Leave version fields blank to use
   automatic version calculation.
4. Monitor the job through signing, APK build, R2 upload, manifest validation,
   and release publication.

Do not create a tag or commit secrets to trigger a release. The workflow
validates the APK and manifest and creates the release tag after publishing.

## Verify the published update

```sh
curl --fail --show-error https://swayog-dashboard.vercel.app/api/v1/app/update/latest.json
```

Confirm the response contains the expected `versionCode`, `versionName`,
`apkUrl`, and 64-character SHA-256 checksum. If `apkUrl` points to a public
distribution domain, check that the URL is reachable. If it is a presigned R2
URL, verify that it downloads the APK before the signature expires.

## Troubleshooting

- **Workflow cannot find Android files:** ensure `android-app/` is present on
  the branch being built.
- **Signing step fails:** check that all four signing secrets are correct and
  that the keystore matches the production certificate.
- **R2 upload or verification fails:** check the endpoint, bucket name, and
  token permissions. The configured token must allow the workflow to write and
  read release objects.
- **Manifest endpoint returns an error:** verify that the manifest was uploaded
  and that the backend has access to the same R2 bucket.
- **APK URL cannot be opened:** check the CDN configuration or verify that the
  presigned URL has not expired.

See the [backend setup guide](./backend/README.md) for configuring R2 access for
the API, and [API endpoint documentation](./API_ENDPOINTS_DOCUMENTATION.md) for
the update-manifest route.