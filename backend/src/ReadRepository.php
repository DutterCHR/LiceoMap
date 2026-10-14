<?php
declare(strict_types=1);

namespace LiceoMap;

use PDO;

final class ReadRepository
{
    public function __construct(private readonly PDO $pdo) {}

    public function ready(): void
    {
        // Comprueba también las columnas usadas, sin devolver datos ni versiones.
        $this->pdo->query('SELECT c.id_curso, c.nombre, c.nivel, c.letra, c.activo,
            a.id_anuncio, a.titulo, a.contenido, a.publicado, a.fecha_publicacion,
            h.id_horario, h.dia_semana, h.hora_inicio, h.hora_fin,
            m.nombre, m.activo, e.nombre, e.activo
            FROM cursos c LEFT JOIN anuncios a ON a.id_curso = c.id_curso
            LEFT JOIN horarios h ON h.id_curso = c.id_curso
            LEFT JOIN materias m ON m.id_materia = h.id_materia
            LEFT JOIN espacios e ON e.id_espacio = h.id_espacio WHERE 1 = 0');
    }

    public function courses(): array
    {
        return $this->pdo->query('SELECT id_curso, nombre, nivel, letra FROM cursos
            WHERE activo = 1 ORDER BY id_curso LIMIT 500')->fetchAll();
    }

    public function requireCourse(string $course): void
    {
        $stmt = $this->pdo->prepare('SELECT id_curso FROM cursos WHERE id_curso = :curso AND activo = 1');
        $stmt->execute(['curso' => $course]);
        if (!$stmt->fetch()) {
            throw new HttpError(404, 'COURSE_NOT_FOUND', 'Curso no encontrado.');
        }
    }

    public function announcements(string $course, int $limit, int $offset, ?int $id = null): array
    {
        $sql = 'SELECT id_anuncio, id_curso, titulo, contenido,
            DATE_FORMAT(fecha_publicacion, \'%Y-%m-%dT%H:%i:%sZ\') AS fecha_publicacion
            FROM anuncios WHERE id_curso = :curso AND publicado = 1 AND fecha_publicacion <= UTC_TIMESTAMP()';
        if ($id !== null) {
            $sql .= ' AND id_anuncio = :id';
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY fecha_publicacion DESC, id_anuncio DESC LIMIT :limite OFFSET :desplazamiento');
        $stmt->bindValue(':curso', $course);
        $stmt->bindValue(':limite', $limit, PDO::PARAM_INT);
        $stmt->bindValue(':desplazamiento', $offset, PDO::PARAM_INT);
        if ($id !== null) {
            $stmt->bindValue(':id', $id, PDO::PARAM_INT);
        }
        $stmt->execute();
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            $row['id_anuncio'] = (int) $row['id_anuncio'];
        }
        return $rows;
    }

    public function schedule(string $course, ?int $day): array
    {
        $sql = 'SELECT h.id_horario, h.id_curso, h.dia_semana, h.hora_inicio, h.hora_fin,
            m.id_materia, m.nombre AS materia, e.id_espacio, e.nombre AS espacio
            FROM horarios h JOIN materias m ON m.id_materia = h.id_materia AND m.activo = 1
            JOIN espacios e ON e.id_espacio = h.id_espacio AND e.activo = 1 WHERE h.id_curso = :curso';
        $params = ['curso' => $course];
        if ($day !== null) {
            $sql .= ' AND h.dia_semana = :dia';
            $params['dia'] = $day;
        }
        $stmt = $this->pdo->prepare($sql . ' ORDER BY h.dia_semana, h.hora_inicio, h.id_horario LIMIT 500');
        $stmt->execute($params);
        $rows = $stmt->fetchAll();
        foreach ($rows as &$row) {
            foreach (['id_horario', 'id_materia', 'dia_semana'] as $key) {
                $row[$key] = (int) $row[$key];
            }
        }
        return $rows;
    }
}
