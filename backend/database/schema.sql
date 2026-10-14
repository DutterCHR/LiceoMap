-- Derivado de database/database.sql: solo DDL, sin DROP, USE, usuarios ni datos.
-- Aplicar únicamente a una base vacía con bin/console.php init-schema.

CREATE TABLE roles (
    id_rol INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE usuarios (
    id_usuario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    rut VARCHAR(12) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(50) NOT NULL,
    apellido VARCHAR(50) NOT NULL,
    email VARCHAR(100) NULL UNIQUE,
    id_rol INT UNSIGNED NOT NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_usuarios_rol
        FOREIGN KEY (id_rol) REFERENCES roles(id_rol)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,
    INDEX idx_usuarios_rol (id_rol),
    INDEX idx_usuarios_nombre (apellido, nombre),
    CONSTRAINT chk_usuarios_rut_no_vacio CHECK (CHAR_LENGTH(TRIM(rut)) > 0),
    CONSTRAINT chk_usuarios_nombre_no_vacio CHECK (CHAR_LENGTH(TRIM(nombre)) > 0),
    CONSTRAINT chk_usuarios_apellido_no_vacio CHECK (CHAR_LENGTH(TRIM(apellido)) > 0)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE espacios (
    id_espacio VARCHAR(20) PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('AULA', 'ADMINISTRACION', 'TALLER', 'DEPORTE', 'OTRO') NOT NULL,
    pabellon_bloque VARCHAR(5) NULL,
    piso INT NOT NULL DEFAULT 1,
    superficie_util_m2 DECIMAL(7,2) NULL,
    superficie_eje_m2 DECIMAL(7,2) NULL,
    npt DECIMAL(5,2) NULL,
    latitud DECIMAL(10,8) NULL,
    longitud DECIMAL(11,8) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_espacios_piso CHECK (piso >= 0),
    CONSTRAINT chk_espacios_superficies CHECK (
        (superficie_util_m2 IS NULL OR superficie_util_m2 >= 0) AND
        (superficie_eje_m2 IS NULL OR superficie_eje_m2 >= 0)
    ),
    CONSTRAINT chk_espacios_coordenadas CHECK (
        (latitud IS NULL AND longitud IS NULL) OR
        (latitud BETWEEN -90 AND 90 AND longitud BETWEEN -180 AND 180)
    ),
    INDEX idx_espacios_tipo (tipo),
    INDEX idx_espacios_pabellon (pabellon_bloque, piso)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE cursos (
    id_curso VARCHAR(10) PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    nivel VARCHAR(10) NULL,
    letra CHAR(1) NULL,
    id_profesor_jefe INT UNSIGNED NULL,
    id_sala_base VARCHAR(20) NULL,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_cursos_profesor_jefe
        FOREIGN KEY (id_profesor_jefe) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_cursos_sala_base
        FOREIGN KEY (id_sala_base) REFERENCES espacios(id_espacio)
        ON UPDATE CASCADE ON DELETE SET NULL,
    INDEX idx_cursos_profesor_jefe (id_profesor_jefe),
    INDEX idx_cursos_sala_base (id_sala_base)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE curso_alumno (
    id_curso VARCHAR(10) NOT NULL,
    id_alumno INT UNSIGNED NOT NULL,
    matriculado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_curso, id_alumno),
    CONSTRAINT fk_curso_alumno_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_curso_alumno_usuario
        FOREIGN KEY (id_alumno) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_curso_alumno_alumno (id_alumno)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE materias (
    id_materia INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE horarios (
    id_horario INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_curso VARCHAR(10) NOT NULL,
    id_materia INT UNSIGNED NOT NULL,
    id_profesor INT UNSIGNED NOT NULL,
    id_espacio VARCHAR(20) NOT NULL,
    dia_semana TINYINT UNSIGNED NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_horarios_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_horarios_materia
        FOREIGN KEY (id_materia) REFERENCES materias(id_materia)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_horarios_profesor
        FOREIGN KEY (id_profesor) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_horarios_espacio
        FOREIGN KEY (id_espacio) REFERENCES espacios(id_espacio)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT chk_horarios_dia CHECK (dia_semana BETWEEN 1 AND 7),
    CONSTRAINT chk_horarios_horas CHECK (hora_inicio < hora_fin),
    INDEX idx_horarios_curso_dia (id_curso, dia_semana, hora_inicio),
    INDEX idx_horarios_profesor_dia (id_profesor, dia_semana, hora_inicio),
    INDEX idx_horarios_espacio_dia (id_espacio, dia_semana, hora_inicio)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE anuncios (
    id_anuncio INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_curso VARCHAR(10) NOT NULL,
    id_autor INT UNSIGNED NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    contenido TEXT NOT NULL,
    publicado BOOLEAN NOT NULL DEFAULT TRUE,
    fecha_publicacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_anuncios_curso
        FOREIGN KEY (id_curso) REFERENCES cursos(id_curso)
        ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_anuncios_autor
        FOREIGN KEY (id_autor) REFERENCES usuarios(id_usuario)
        ON UPDATE CASCADE ON DELETE RESTRICT,
    INDEX idx_anuncios_curso_fecha (id_curso, fecha_publicacion),
    INDEX idx_anuncios_autor (id_autor)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE rampas_accesibilidad (
    id_rampa INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    id_espacio VARCHAR(20) NULL,
    ubicacion_descripcion VARCHAR(100) NOT NULL,
    largo_metros DECIMAL(5,2) NOT NULL,
    pendiente_porcentaje DECIMAL(5,2) NOT NULL,
    activa BOOLEAN NOT NULL DEFAULT TRUE,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rampas_espacio
        FOREIGN KEY (id_espacio) REFERENCES espacios(id_espacio)
        ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT chk_rampas_largo CHECK (largo_metros > 0),
    CONSTRAINT chk_rampas_pendiente CHECK (pendiente_porcentaje >= 0),
    INDEX idx_rampas_espacio (id_espacio)
) ENGINE = InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
