# Swagger UI Integration Guide

This guide explains how to set up and use the OpenAPI specification with Swagger UI and other tools.

## Option 1: Swagger UI Online

View the API documentation instantly without any setup:

1. Go to **https://editor.swagger.io/**
2. Click **File** → **Import File**
3. Select `docs/notifications/openapi.yaml` from your repository
4. The interactive documentation will load instantly

Or use the direct URL:
- Copy the raw OpenAPI YAML from GitHub
- Paste at https://editor.swagger.io/

## Option 2: Self-Hosted Swagger UI

### Docker Compose Setup

Add to your `docker-compose.yml`:

```yaml
swagger:
  image: swaggerapi/swagger-ui:latest
  ports:
    - "8080:8080"
  volumes:
    - ./docs/notifications/openapi.yaml:/usr/share/nginx/html/api/openapi.yaml
  environment:
    - SWAGGER_JSON=/usr/share/nginx/html/api/openapi.yaml
    - URLS_PRIMARY_NAME=Notification API
    - URLS_PRIMARY_URL=/api/openapi.yaml
  depends_on:
    - api
```

Then run:
```bash
docker-compose up swagger
```

Access at: http://localhost:8080

### Node.js Setup

Using `swagger-ui-express`:

```typescript
// api/swagger.ts
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';
import fs from 'fs';

const openApiFile = fs.readFileSync(
  './docs/notifications/openapi.yaml',
  'utf-8'
);
const openApiSpec = yaml.load(openApiFile);

export function setupSwagger(app: Express) {
  app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(openApiSpec, {
      customCss: '.topbar { display: none }',
      customSiteTitle: 'Massava Notification API',
      swaggerOptions: {
        persistAuthorization: true,
        displayOperationId: true,
        displayRequestDuration: true,
      }
    })
  );
}
```

Then in your main app file:

```typescript
import { setupSwagger } from './api/swagger';

const app = express();
setupSwagger(app);
app.listen(3000);
```

Access at: http://localhost:3000/api-docs

## Option 3: Integration with Next.js

Create a dynamic route for serving the OpenAPI spec:

```typescript
// app/api/openapi.json/route.ts
import { NextResponse } from 'next/server';
import fs from 'fs';
import yaml from 'js-yaml';

export async function GET() {
  const openApiYaml = fs.readFileSync(
    './docs/notifications/openapi.yaml',
    'utf-8'
  );
  const openApiSpec = yaml.load(openApiYaml) as Record<string, unknown>;

  return NextResponse.json(openApiSpec);
}
```

Then add Swagger UI to a page:

```typescript
// app/docs/api/page.tsx
'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocs() {
  return (
    <div style={{ padding: '20px' }}>
      <SwaggerUI
        url="/api/openapi.json"
        persistAuthorization={true}
        deepLinking={true}
        displayOperationId={true}
        displayRequestDuration={true}
      />
    </div>
  );
}
```

Access at: http://localhost:3000/docs/api

## Option 4: Static HTML Generation

Generate a standalone HTML file:

```bash
# Install swagger-ui
npm install swagger-ui-dist

# Create HTML file
cat > docs/notifications/swagger.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <title>Notification API - Swagger UI</title>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" type="text/css" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui.css">
  <style>
    html {
      box-sizing: border-box;
      overflow: -moz-scrollbars-vertical;
      overflow-y: scroll;
    }
    *, *:before, *:after {
      box-sizing: inherit;
    }
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-bundle.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@3/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: './openapi.yaml',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: 'BaseLayout'
      })
      window.ui = ui
    }
  </script>
</body>
</html>
EOF
```

Access the file in your browser: `file:///{absolute_path}/docs/notifications/swagger.html`

## Alternative Tools

### ReDoc

Interactive documentation with a different UI style:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Notification API - ReDoc</title>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body>
  <redoc spec-url='./openapi.yaml'></redoc>
  <script src="https://cdn.jsdelivr.net/npm/redoc@latest/bundles/redoc.standalone.js"></script>
</body>
</html>
```

### Postman

1. Open **Postman**
2. Click **File** → **Import**
3. Select **Link** tab
4. Paste GitHub raw URL to `openapi.yaml`
5. Click **Import**

Collection will be created automatically for all endpoints.

### VS Code REST Client

Create `.rest` files for testing:

```rest
@baseUrl = http://localhost:3000
@token = YOUR_JWT_TOKEN

### List Notifications
GET {{baseUrl}}/api/notifications?limit=20
Authorization: Bearer {{token}}

### Register Device
POST {{baseUrl}}/api/notifications/devices
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "platform": "IOS",
  "deviceName": "iPhone 15"
}

### Get Preferences
GET {{baseUrl}}/api/notifications/preferences
Authorization: Bearer {{token}}

### Update Preferences
PATCH {{baseUrl}}/api/notifications/preferences
Authorization: Bearer {{token}}
Content-Type: application/json

{
  "quietHoursEnabled": true,
  "quietHoursStart": "22:00",
  "quietHoursEnd": "08:00"
}

### Stream Notifications
GET {{baseUrl}}/api/notifications/stream
Authorization: Bearer {{token}}
```

## API Testing

### Using cURL with Swagger Export

```bash
# Export API definition
curl -s http://localhost:3000/api/openapi.json > openapi.json

# Test specific endpoint
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Using httpie

