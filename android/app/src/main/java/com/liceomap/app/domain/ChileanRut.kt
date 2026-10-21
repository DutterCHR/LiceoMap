package com.liceomap.app.domain

sealed interface RutValidation {
    data object Empty : RutValidation
    data object InvalidFormat : RutValidation
    data object InvalidCheckDigit : RutValidation
    data class Valid(val normalized: String) : RutValidation
}

/** Local syntax and modulo-11 validation; this never authenticates a student. */
object ChileanRut {
    fun validate(input: String): RutValidation {
        val rut = input.trim().uppercase()
        if (rut.isEmpty()) return RutValidation.Empty
        if (!Regex("(?:[1-9][0-9]{0,7}|[1-9][0-9]?\\.[0-9]{3}\\.[0-9]{3})-[0-9K]").matches(rut)) {
            return RutValidation.InvalidFormat
        }
        val body = rut.substringBefore("-").replace(".", "")
        var multiplier = 2
        val sum = body.reversed().sumOf { char ->
            val product = char.digitToInt() * multiplier
            multiplier = if (multiplier == 7) 2 else multiplier + 1
            product
        }
        val expected = when (val remainder = 11 - sum % 11) {
            11 -> '0'
            10 -> 'K'
            else -> remainder.digitToChar()
        }
        return if (rut.last() == expected) RutValidation.Valid("$body-$expected")
            else RutValidation.InvalidCheckDigit
    }
}
