package com.liceomap.app.data.demo

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class DemoEntryTest {
    @Test
    fun blankRutDoesNotEnterDemo() {
        assertEquals(DemoEntryResult.MissingFields, DemoEntry.enter("", "password"))
        assertEquals(DemoEntryResult.MissingFields, DemoEntry.enter(" \t\n", "password"))
    }

    @Test
    fun blankPasswordDoesNotEnterDemo() {
        assertEquals(DemoEntryResult.MissingFields, DemoEntry.enter("12345678-9", ""))
        assertEquals(DemoEntryResult.MissingFields, DemoEntry.enter("12345678-9", " \t\n"))
    }

    @Test
    fun bothFieldsBlankDoNotEnterDemo() {
        assertEquals(DemoEntryResult.MissingFields, DemoEntry.enter("", ""))
    }

    @Test
    fun anyNonBlankInputEntersOnlyDemoWithoutValidatingIdentity() {
        val result = DemoEntry.enter("not-a-real-rut", "not-a-real-password")
        assertTrue(result is DemoEntryResult.Entered)
        assertEquals("3° Medio A", (result as DemoEntryResult.Entered).session.course)
    }
}
