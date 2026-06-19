package com.example.swayogemployeeapp.data.repository

import android.content.Context
import com.example.swayogemployeeapp.data.local.AppDatabase
import com.example.swayogemployeeapp.data.local.entity.OutboxQueueEntity
import com.example.swayogemployeeapp.data.local.entity.SiteSurveyEntity
import com.example.swayogemployeeapp.data.sync.SyncManager
import kotlinx.coroutines.flow.Flow

class SurveyRepository(private val context: Context) {
    private val db = AppDatabase.getDatabase(context)

    fun getAllSurveys(): Flow<List<SiteSurveyEntity>> = db.siteSurveyDao().getAllSurveysFlow()

    fun getSurveyForTask(taskId: Int): Flow<SiteSurveyEntity?> = db.siteSurveyDao().getSurveyForTaskFlow(taskId)

    suspend fun submitSurvey(
        taskId: Int,
        customerId: String,
        roofType: String,
        lengthFt: Double,
        widthFt: Double,
        obstacleNotes: String,
        shadowFactorsJson: String,
        recommendedCapacity: Double,
        latitude: Double,
        longitude: Double,
        localPhotoPaths: List<String>
    ): Long {
        val pathsString = localPhotoPaths.joinToString(",")
        val survey = SiteSurveyEntity(
            taskId = taskId,
            customerId = customerId,
            roofType = roofType,
            lengthFt = lengthFt,
            widthFt = widthFt,
            obstacleNotes = obstacleNotes,
            shadowFactors = shadowFactorsJson,
            recommendedCapacityKw = recommendedCapacity,
            coordinatesLatitude = latitude,
            coordinatesLongitude = longitude,
            localPhotoPaths = pathsString,
            isSynced = false
        )
        val localId = db.siteSurveyDao().insert(survey)

        // Queue in Outbox
        val payload = "$taskId|||$customerId|||$roofType|||$lengthFt|||$widthFt|||$obstacleNotes|||$shadowFactorsJson|||$recommendedCapacity|||$latitude|||$longitude"
        val outbox = OutboxQueueEntity(
            actionType = "SURVEY",
            endpoint = "api/v1/employee/surveys",
            payloadJson = payload,
            localAttachmentPaths = pathsString
        )
        db.outboxQueueDao().enqueue(outbox)

        SyncManager.enqueueSync(context)
        return localId
    }
}
