/**
 * Health check del contenedor del frontend. Fuera de /api porque Nginx envía
 * /api/* al backend.
 */
export function GET() {
  return Response.json({ status: 'ok', service: 'nexus-frontend', timestamp: new Date().toISOString() });
}
