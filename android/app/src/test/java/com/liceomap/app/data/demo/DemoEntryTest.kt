package com.liceomap.app.data.demo
import com.liceomap.app.model.DemoSession
import org.junit.Assert.*
import org.junit.Test
class DemoEntryTest {
    @Test fun demoNeedsNoCredentialsAndReturnsOnlyLocalSession() {
        val session: DemoSession = DemoEntry.enter()
        assertEquals("3° Medio A", session.course)
        assertNull(session.studentName)
    }
}
