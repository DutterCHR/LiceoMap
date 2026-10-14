-- Índice aditivo compatible con MariaDB y MySQL. Ejecutar con el migrador CLI.
CREATE INDEX idx_anuncios_publicos ON anuncios (id_curso, publicado, fecha_publicacion, id_anuncio);
