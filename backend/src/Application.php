<?php
declare(strict_types=1);

namespace LiceoMap;

use Closure;
use Throwable;

final class Application
{
    public function __construct(private readonly Closure $repositoryFactory) {}

    public function handle(Request $request): Response
    {
        $requestId = bin2hex(random_bytes(12));
        $headers = ['X-Request-Id' => $requestId, 'Vary' => 'Origin'];
        try {
            if (Config::mode() === 'production' && !$request->secure) {
                throw new HttpError(426, 'HTTPS_REQUIRED', 'Se requiere HTTPS.');
            }
            if ($request->secure) {
                $headers['Strict-Transport-Security'] = 'max-age=31536000';
            }
            if ($request->origin !== null) {
                if (!in_array($request->origin, Config::origins(), true)) {
                    throw new HttpError(403, 'ORIGIN_DENIED', 'Origen no permitido.');
                }
                $headers['Access-Control-Allow-Origin'] = $request->origin;
            }
            $isHealth = in_array($request->path, ['/health/live', '/health/ready'], true);
            $isCourses = $request->path === '/api/v1/cursos';
            $match = [];
            $isCourseRoute = preg_match('#^/api/v1/cursos/([^/]+)/(anuncios|horarios)(?:/([0-9]+))?$#D', $request->path, $match) === 1;
            if (!$isHealth && !$isCourses && !$isCourseRoute) {
                throw new HttpError(404, 'NOT_FOUND', 'Ruta no encontrada.');
            }
            if ($isCourseRoute && isset($match[3]) && $match[2] !== 'anuncios') {
                throw new HttpError(404, 'NOT_FOUND', 'Ruta no encontrada.');
            }
            if ($request->method === 'OPTIONS') {
                if ($request->origin === null || !in_array($request->requestedMethod, ['GET', 'HEAD'], true)) {
                    throw new HttpError(403, 'PREFLIGHT_DENIED', 'Solicitud CORS no permitida.');
                }
                foreach (array_filter(array_map('trim', explode(',', strtolower($request->requestedHeaders)))) as $header) {
                    if (!in_array($header, ['accept', 'content-type'], true)) {
                        throw new HttpError(403, 'PREFLIGHT_DENIED', 'Cabecera CORS no permitida.');
                    }
                }
                return new Response(204, [], array_replace($headers, [
                    'Access-Control-Allow-Methods' => 'GET, HEAD',
                    'Access-Control-Allow-Headers' => 'Accept, Content-Type',
                    'Vary' => 'Origin, Access-Control-Request-Method, Access-Control-Request-Headers',
                ]));
            }
            if (!in_array($request->method, ['GET', 'HEAD'], true)) {
                $headers['Allow'] = 'GET, HEAD, OPTIONS';
                throw new HttpError(405, 'METHOD_NOT_ALLOWED', 'Método no permitido.');
            }
            if ($isHealth || $isCourses) {
                $request->parameters([]);
            }
            if ($request->path === '/health/live') {
                return new Response(200, ['status' => 'ok'], $headers);
            }
            // Validar antes de abrir una conexión.
            $course = null;
            $id = null;
            $day = null;
            $limit = 20;
            $offset = 0;
            if ($isCourseRoute) {
                $course = rawurldecode($match[1]);
                if (!preg_match('/^[A-Za-z0-9_-]{1,10}$/D', $course)) {
                    throw new HttpError(400, 'INVALID_PARAMETER', 'Identificador de curso inválido.');
                }
                if (isset($match[3])) {
                    $id = Request::integer($match[3], 1, 4294967295);
                }
                $params = $request->parameters($match[2] === 'horarios' ? ['dia'] : ($id === null ? ['limit', 'offset'] : []));
                $limit = Request::integer($params['limit'] ?? '20', 1, 100);
                $offset = Request::integer($params['offset'] ?? '0', 0, 100000);
                $day = isset($params['dia']) ? Request::integer($params['dia'], 1, 7) : null;
            }
            try {
                $repository = ($this->repositoryFactory)();
            } catch (Throwable $error) {
                throw new HttpError(503, 'SERVICE_UNAVAILABLE', 'Servicio temporalmente no disponible.');
            }
            if ($request->path === '/health/ready') {
                $repository->ready();
                return new Response(200, ['status' => 'ok'], $headers);
            }
            if ($isCourses) {
                return new Response(200, ['data' => $repository->courses(), 'meta' => ['limit' => 500]], $headers);
            }
            $repository->requireCourse($course);
            if ($match[2] === 'horarios') {
                return new Response(200, ['data' => $repository->schedule($course, $day), 'meta' => ['curso' => $course, 'dia' => $day, 'limit' => 500]], $headers);
            }
            $data = $repository->announcements($course, $limit, $offset, $id);
            if ($id !== null) {
                if ($data === []) {
                    throw new HttpError(404, 'ANNOUNCEMENT_NOT_FOUND', 'Anuncio no encontrado.');
                }
                return new Response(200, ['data' => $data[0]], $headers);
            }
            return new Response(200, ['data' => $data, 'meta' => ['curso' => $course, 'limit' => $limit, 'offset' => $offset]], $headers);
        } catch (HttpError $error) {
            return new Response($error->status, ['error' => ['code' => $error->errorCode, 'message' => $error->getMessage(), 'request_id' => $requestId]], $headers);
        } catch (Throwable $error) {
            // Nunca registrar mensajes PDO, DSN, parámetros o datos personales.
            error_log('LiceoMap failure request_id=' . $requestId . ' type=' . $error::class);
            return new Response(503, ['error' => ['code' => 'SERVICE_UNAVAILABLE', 'message' => 'Servicio temporalmente no disponible.', 'request_id' => $requestId]], $headers);
        }
    }
}
