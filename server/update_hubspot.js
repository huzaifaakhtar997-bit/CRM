const fs = require('fs');
const path = './src/services/hubspot-sync.service.ts';
let code = fs.readFileSync(path, 'utf8');

code = code.replace(
  'import { AppError } from "../types/auth.types";',
  'import { AppError } from "../types/auth.types";\nimport { decryptToken } from "../utils/encryption";'
);

code = code.replace(
  /const connection = await this\.syncRepo\.findActiveConnection\(\);\n    if \(!connection \|\| connection\.status !== "CONNECTED" \|\| !connection\.accessToken\) \{\n      throw new AppError\("HubSpot integration is not connected\. Setup connection first\.", 404\);\n    \}/g,
  `const connection = await this.syncRepo.findActiveConnection();
    if (!connection || connection.status !== "CONNECTED" || !connection.accessToken) {
      throw new AppError("HubSpot integration is not connected. Setup connection first.", 404);
    }
    const token = decryptToken(connection.accessToken);`
);

code = code.replace(/hubspotClient\.([a-zA-Z0-9_]+)\(\s*connection\.accessToken/g, 'hubspotClient.$1(token');

fs.writeFileSync(path, code);
