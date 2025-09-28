import SwiftUI

struct GuestRowView: View {
    enum Action {
        case toggleEntered(Bool)
        case edit
        case delete
        case createQR
    }

    let guest: Guest
    var onAction: (Action) -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Circle()
                        .fill(guest.entered ? Color(hex: "2E7D32") : Color.secondary)
                        .frame(width: 10, height: 10)
                    Text(guest.fullName)
                        .font(.body)
                        .bold()
                }
                if let code = guest.ticketCode {
                    Text("Ticket: \(code)")
                        .font(.footnote)
                        .foregroundColor(.secondary)
                }
            }
            Spacer()
            Toggle(isOn: .init(get: { guest.entered }, set: { onAction(.toggleEntered($0)) })) {
                Text("Entered")
                    .font(.footnote)
            }
            .toggleStyle(.switch)
            .labelsHidden()
        }
        .padding(.vertical, 8)
        .contextMenu {
            Button("Edit", systemImage: "square.and.pencil") {
                onAction(.edit)
            }
            Button("Delete", systemImage: "trash", role: .destructive) {
                onAction(.delete)
            }
            Button(guest.ticketCode == nil ? "Create QR" : "Reissue QR", systemImage: "qrcode") {
                onAction(.createQR)
            }
        }
        .swipeActions(edge: .trailing) {
            Button(role: .destructive) {
                onAction(.delete)
            } label: {
                Label("Delete", systemImage: "trash")
            }
            Button {
                onAction(.edit)
            } label: {
                Label("Edit", systemImage: "square.and.pencil")
            }
        }
    }
}
