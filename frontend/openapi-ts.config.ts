/**
 * @file Configuration for the openapi-ts client generator.
 * This file defines how the TypeScript client is generated from the openapi.json schema.
 * It specifies input/output paths, the client library to use, and customizes method naming.
 */

import { defineConfig } from "@hey-api/openapi-ts"
// @ts-ignore
import type { IOperationObject, Operation } from "@hey-api/openapi-ts"

/**
 * @file Configuration for the openapi-ts client generator.
 * This file defines how the TypeScript client is generated from the openapi.json schema.
 */
// noinspection JSUnusedGlobalSymbols
export default defineConfig({
  client: "legacy/axios",
  input: "./openapi.json",
  output: "./src/client",
  // exportSchemas: true,
  plugins: [
    {
      name: "@hey-api/sdk",
      // NOTE: this doesn't allow tree-shaking
      asClass: false,
      operationId: true,

      /**
       * Builds a clean method name for an API operation.
       * It removes the service prefix and converts the name to camelCase.
       * For example, "Users-read_user_me" becomes "readUserMe".
       * @param operation The operation object from the OpenAPI schema.
       * @returns The formatted, camel-cased method name.
       */
      methodNameBuilder: (operation: IOperationObject | Operation): string => {
        let name: string = operation.name
        const service: string = operation.service
        if (service && name.toLowerCase().startsWith(service.toLowerCase())) {
          name = name.slice(service.length)
        }
        return name.charAt(0).toLowerCase() + name.slice(1)
      },
    },
  ],
})
