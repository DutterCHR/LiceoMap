# LiceoMap 🗺️

Plataforma móvil y web de navegación interactiva y gestión de horarios para la comunidad educativa del **Liceo Bicentenario de Excelencia Antonio Varas de la Barra**.

---

## 📁 Estructura del Repositorio

* `android/`: Proyecto de la aplicación nativa Android (Java).
* `database/`: Scripts SQL para la base de datos MariaDB (`colegio_db`).
* `design/`: Recursos gráficos, mapa de referencia e insumos vectoriales SVG (Inkscape).
* `docs/`: Documentación oficial, definición de roles (`01-equipo.md`) y documentos del proyecto.
* `web/`: Portal web institucional y visor interactivo (HTML/CSS).
* `backend/`: API PHP/PDO de lectura para web y Android; [ejecución local, pruebas y despliegue](backend/README.md).

---

## 🚀 Flujo de Trabajo

Para mantener la organización del repositorio, todo el equipo debe seguir estas reglas:

1. **Nunca trabajar directamente sobre la rama `main`.**
2. Crear una rama por cada funcionalidad o tarea nueva desde su *fork*:
   `git checkout -b feature/nombre-de-la-tarea`
3. Probar los cambios localmente antes de hacer commit.
4. Crear un **Pull Request (PR)** hacia la rama principal del proyecto para revisión.

---

## 🛠️ Tecnologías

* **Base de Datos:** MariaDB / MySQL (`colegio_db`).
* **Móvil:** Android Nativo (Java).
* **Cartografía:** SVG vectorial diseñado en Inkscape.
* **Web:** HTML5 / CSS3.

---

## 👥 Equipo de Desarrollo
Consulte el archivo [`docs/01-equipo.md`](docs/01-equipo.md) para conocer la nómina oficial, roles y responsabilidades del equipo.
