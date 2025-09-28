import Foundation

struct EventConfig: Identifiable, Codable {
    var id: UUID
    var eventName: String
    var eventId: UUID
    var hmacSecret: Data
    var keyVersion: Int
    var preferredNameColumn: String?

    init(id: UUID = UUID(),
         eventName: String = "",
         eventId: UUID = UUID(),
         hmacSecret: Data = HMACSecretGenerator.generate(),
         keyVersion: Int = 1,
         preferredNameColumn: String? = nil) {
        self.id = id
        self.eventName = eventName
        self.eventId = eventId
        self.hmacSecret = hmacSecret
        self.keyVersion = keyVersion
        self.preferredNameColumn = preferredNameColumn
    }
}

enum EventConfigError: Error {
    case failedToEncodeSecret
}
