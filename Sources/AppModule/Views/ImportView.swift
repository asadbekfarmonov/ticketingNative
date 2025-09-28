import SwiftUI
import UniformTypeIdentifiers
import UIKit

struct ImportView: View {
    @EnvironmentObject private var viewModel: ImportViewModel
    @EnvironmentObject private var guestsViewModel: GuestsViewModel
    @State private var showingDocumentPicker = false

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    Text("Import")
                        .font(.largeTitle)
                        .bold()
                        .frame(maxWidth: .infinity, alignment: .leading)

                    Button(action: { showingDocumentPicker = true }) {
                        Label("Select File", systemImage: "square.and.arrow.down")
                            .font(.headline)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color(hex: "1E88E5"))
                            .foregroundColor(.white)
                            .cornerRadius(16)
                    }

                    Toggle("Normalize names", isOn: $viewModel.configuration.normalizeNames)
                    Toggle("Generate QR for new guests", isOn: $viewModel.configuration.generateQR)

                    if let preview = viewModel.preview {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Preview")
                                .font(.headline)
                            Text("Total rows: \(preview.totalCount)")
                            Text("Duplicates skipped: \(preview.duplicateCount)")
                            Divider()
                            ForEach(preview.names, id: \.self) { name in
                                Text(name)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                            }
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
                    }

                    if let summary = viewModel.importSummary {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Import Summary")
                                .font(.headline)
                            Text("Added: \(summary.added.count)")
                            Text("Skipped duplicates: \(summary.skipped.count)")
                        }
                        .padding()
                        .background(RoundedRectangle(cornerRadius: 16).fill(Color(.secondarySystemBackground)))
                    }

                    if let error = viewModel.errorMessage {
                        Text(error)
                            .foregroundColor(Color(hex: "C62828"))
                    }

                    Button("Import Guests") {
                        Task {
                            await viewModel.runImport()
                            await guestsViewModel.refresh()
                        }
                    }
                    .disabled(viewModel.selectedURL == nil)
                    .buttonStyle(.borderedProminent)
                }
                .padding(16)
            }
            .sheet(isPresented: $showingDocumentPicker) {
                DocumentPicker { url in
                    if let url {
                        Task {
                            await viewModel.handleFileSelection(url: url)
                            await guestsViewModel.refresh()
                        }
                    }
                }
            }
            .onAppear {
                Task {
                    if let store = guestsViewModel.store {
                        viewModel.configure(with: store)
                    }
                }
            }
        }
    }
}

struct DocumentPicker: UIViewControllerRepresentable {
    var completion: (URL?) -> Void

    func makeUIViewController(context: Context) -> UIDocumentPickerViewController {
        let types: [UTType] = [UTType(filenameExtension: "xlsx")!, .commaSeparatedText]
        let controller = UIDocumentPickerViewController(forOpeningContentTypes: types, asCopy: true)
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ uiViewController: UIDocumentPickerViewController, context: Context) {}

    func makeCoordinator() -> Coordinator {
        Coordinator(completion: completion)
    }

    final class Coordinator: NSObject, UIDocumentPickerDelegate {
        let completion: (URL?) -> Void

        init(completion: @escaping (URL?) -> Void) {
            self.completion = completion
        }

        func documentPicker(_ controller: UIDocumentPickerViewController, didPickDocumentsAt urls: [URL]) {
            completion(urls.first)
        }

        func documentPickerWasCancelled(_ controller: UIDocumentPickerViewController) {
            completion(nil)
        }
    }
}
