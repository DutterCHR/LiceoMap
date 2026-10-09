package com.liceomap.app.data.demo

import com.liceomap.app.model.DemoSession

sealed interface DemoEntryResult {
    data object MissingFields : DemoEntryResult
    data class Entered(val session: DemoSession) : DemoEntryResult
}

/** Preserves the prototype's blank-field check; it does not validate credentials or RUT. */
object DemoEntry {
    fun enter(rut: String, password: String): DemoEntryResult =
        if (rut.isBlank() || password.isBlank()) {
            DemoEntryResult.MissingFields
        } else {
            DemoEntryResult.Entered(DemoData.session)
        }
}
