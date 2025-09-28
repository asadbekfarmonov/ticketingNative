import Foundation

actor GuestStore {
    private let guestsURL: URL
    private let configURL: URL
    private let decoder = JSONDecoder()
    private let encoder = JSONEncoder()

    private(set) var guests: [Guest] = []
    private(set) var eventConfig: EventConfig
    private var undoStack: [Guest]

    init() async {
        let directory = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first ?? FileManager.default.temporaryDirectory
        guestsURL = directory.appendingPathComponent("guests.json")
        configURL = directory.appendingPathComponent("eventConfig.json")
        encoder.outputFormatting = [.prettyPrinted]

        if let data = try? Data(contentsOf: configURL), let config = try? decoder.decode(EventConfig.self, from: data) {
            eventConfig = config
        } else {
            eventConfig = EventConfig()
            try? persistConfig()
        }

        if let data = try? Data(contentsOf: guestsURL), let guests = try? decoder.decode([Guest].self, from: data) {
            self.guests = guests
        }

        undoStack = []
    }

    func refresh() -> [Guest] {
        guests
    }

    func save(guest: Guest) async throws {
        if let index = guests.firstIndex(where: { $0.id == guest.id }) {
            guests[index] = guest
        } else {
            guests.append(guest)
        }
        try persistGuests()
        notifyChange()
    }

    func addGuest(fullName: String) async throws -> Guest {
        let normalized = NameNormalizer.normalize(fullName)
        if guests.contains(where: { NameNormalizer.normalize($0.fullName) == normalized }) {
            throw GuestStoreError.duplicate
        }
        let guest = Guest(fullName: fullName)
        guests.append(guest)
        try persistGuests()
        notifyChange()
        return guest
    }

    func deleteGuest(id: UUID) async throws -> Guest? {
        guard let index = guests.firstIndex(where: { $0.id == id }) else { return nil }
        let removed = guests.remove(at: index)
        undoStack.append(removed)
        try persistGuests()
        notifyChange()
        return removed
    }

    func undoDelete() async throws {
        guard let guest = undoStack.popLast() else { return }
        guests.append(guest)
        try persistGuests()
        notifyChange()
    }

    func toggleEntered(id: UUID, entered: Bool) async throws {
        guard let index = guests.firstIndex(where: { $0.id == id }) else { return }
        guests[index].entered = entered
        guests[index].enteredAt = entered ? Date() : nil
        try persistGuests()
        notifyChange()
    }

    func updateEventConfig(_ update: (inout EventConfig) -> Void) async throws {
        update(&eventConfig)
        try persistConfig()
        notifyChange()
    }

    func replaceAll(with newGuests: [Guest]) async throws {
        guests = newGuests
        try persistGuests()
        notifyChange()
    }

    func addOrMerge(_ newGuests: [Guest]) async throws -> (added: [Guest], skipped: [Guest]) {
        var added: [Guest] = []
        var skipped: [Guest] = []

        for guest in newGuests {
            let normalized = NameNormalizer.normalize(guest.fullName)
            if guests.contains(where: { NameNormalizer.normalize($0.fullName) == normalized }) {
                skipped.append(guest)
            } else {
                guests.append(guest)
                added.append(guest)
            }
        }

        if !added.isEmpty {
            try persistGuests()
            notifyChange()
        }

        return (added, skipped)
    }

    func updateTicket(for guestId: UUID, ticketCode: String, payload: String, signature: String, issuedAt: Date) async throws {
        guard let index = guests.firstIndex(where: { $0.id == guestId }) else { return }
        guests[index].ticketCode = ticketCode
        guests[index].qrPayload = payload
        guests[index].qrSignature = signature
        guests[index].qrIssuedAt = issuedAt
        try persistGuests()
    }

    func guest(forTicketCode code: String) -> Guest? {
        guests.first { $0.ticketCode == code }
    }

    func guest(by id: UUID) -> Guest? {
        guests.first { $0.id == id }
    }

    func persistGuests() throws {
        let data = try encoder.encode(guests)
        try data.write(to: guestsURL, options: .atomic)
    }

    func persistConfig() throws {
        let data = try encoder.encode(eventConfig)
        try data.write(to: configURL, options: .atomic)
    }

    private func notifyChange() {
        Task { @MainActor in
            NotificationCenter.default.post(name: .guestStoreDidUpdate, object: nil)
        }
    }
}

enum GuestStoreError: Error {
    case duplicate
}

extension Notification.Name {
    static let guestStoreDidUpdate = Notification.Name("GuestStoreDidUpdate")
}
