package com.swayog.employee.presentation.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.model.Notification
import com.swayog.employee.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    private val _notificationsState = MutableStateFlow<NotificationsState>(NotificationsState.Initial)
    val notificationsState: StateFlow<NotificationsState> = _notificationsState.asStateFlow()

    private val _notifications = MutableStateFlow<List<Notification>>(emptyList())
    val notifications: StateFlow<List<Notification>> = _notifications.asStateFlow()

    private val _unreadCount = MutableStateFlow(0)
    val unreadCount: StateFlow<Int> = _unreadCount.asStateFlow()

    init {
        loadNotifications()
        loadUnreadCount()
    }

    fun loadNotifications() {
        viewModelScope.launch {
            _notificationsState.value = NotificationsState.Loading
            notificationRepository.getNotifications()
                .onSuccess { notifications ->
                    _notifications.value = notifications
                    _notificationsState.value = NotificationsState.Success
                }
                .onFailure { error ->
                    _notificationsState.value = NotificationsState.Error(error.message ?: "Failed to load notifications")
                }
        }
    }

    fun loadUnreadCount() {
        viewModelScope.launch {
            notificationRepository.getUnreadCount()
                .onSuccess { count ->
                    _unreadCount.value = count
                }
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            notificationRepository.markAsRead(notificationId)
                .onSuccess {
                    // Update local state
                    _notifications.value = _notifications.value.map { notif ->
                        if (notif.id == notificationId) notif.copy(isRead = true) else notif
                    }
                    loadUnreadCount()
                }
        }
    }

    fun markAllAsRead() {
        viewModelScope.launch {
            val unreadNotifications = _notifications.value.filter { !it.isRead }
            unreadNotifications.forEach { notification ->
                notificationRepository.markAsRead(notification.id)
            }
            _notifications.value = _notifications.value.map { it.copy(isRead = true) }
            _unreadCount.value = 0
        }
    }
}

sealed class NotificationsState {
    object Initial : NotificationsState()
    object Loading : NotificationsState()
    object Success : NotificationsState()
    data class Error(val message: String) : NotificationsState()
}
