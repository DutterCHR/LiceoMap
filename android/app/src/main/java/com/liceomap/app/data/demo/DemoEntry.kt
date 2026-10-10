package com.liceomap.app.data.demo

import com.liceomap.app.model.DemoSession

/** Demo access needs no credentials and is entirely separate from AuthenticationRepository. */
object DemoEntry {
    fun enter(): DemoSession = DemoData.session
}
