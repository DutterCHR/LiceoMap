package com.liceomap.app.data.demo

import com.liceomap.app.data.repository.*
import com.liceomap.app.model.*

class DemoScheduleRepository : ScheduleRepository {
    override suspend fun loadSchedule(course: String): Schedule = Schedule(course,
        (1..5).flatMap { day ->
            listOf(
                Lesson(day, "08:00", "09:30", "Matemática", "Sala A-101"),
                Lesson(day, "09:45", "11:15", "Lengua y Literatura", "Sala A-101"),
                Lesson(day, "11:30", "13:00", "Historia", "Sala A-102"),
            )
        }
    )
}
class DemoAnnouncementsRepository : AnnouncementsRepository {
    override suspend fun loadAnnouncements() = listOf(
        Announcement("demo-library", "Un espacio para descubrir historias",
            "Ejemplo de comunicado: la biblioteca invita a compartir recomendaciones de lectura. Este aviso no corresponde a una actividad oficial.",
            "Biblioteca", 1791543600000L),
        Announcement("demo-community", "Construyamos nuestra comunidad",
            "Ejemplo de comunicado de convivencia: escucha, respeto y colaboración en cada sala. Todos los contenidos de esta versión son ficticios.",
            "Convivencia", 1791457200000L),
        Announcement("demo-schedule", "Tu semana, más organizada",
            "El horario disponible permite explorar las pantallas. Las asignaturas, horas y salas son de demostración; espera la publicación del horario oficial.",
            "Académico", 1791370800000L),
    )
}
