package com.liceomap.app.ui.components

import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import java.util.TimeZone

val SchoolDays = listOf("Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo")

fun schoolDate(millis: Long): String =
    SimpleDateFormat("EEE d 'de' MMM", Locale.forLanguageTag("es-CL")).apply {
        timeZone = TimeZone.getTimeZone("America/Santiago")
    }.format(Date(millis))
