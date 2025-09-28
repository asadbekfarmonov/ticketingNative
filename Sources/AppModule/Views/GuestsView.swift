import SwiftUI
import UIKit

struct GuestsView: View {
    @EnvironmentObject private var viewModel: GuestsViewModel
    @State private var showingAddSheet = false
    @State private var selectedGuest: Guest?
    @State private var showSettings = false
    @State private var ticketPreview: TicketPreviewData?

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                summaryChips
                controlRow
                guestList
            }
            .padding(.horizontal, 16)
            .padding(.top, 16)
            .navigationTitle("Guests")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showSettings = true }) {
                        Image(systemName: "gearshape")
                    }
                }
            }
            .sheet(isPresented: $showingAddSheet) {
                AddEditGuestView(mode: selectedGuest == nil ? .add : .edit(selectedGuest!)) { name in
                    Task {
                        if let guest = selectedGuest {
                            try? await viewModel.updateGuest(guest, name: name)
                        } else {
                            try? await viewModel.addGuest(fullName: name)
                        }
                        selectedGuest = nil
                    }
                }
            }
            .sheet(isPresented: $showSettings) {
                SettingsView()
            }
            .sheet(item: $ticketPreview) { data in
                TicketPreviewView(guest: data.guest, ticket: data.ticket, image: data.image) { url in
                    saveTicket(url: url)
                }
            }
            .overlay(alignment: .bottomTrailing) {
                Button(action: {
                    selectedGuest = nil
                    showingAddSheet = true
                }) {
                    Label("Add Guest", systemImage: "plus")
                        .font(.headline)
                        .padding()
                        .background(Color(hex: "1E88E5"))
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                        .shadow(radius: 4)
                }
                .padding(24)
            }
            .overlay(alignment: .bottom) {
                if viewModel.undoAvailable {
                    HStack {
                        Text("Guest deleted")
                            .foregroundColor(.white)
                        Spacer()
                        Button("Undo") {
                            Task { await viewModel.undoDelete() }
                        }
                        .foregroundColor(.white)
                        .bold()
                    }
                    .padding()
                    .background(Color.black.opacity(0.8))
                    .cornerRadius(16)
                    .padding(.horizontal, 32)
                    .padding(.bottom, 40)
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                }
            }
        }
    }

    private var summaryChips: some View {
        HStack(spacing: 12) {
            SummaryChip(title: "Total", value: viewModel.totalCount)
            SummaryChip(title: "Entered", value: viewModel.enteredCount, color: Color(hex: "2E7D32"))
            SummaryChip(title: "Not Entered", value: viewModel.totalCount - viewModel.enteredCount)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    private var controlRow: some View {
        VStack(spacing: 8) {
            TextField("Search guests…", text: $viewModel.searchText)
                .textFieldStyle(.roundedBorder)
                .textInputAutocapitalization(.words)
                .disableAutocorrection(true)
            Picker("Sort", selection: $viewModel.sortMode) {
                ForEach(GuestSortMode.allCases, id: \.self) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)

            Picker("Filter", selection: $viewModel.filter) {
                ForEach(GuestFilter.allCases, id: \.self) { filter in
                    Text(filter.rawValue).tag(filter)
                }
            }
            .pickerStyle(.segmented)
        }
    }

    private var guestList: some View {
        Group {
            if viewModel.filteredGuests.isEmpty {
                VStack(spacing: 16) {
                    Image(systemName: "person.crop.circle.badge.questionmark")
                        .font(.system(size: 64))
                        .foregroundColor(.secondary)
                    Text("No guests yet")
                        .font(.title2)
                        .bold()
                    Text("Import from Excel or add manually")
                        .foregroundColor(.secondary)
                    Button("Import Guests") {}
                        .buttonStyle(.borderedProminent)
                    Button("Add Guest") {
                        selectedGuest = nil
                        showingAddSheet = true
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .padding(.top, 40)
            } else {
                List {
                    ForEach(viewModel.filteredGuests) { guest in
                        GuestRowView(guest: guest) { action in
                            handleAction(action, for: guest)
                        }
                        .listRowBackground(Color.clear)
                    }
                }
                .listStyle(.plain)
            }
        }
    }

    private func handleAction(_ action: GuestRowView.Action, for guest: Guest) {
        switch action {
        case .toggleEntered(let entered):
            Task { await viewModel.toggleEntered(guest, entered: entered) }
        case .edit:
            selectedGuest = guest
            showingAddSheet = true
        case .delete:
            Task { await viewModel.deleteGuest(guest) }
        case .createQR:
            Task {
                await generateTicket(for: guest)
            }
        }
    }

    private func generateTicket(for guest: Guest) async {
        guard let store = viewModel.store else { return }
        let qrService = QRCodeService(store: store)
        if let ticket = try? await qrService.generateTicket(for: guest),
           let image = qrService.makeImage(from: ticket.qrString) {
            await MainActor.run {
                ticketPreview = TicketPreviewData(guest: guest, ticket: ticket, image: image)
            }
        }
    }

    private func saveTicket(url: URL) {
        Task { @MainActor in
            let controller = UIActivityViewController(activityItems: [url], applicationActivities: nil)
            guard let scene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
                  let root = scene.windows.first?.rootViewController else { return }
            root.present(controller, animated: true)
        }
    }
}

struct SummaryChip: View {
    let title: String
    let value: Int
    var color: Color = .accentColor

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.footnote)
                .foregroundColor(.secondary)
            Text("\(value)")
                .font(.headline)
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color(.secondarySystemBackground))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(color.opacity(0.4), lineWidth: 1)
                )
        )
    }
}

struct TicketPreviewData: Identifiable {
    let id = UUID()
    let guest: Guest
    let ticket: QRTicket
    let image: UIImage
}
