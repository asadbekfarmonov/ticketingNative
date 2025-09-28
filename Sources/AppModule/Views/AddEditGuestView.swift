import SwiftUI

struct AddEditGuestView: View {
    enum Mode {
        case add
        case edit(Guest)

        var title: String {
            switch self {
            case .add: return "Add Guest"
            case .edit: return "Edit Guest"
            }
        }
    }

    var mode: Mode
    var onSave: (String) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var name: String = ""
    @State private var showDuplicateAlert = false

    init(mode: Mode, onSave: @escaping (String) -> Void) {
        self.mode = mode
        self.onSave = onSave
        if case let .edit(guest) = mode {
            _name = State(initialValue: guest.fullName)
        }
    }

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("Full Name")) {
                    TextField("Full Name", text: $name)
                        .textInputAutocapitalization(.words)
                }
            }
            .navigationTitle(mode.title)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        let normalized = name.trimmingCharacters(in: .whitespacesAndNewlines)
                        guard !normalized.isEmpty else { return }
                        onSave(normalized)
                        dismiss()
                    }
                    .disabled(name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
            }
        }
    }
}
