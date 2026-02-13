# MISReports_Api /misapi Application Troubleshooting

## Error: "Runtime Error" on http://10.128.1.126/misapi/api/areas

### Symptom
- Frontend shows: "Warning: Could not load data. The API server may be experiencing issues."
- Accessing `/misapi/api/areas` returns a 500 Runtime Error

### Root Cause Analysis

The `/misapi` IIS application on `http://10.128.1.126` is throwing an unhandled exception.

### Steps to Diagnose

#### 1. Check Application Pool Status (on 10.128.1.126)
```powershell
# As Administrator on the server
Get-WebAppPoolState -Name "misapi" -ErrorAction SilentlyContinue
# or
C:\Windows\System32\inetsrv\appcmd list apppool
```

#### 2. Check IIS Logs
Location: `C:\inetpub\logs\LogFiles\W3SVC[SITE_ID]\`
- Look for 500 errors
- Check the detailed status codes (e.g., 500.19, 500.21, etc.)

#### 3. Check Application Logs in Event Viewer
- Open Event Viewer → Windows Logs → Application
- Filter by Error level
- Look for errors from the /misapi application

#### 4. Check Application Directory
```powershell
# Check if /misapi physical path is accessible
Get-Item "D:\[path_to_misapi_app]"
# Check if web.config exists
Get-ChildItem "D:\[path_to_misapi_app]\web.config"
```

#### 5. Check Database Connection (Most Common Issue)
- Verify the connection string in `web.config` at the /misapi application root
- Test if the database server is accessible
- Check if database credentials are correct
- Verify SQL Server is running

### Solution Options

#### Option A: Enable Detailed Error Messages (for debugging only)
Edit `web.config` in the /misapi application root:
```xml
<system.web>
    <customErrors mode="Off" />
</system.web>
```
Restart the application pool, then check the error details.

#### Option B: Recycle Application Pool
```powershell
# As Administrator
C:\Windows\System32\inetsrv\appcmd recycle apppool /apppool.name:misapi
```

#### Option C: Check Database Connectivity
Common reasons for 500 errors in MIS APIs:
1. SQL Server is not running
2. Database connection string points to wrong server
3. Credentials in web.config are incorrect
4. Network access to database is blocked

**To test database connection**, check the web.config for connection strings and test:
```powershell
$connString = "Server=YOUR_SERVER;Database=YOUR_DB;User=YOUR_USER;Password=YOUR_PASS;"
# Test if database is reachable
```

### Workaround: Manual Data Entry

Until the API is fixed, users can:
1. Manually enter Area Code and Bill Cycle in the form
2. The application will attempt to fetch Solar Age Analysis data

### Permanent Fix Checklist

- [ ] Verify /misapi application exists in IIS on http://10.128.1.126
- [ ] Check that database server is running and accessible
- [ ] Verify web.config connection strings are correct
- [ ] Check application event logs for specific errors
- [ ] Restart application pool if needed
- [ ] Check file permissions on application directory
- [ ] Verify all dependencies (DLLs, NuGet packages) are deployed

## Quick Fix Command (if you have admin access)

```powershell
# Restart the misapi application pool
Start-Process -NoNewWindow -FilePath "C:\Windows\System32\inetsrv\appcmd" -ArgumentList "recycle apppool /apppool.name:misapi"

# Wait a few seconds
Start-Sleep -Seconds 3

# Test the endpoint
Invoke-WebRequest -Uri "http://10.128.1.126/misapi/api/areas" -UseBasicParsing
```

## Contact Information
If you need help from the backend team, provide them with:
1. Error logs from Event Viewer
2. The specific HTTP status code (500.x)
3. Stack trace from the application logs
