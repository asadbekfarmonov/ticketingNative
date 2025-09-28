import SwiftUI

@main
struct GuestListApp: App {
    @StateObject private var guestsViewModel = GuestsViewModel()
    @StateObject private var importViewModel = ImportViewModel()
    @StateObject private var scanViewModel = ScanViewModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(guestsViewModel)
                .environmentObject(importViewModel)
                .environmentObject(scanViewModel)
                .task {
                    await guestsViewModel.loadInitialData()
                    if let store = guestsViewModel.store {
                        importViewModel.configure(with: store)
                        await scanViewModel.configure(with: store)
                    }
                }
        }
    }
}

struct RootView: View {
    @EnvironmentObject private var guestsViewModel: GuestsViewModel
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            GuestsView()
                .tabItem {
                    Label("Guests", systemImage: "person.3")
                }
                .tag(0)

            ImportView()
                .tabItem {
                    Label("Import", systemImage: "square.and.arrow.down")
                }
                .tag(1)

            ScanView()
                .tabItem {
                    Label("Scan", systemImage: "qrcode.viewfinder")
                }
                .tag(2)
        }
        .environmentObject(guestsViewModel)
    }
}
