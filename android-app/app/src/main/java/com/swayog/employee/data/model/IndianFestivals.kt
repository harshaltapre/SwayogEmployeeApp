package com.swayog.employee.data.model

/**
 * Represents an Indian public holiday or cultural festival.
 *
 * Ported from the web dashboard's `src/lib/festivals.ts`.
 * No network call is required — this is static, local data.
 *
 * @property id     Stable unique identifier (matches web counterpart).
 * @property name   Display name shown on calendar cards.
 * @property date   Date string in "yyyy-MM-dd" format.
 * @property type   Either "holiday" (national/gazetted) or "festival" (cultural).
 */
data class Festival(
    val id: String,
    val name: String,
    val date: String,          // "yyyy-MM-dd"
    val type: String           // "holiday" | "festival"
)

/**
 * 2026 Indian public holidays and major festivals.
 * Matches INDIAN_FESTIVALS_2026 in the web dashboard's festivals.ts exactly.
 */
val INDIAN_FESTIVALS_2026: List<Festival> = listOf(
    Festival("f1",  "New Year's Day",       "2026-01-01", "holiday"),
    Festival("f2",  "Makar Sankranti",      "2026-01-14", "festival"),
    Festival("f3",  "Republic Day",         "2026-01-26", "holiday"),
    Festival("f4",  "Maha Shivaratri",      "2026-02-15", "festival"),
    Festival("f5",  "Holi",                 "2026-03-04", "festival"),
    Festival("f6",  "Gudi Padwa",           "2026-03-19", "festival"),
    Festival("f7",  "Ram Navami",           "2026-03-27", "festival"),
    Festival("f8",  "Eid-ul-Fitr",          "2026-03-20", "festival"),
    Festival("f9",  "Dr. Ambedkar Jayanti", "2026-04-14", "holiday"),
    Festival("f10", "Buddha Purnima",       "2026-05-01", "festival"),
    Festival("f11", "Independence Day",     "2026-08-15", "holiday"),
    Festival("f12", "Raksha Bandhan",       "2026-08-28", "festival"),
    Festival("f13", "Janmashtami",          "2026-09-04", "festival"),
    Festival("f14", "Ganesh Chaturthi",     "2026-09-14", "festival"),
    Festival("f15", "Gandhi Jayanti",       "2026-10-02", "holiday"),
    Festival("f16", "Dussehra",             "2026-10-20", "festival"),
    Festival("f17", "Diwali",               "2026-11-08", "festival"),
    Festival("f18", "Guru Nanak Jayanti",   "2026-11-24", "festival"),
    Festival("f19", "Christmas Day",        "2026-12-25", "holiday")
)
