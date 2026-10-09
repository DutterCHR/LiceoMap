package com.liceomap.app.data.repository

import com.liceomap.app.model.Announcement

interface AnnouncementsRepository {
    suspend fun loadAnnouncements(): List<Announcement>
}
