-- Exclusivamente ficticio. El usuario TEST-ONLY se genera en integration.php.
INSERT INTO espacios (id_espacio, nombre, tipo) VALUES ('TEST_ROOM', 'Sala de prueba', 'AULA');
INSERT INTO cursos (id_curso, nombre, activo) VALUES
    ('T1', 'Curso de prueba uno', 1), ('T2', 'Curso de prueba dos', 1), ('OFF', 'Curso inactivo', 0);
INSERT INTO materias (id_materia, nombre) VALUES (1, 'Materia ficticia');
INSERT INTO horarios (id_curso, id_materia, id_profesor, id_espacio, dia_semana, hora_inicio, hora_fin) VALUES
    ('T1', 1, 1, 'TEST_ROOM', 1, '08:00', '09:00'),
    ('T1', 1, 1, 'TEST_ROOM', 2, '09:00', '10:00'),
    ('T2', 1, 1, 'TEST_ROOM', 1, '10:00', '11:00');
INSERT INTO anuncios (id_anuncio, id_curso, id_autor, titulo, contenido, publicado, fecha_publicacion) VALUES
    (1, 'T1', 1, 'Primer anuncio ficticio', 'Contenido de prueba con acentos: orientación.', 1, '2020-01-01 12:00:00'),
    (2, 'T1', 1, 'Segundo anuncio ficticio', 'Texto plano: <script>ejemplo</script>', 1, '2020-01-02 12:00:00'),
    (3, 'T1', 1, 'Borrador', 'No público', 0, '2020-01-03 12:00:00'),
    (4, 'T1', 1, 'Futuro', 'No público todavía', 1, '2099-01-01 12:00:00'),
    (5, 'T2', 1, 'Otro curso', 'Contenido ficticio de otro curso', 1, '2020-01-01 12:00:00'),
    (6, 'OFF', 1, 'Curso inactivo', 'No público', 1, '2020-01-01 12:00:00');
