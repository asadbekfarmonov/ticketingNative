import Foundation
import Combine

@MainActor
final class GuestsViewModel: ObservableObject {
    @Published private(set) var guests: [Guest] = []
    @Published var sortMode: GuestSortMode = .az {
        didSet { applyFilters() }
    }
    @Published var filter: GuestFilter = .all {
        didSet { applyFilters() }
    }
    @Published var searchText: String = "" {
        didSet { applyFilters() }
    }
    @Published private(set) var filteredGuests: [Guest] = []
    @Published private(set) var totalCount: Int = 0
    @Published private(set) var enteredCount: Int = 0
    @Published private(set) var undoAvailable: Bool = false
    @Published private(set) var eventName: String = ""

    private(set) var store: GuestStore?
    private var cancellables = Set<AnyCancellable>()
    private var storeCancellable: AnyCancellable?

    func loadInitialData() async {
        store = await GuestStore()
        guests = await store?.refresh() ?? []
        await updateEventName()
        applyFilters()
        observeStoreChanges()
    }

    func refresh() async {
        guests = await store?.refresh() ?? []
        await updateEventName()
        applyFilters()
    }

    func addGuest(fullName: String) async throws {
        guard let store else { return }
        do {
            let guest = try await store.addGuest(fullName: fullName)
            guests.append(guest)
            applyFilters()
        } catch GuestStoreError.duplicate {
            throw GuestViewModelError.duplicate
        }
    }

    func updateGuest(_ guest: Guest, name: String) async throws {
        guard let store else { return }
        let normalized = NameNormalizer.normalize(name)
        if guests.contains(where: { $0.id != guest.id && NameNormalizer.normalize($0.fullName) == normalized }) {
            throw GuestViewModelError.duplicate
        }
        var updatedGuest = guest
        updatedGuest.fullName = name
        try await store.save(guest: updatedGuest)
        if let index = guests.firstIndex(where: { $0.id == guest.id }) {
            guests[index] = updatedGuest
        }
        applyFilters()
    }

    func deleteGuest(_ guest: Guest) async {
        guard let store else { return }
        _ = try? await store.deleteGuest(id: guest.id)
        guests.removeAll { $0.id == guest.id }
        undoAvailable = true
        applyFilters()
        Task { @MainActor in
            try? await Task.sleep(nanoseconds: 5_000_000_000)
            if undoAvailable {
                undoAvailable = false
            }
        }
    }

    func undoDelete() async {
        guard let store else { return }
        try? await store.undoDelete()
        guests = await store.refresh()
        undoAvailable = false
        applyFilters()
    }

    func toggleEntered(_ guest: Guest, entered: Bool) async {
        guard let store else { return }
        try? await store.toggleEntered(id: guest.id, entered: entered)
        if let index = guests.firstIndex(where: { $0.id == guest.id }) {
            guests[index].entered = entered
            guests[index].enteredAt = entered ? Date() : nil
        }
        applyFilters()
    }

    func handleImportResult(_ result: ImportResult) async {
        guests = await store?.refresh() ?? []
        applyFilters()
    }

    func stats(for guests: [Guest]) {
        totalCount = guests.count
        enteredCount = guests.filter { $0.entered }.count
    }

    private func applyFilters() {
        var working = guests

        switch filter {
        case .all:
            break
        case .entered:
            working = working.filter { $0.entered }
        case .notEntered:
            working = working.filter { !$0.entered }
        }

        if !searchText.isEmpty {
            working = working.filter { $0.fullName.localizedCaseInsensitiveContains(searchText) }
        }

        working = working.sorted(by: sortMode)
        filteredGuests = working
        stats(for: guests)
    }

    private func observeStoreChanges() {
        storeCancellable = NotificationCenter.default.publisher(for: .guestStoreDidUpdate)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] _ in
                Task { await self?.refresh() }
            }
    }

    private func updateEventName() async {
        guard let store else { return }
        let config = await store.eventConfig
        await MainActor.run {
            eventName = config.eventName
        }
    }
}

enum GuestSortMode: String, CaseIterable {
    case az = "A–Z"
    case za = "Z–A"
    case latest = "Latest"
}

enum GuestFilter: String, CaseIterable {
    case all = "All"
    case entered = "Entered"
    case notEntered = "Not Entered"
}

enum GuestViewModelError: Error {
    case duplicate
}
