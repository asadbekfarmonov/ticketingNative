import SwiftUI
import UIKit

struct TicketPreviewView: View {
    let guest: Guest
    let ticket: QRTicket
    let image: UIImage
    let onShare: (URL) -> Void
    @EnvironmentObject private var guestsViewModel: GuestsViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var isSharing = false
    @State private var shareURL: URL?

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Text(guestsViewModel.eventName.isEmpty ? "Event" : guestsViewModel.eventName)
                    .font(.title)
                    .bold()
                Text(guest.fullName)
                    .font(.largeTitle)
                    .bold()
                Text("Ticket #\(ticket.code)")
                    .font(.headline)
                    .foregroundColor(.secondary)
                Image(uiImage: image)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(width: 240, height: 240)
                    .background(Color(.systemBackground))
                    .cornerRadius(16)
                Text("Show this QR at the entrance")
                    .font(.footnote)
                    .foregroundColor(.secondary)
                Spacer()
                HStack(spacing: 12) {
                    Button(action: share) {
                        Label("Share", systemImage: "square.and.arrow.up")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    Button(action: savePDF) {
                        Label("Save", systemImage: "tray.and.arrow.down")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.bordered)
                }
            }
            .padding(24)
            .navigationTitle("Ticket")
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .sheet(isPresented: $isSharing, onDismiss: { shareURL = nil }) {
                if let shareURL {
                    ActivityView(activityItems: [shareURL])
                }
            }
        }
    }

    private func share() {
        guard let url = try? PDFTicketRenderer().renderTicket(eventName: guestsViewModel.eventName, guest: guest, ticket: ticket, image: image) else { return }
        shareURL = url
        isSharing = true
    }

    private func savePDF() {
        guard let url = try? PDFTicketRenderer().renderTicket(eventName: guestsViewModel.eventName, guest: guest, ticket: ticket, image: image) else { return }
        onShare(url)
    }
}

struct ActivityView: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: activityItems, applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
