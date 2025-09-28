import SwiftUI
import UIKit

struct SettingsView: View {
    @EnvironmentObject private var guestsViewModel: GuestsViewModel
    @State private var eventName: String = ""
    @State private var showSecret = false
    @State private var secretText: String = ""
    @State private var showClearConfirmation = false

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Event")) {
                    TextField("Event Name", text: $eventName)
                    Button("Regenerate Secret", role: .destructive) {
                        Task { await regenerateSecret() }
                    }
                    Button(showSecret ? "Hide Secret" : "Show Secret") {
                        showSecret.toggle()
                    }
                    if showSecret {
                        Text(secretText)
                            .font(.footnote)
                            .textSelection(.enabled)
                    }
                }

                Section(header: Text("Data Management")) {
                    Button("Export Guests (CSV)") {
                        Task { await exportGuests() }
                    }
                    Button("Clear All Data", role: .destructive) {
                        showClearConfirmation = true
                    }
                }

                Section(header: Text("About")) {
                    Text("Version 1.0")
                    Text("All data is stored locally and works offline.")
                        .font(.footnote)
                }
            }
            .navigationTitle("Settings")
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .task {
                await loadValues()
            }
            .onChange(of: eventName) { newValue in
                Task {
                    await updateEventName(newValue)
                }
            }
            .alert("Clear all data?", isPresented: $showClearConfirmation) {
                Button("Cancel", role: .cancel) {}
                Button("Clear", role: .destructive) {
                    Task { await clearData() }
                }
            }
        }
    }

    @Environment(\.dismiss) private var dismiss

    private func loadValues() async {
        guard let store = guestsViewModel.store else { return }
        let config = await store.eventConfig
        await MainActor.run {
            eventName = config.eventName
            secretText = config.hmacSecret.base64EncodedString()
        }
    }

    private func regenerateSecret() async {
        guard let store = guestsViewModel.store else { return }
        try? await store.updateEventConfig { config in
            config.hmacSecret = HMACSecretGenerator.generate()
            config.keyVersion += 1
        }
        await loadValues()
    }

    private func clearData() async {
        guard let store = guestsViewModel.store else { return }
        try? await store.replaceAll(with: [])
        await guestsViewModel.refresh()
    }

    private func updateEventName(_ name: String) async {
        guard let store = guestsViewModel.store else { return }
        try? await store.updateEventConfig { config in
            config.eventName = name
        }
    }

    private func exportGuests() async {
        guard let store = guestsViewModel.store else { return }
        let guests = await store.refresh()
        let csv = guests.map { $0.fullName }.joined(separator: "\n")
        let url = FileManager.default.temporaryDirectory.appendingPathComponent("Guests.csv")
        try? csv.write(to: url, atomically: true, encoding: .utf8)
        await presentShareSheet(with: url)
    }

    @MainActor
    private func presentShareSheet(with url: URL) async {
        let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
        guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let root = scene.windows.first?.rootViewController else { return }
        root.present(controller, animated: true)
    }
}
