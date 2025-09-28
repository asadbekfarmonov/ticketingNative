import Foundation
import SwiftUI

@MainActor
final class ImportViewModel: ObservableObject {
    @Published var selectedURL: URL?
    @Published var preview: ImportPreview?
    @Published var configuration = ImportConfiguration()
    @Published var isImporting = false
    @Published var importSummary: ImportResult?
    @Published var errorMessage: String?

    private var service: GuestImportService?
    private var qrService: QRCodeService?

    func configure(with store: GuestStore) {
        service = GuestImportService(store: store)
        qrService = QRCodeService(store: store)
    }

    func handleFileSelection(url: URL) async {
        selectedURL = url
        guard let service = service else { return }
        do {
            preview = try await service.preview(for: url, column: configuration.selectedColumn)
            errorMessage = nil
            importSummary = nil
        } catch {
            errorMessage = "Couldn't read this file. Try another sheet/column or export as CSV."
        }
    }

    func runImport() async {
        guard let url = selectedURL, let service = service else { return }
        isImporting = true
        defer { isImporting = false }
        do {
            let result = try await service.importGuests(from: url, configuration: configuration)
            importSummary = result
            if configuration.generateQR, let qrService {
                for guest in result.added {
                    _ = try? await qrService.generateTicket(for: guest)
                }
            }
        } catch {
            errorMessage = "Import failed."
        }
    }
}
