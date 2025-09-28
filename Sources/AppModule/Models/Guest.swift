import Foundation

struct Guest: Identifiable, Codable, Hashable {
    var id: UUID
    var fullName: String
    var createdAt: Date
    var entered: Bool
    var enteredAt: Date?
    var ticketCode: String?
    var qrPayload: String?
    var qrSignature: String?
    var qrIssuedAt: Date?

    init(id: UUID = UUID(),
         fullName: String,
         createdAt: Date = Date(),
         entered: Bool = false,
         enteredAt: Date? = nil,
         ticketCode: String? = nil,
         qrPayload: String? = nil,
         qrSignature: String? = nil,
         qrIssuedAt: Date? = nil) {
        self.id = id
        self.fullName = fullName
        self.createdAt = createdAt
        self.entered = entered
        self.enteredAt = enteredAt
        self.ticketCode = ticketCode
        self.qrPayload = qrPayload
        self.qrSignature = qrSignature
        self.qrIssuedAt = qrIssuedAt
    }

    var statusDotColor: GuestStatusColor {
        entered ? .entered : .notEntered
    }
}

enum GuestStatusColor {
    case entered
    case notEntered
}

extension Array where Element == Guest {
    func sorted(by mode: GuestSortMode) -> [Guest] {
        switch mode {
        case .az:
            return sorted { $0.fullName.localizedCaseInsensitiveCompare($1.fullName) == .orderedAscending }
        case .za:
            return sorted { $0.fullName.localizedCaseInsensitiveCompare($1.fullName) == .orderedDescending }
        case .latest:
            return sorted { $0.createdAt > $1.createdAt }
        }
    }
}
