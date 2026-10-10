package com.liceomap.app.data.repository

import android.content.Context
import androidx.core.content.edit
import com.liceomap.app.ui.theme.ThemeMode

/** Only a visual preference is persisted. Never sessions, passwords or credentials. */
class ThemePreferences(context: Context) {
    private val preferences = context.getSharedPreferences("visual_preferences", Context.MODE_PRIVATE)
    fun read(): ThemeMode = ThemeMode.entries.firstOrNull { it.name == preferences.getString("theme", null) } ?: ThemeMode.SYSTEM
    fun write(mode: ThemeMode) { preferences.edit { putString("theme", mode.name) } }
}
