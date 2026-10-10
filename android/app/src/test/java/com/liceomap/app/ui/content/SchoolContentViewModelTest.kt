package com.liceomap.app.ui.content

import com.liceomap.app.data.demo.*
import com.liceomap.app.data.repository.*
import com.liceomap.app.model.*
import kotlinx.coroutines.*
import org.junit.Assert.*
import org.junit.Test

class SchoolContentViewModelTest {
    @Test fun startsLoadingThenLoadsSharedDemoSources() {
        val vm = SchoolContentViewModel(dispatcher = Dispatchers.Unconfined)
        assertEquals(LoadState.Loading, vm.uiState.value.schedule)
        vm.load("3° Medio A")
        val schedule = (vm.uiState.value.schedule as LoadState.Ready).data
        assertEquals("3° Medio A", schedule.course)
        assertEquals(15, schedule.lessons.size)
        val news = (vm.uiState.value.announcements as LoadState.Ready).data
        assertEquals(3, news.size)
        assertTrue(news.zipWithNext().all { (a, b) -> a.publishedAt >= b.publishedAt })
    }
    @Test fun scheduleFailureDoesNotHideAnnouncementsAndRetryRecovers() {
        var fail = true
        val repo = object : ScheduleRepository {
            override suspend fun loadSchedule(course: String): Schedule {
                if (fail) error("offline")
                return Schedule(course, emptyList())
            }
        }
        val vm = SchoolContentViewModel(repo, DemoAnnouncementsRepository(), Dispatchers.Unconfined)
        vm.load("A")
        assertTrue(vm.uiState.value.schedule is LoadState.Error)
        assertTrue(vm.uiState.value.announcements is LoadState.Ready)
        fail = false
        vm.load("A")
        assertTrue(vm.uiState.value.schedule is LoadState.Ready)
    }
    @Test fun emptyAnnouncementsAreSuccessfulContent() {
        val repo = object : AnnouncementsRepository {
            override suspend fun loadAnnouncements() = emptyList<Announcement>()
        }
        val vm = SchoolContentViewModel(DemoScheduleRepository(), repo, Dispatchers.Unconfined)
        vm.load("A")
        assertEquals(emptyList<Announcement>(), (vm.uiState.value.announcements as LoadState.Ready).data)
    }
}
