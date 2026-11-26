/** Throws if a server-only module is ever bundled into the browser. */
export function assertServer(moduleName: string) {
  if (typeof window !== "undefined") {
    throw new Error(`${moduleName} is server-only and must not be imported by client code.`);
  }
}
