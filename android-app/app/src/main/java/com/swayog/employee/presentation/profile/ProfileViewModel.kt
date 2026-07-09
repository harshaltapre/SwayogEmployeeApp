package com.swayog.employee.presentation.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.swayog.employee.data.local.dao.UserDao
import com.swayog.employee.data.local.entity.UserEntity
import com.swayog.employee.data.local.preferences.DataStoreManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProfileViewModel @Inject constructor(
    private val dataStoreManager: DataStoreManager,
    private val userDao: UserDao
) : ViewModel() {

    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser: StateFlow<UserEntity?> = _currentUser.asStateFlow()

    init {
        viewModelScope.launch {
            dataStoreManager.userId.filterNotNull().collect { id ->
                val user = userDao.getUserById(id)
                _currentUser.value = user
            }
        }
    }

    fun loadProfile() {
        viewModelScope.launch {
            dataStoreManager.userId.firstOrNull()?.let { id ->
                val user = userDao.getUserById(id)
                _currentUser.value = user
            }
        }
    }
}
