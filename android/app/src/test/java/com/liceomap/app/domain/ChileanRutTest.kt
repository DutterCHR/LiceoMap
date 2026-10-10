package com.liceomap.app.domain
import org.junit.Assert.*
import org.junit.Test
class ChileanRutTest {
    @Test fun validatesAndNormalizesDotsAndWhitespace() {
        assertEquals(RutValidation.Valid("12345678-5"), ChileanRut.validate(" 12.345.678-5 "))
        assertEquals(RutValidation.Valid("12345678-5"), ChileanRut.validate("12345678-5"))
    }
    @Test fun rejectsIncorrectDigitMalformedAndEmptyInput() {
        assertEquals(RutValidation.InvalidCheckDigit, ChileanRut.validate("12345678-9"))
        assertEquals(RutValidation.Empty, ChileanRut.validate(" "))
        listOf("abc", "0-0", "12..345678-5", "123456789-0", "12-3-4").forEach {
            assertEquals(RutValidation.InvalidFormat, ChileanRut.validate(it))
        }
    }
    @Test fun supportsKAndZeroCheckDigits() {
        assertEquals(RutValidation.Valid("6-K"), ChileanRut.validate("6-k"))
        assertEquals(RutValidation.Valid("14-0"), ChileanRut.validate("14-0"))
    }
}