```bash
# List notifications
http -A bearer -a YOUR_TOKEN http://localhost:3000/api/notifications

# Create notification (admin)
http POST http://localhost:3000/api/notifications \
  "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  userId=user123 \
  type=BOOKING_CONFIRMED \
  title="Booking Confirmed" \
  body="Your booking has been confirmed"

# Register device
http POST http://localhost:3000/api/notifications/devices \
  "Authorization: Bearer YOUR_TOKEN" \
  token="exampleToken123456789" \
  platform=IOS \
  deviceName="iPhone 15"
```

## Continuous Integration

### GitHub Actions

```yaml
name: OpenAPI Validation

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Validate OpenAPI Spec
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install OpenAPI CLI
        run: npm install -g @openapitools/openapi-generator-cli

      - name: Validate YAML
        run: |
          npm install -g swagger-cli
          swagger-cli validate docs/notifications/openapi.yaml

      - name: Check for breaking changes
        run: |
          npm install -g openapi-diff
          openapi-diff docs/notifications/openapi.yaml docs/notifications/openapi.yaml
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

npm install -g swagger-cli
swagger-cli validate docs/notifications/openapi.yaml

if [ $? -ne 0 ]; then
  echo "OpenAPI spec validation failed"
  exit 1
fi

exit 0
```

## Documentation Generation

### Generate Markdown

```bash
npm install -g openapi-generator-cli

openapi-generator-cli generate \
  -i docs/notifications/openapi.yaml \
  -g markdown \
  -o docs/notifications/generated-md
```

### Generate TypeScript Client

```bash
openapi-generator-cli generate \
  -i docs/notifications/openapi.yaml \
  -g typescript-axios \
  -o lib/api/generated-client
```

### Generate OpenAPI HTML

```bash
npm install -g redoc-cli

redoc-cli bundle \
  docs/notifications/openapi.yaml \
  -o docs/notifications/api-docs.html \
  --title "Notification API Documentation"
```

## Testing with Generated Clients

### TypeScript/JavaScript

```typescript
import { NotificationsApi } from './lib/api/generated-client';
import { Configuration } from './lib/api/generated-client';

const config = new Configuration({
  apiKey: 'YOUR_JWT_TOKEN',
  basePath: 'http://localhost:3000'
});

const api = new NotificationsApi(config);

// List notifications
const notifications = await api.listNotifications({
  limit: 20,
  status: 'DELIVERED'
});

// Register device
const device = await api.registerDevice({
  token: 'exampleToken123456789',
  platform: 'IOS',
  deviceName: 'iPhone 15'
});

// Get preferences
const preferences = await api.getPreferences();

// Update preferences
const updated = await api.updatePreferences({
  quietHoursEnabled: true,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00'
});
```

### Python

```python
from openapi_client import ApiClient, Configuration
from openapi_client.apis.notifications_api import NotificationsApi
from openapi_client.models import RegisterDeviceRequest

config = Configuration(
    api_key='YOUR_JWT_TOKEN',
    host='http://localhost:3000'
)

with ApiClient(config) as api_client:
    api = NotificationsApi(api_client)

    # List notifications
    notifications = api.list_notifications(limit=20)

    # Register device
    device_request = RegisterDeviceRequest(
        token='exampleToken123456789',
        platform='IOS',
        device_name='iPhone 15'
    )
    device = api.register_device(device_request)

    # Get preferences
    preferences = api.get_preferences()
```

## Best Practices

1. **Keep OpenAPI in sync** with actual API implementation
2. **Use operationId** for SDK generation (already included)
3. **Version your API** - increment version in openapi.yaml
4. **Document examples** - include realistic request/response examples
5. **Use schemas** - avoid duplicating type definitions
6. **Tag endpoints** - organize by functionality (already done)
7. **Test generated clients** - validate against running API
8. **Version control** - commit openapi.yaml to Git
9. **Auto-generate docs** - use CI/CD for continuous documentation
10. **Maintain backward compatibility** - deprecate carefully

## Troubleshooting

### "Failed to fetch spec from X"
- Ensure file is accessible and properly formatted
- Check CORS headers if loading from different origin
- Validate YAML syntax

### "Invalid schema definition"
- Run `swagger-cli validate docs/notifications/openapi.yaml`
- Check for missing required fields in schemas
- Verify enum values are properly quoted

### "Authorization not working"
- Ensure `securitySchemes` is properly defined
- Check that endpoints include `security` field
- Verify token format matches `bearerFormat: JWT`

### "Generated client has type errors"
- Regenerate client with latest openapi-generator-cli
- Check for circular schema references
- Validate all schema properties have types

## Resources

- **Swagger Editor**: https://editor.swagger.io/
- **OpenAPI Spec**: https://spec.openapis.org/oas/v3.0.3
- **Swagger UI**: https://github.com/swagger-api/swagger-ui
- **ReDoc**: https://github.com/Redocly/redoc
- **OpenAPI Generator**: https://openapi-generator.tech/

## Support

For issues or questions about the OpenAPI specification:

1. Check the `openapi.yaml` file for errors
2. Run validation tools: `swagger-cli validate`
3. Compare with working examples in this guide
4. Check GitHub issues: https://github.com/roman/massava/issues
5. Contact the development team

---

**Last Updated**: 2025-01-15
**OpenAPI Version**: 3.0.3
**API Version**: 1.0.0
