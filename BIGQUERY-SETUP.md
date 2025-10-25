# BigQuery Setup for Render Deployment

## Overview

The Route Analysis Dashboard includes BigQuery integration for fetching live data. However, BigQuery requires Google Cloud authentication which needs to be configured separately.

## Authentication Options

### Option 1: Service Account (Recommended for Production)

1. **Create a Service Account** in Google Cloud Console:
   - Go to [IAM & Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Create a new service account with BigQuery permissions
   - Download the JSON key file

2. **Add to Render**:
   - Go to your Render dashboard → Environment
   - Add environment variable:
     ```
     GOOGLE_APPLICATION_CREDENTIALS=/etc/secrets/service-account.json
     ```
   - Upload the JSON key file as a secret file

3. **Update `render.yaml`** (if needed):
   ```yaml
   envVars:
     - key: GOOGLE_APPLICATION_CREDENTIALS
       sync: false  # Set manually in Render dashboard
   ```

### Option 2: Application Default Credentials (Local Development)

For local development, run:
```bash
gcloud auth application-default login
```

This authenticates using your personal Google Cloud credentials.

## Current Status

- ✅ **CSV Upload**: Works without BigQuery
- ✅ **CSV Merge**: Works without BigQuery  
- ✅ **Returns Analysis**: Works on uploaded CSVs
- ⚠️ **BigQuery Fetch**: Requires authentication setup

## Error Messages

If you see:
```
BigQuery authentication not configured. Please contact your administrator to set up Google Cloud credentials.
```

This means the service account credentials are not configured on Render.

## Workaround

Until BigQuery is configured, you can:
1. Download data manually from BigQuery
2. Upload the CSV via the "Nash CSV" tab
3. Run any analysis on the uploaded file

## Support

For help setting up BigQuery credentials, contact your Google Cloud administrator or refer to:
- [Google Cloud Service Accounts](https://cloud.google.com/iam/docs/service-accounts)
- [BigQuery Authentication](https://cloud.google.com/bigquery/docs/authentication)
