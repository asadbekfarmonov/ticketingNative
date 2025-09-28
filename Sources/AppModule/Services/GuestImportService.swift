import Foundation
import CoreXLSX
import UniformTypeIdentifiers

struct ImportPreview: Identifiable {
    let id = UUID()
    let names: [String]
    let totalCount: Int
    let duplicateCount: Int
}

struct ImportResult {
    let added: [Guest]
    let skipped: [Guest]
}

enum ImportError: Error {
    case unsupportedType
    case unreadableFile
    case noNameColumn
}

struct ImportConfiguration {
    var normalizeNames: Bool = true
    var generateQR: Bool = false
    var selectedColumn: String?
}

final class GuestImportService {
    private let store: GuestStore

    init(store: GuestStore) {
        self.store = store
    }

    func preview(for url: URL, column: String? = nil) async throws -> ImportPreview {
        let names = try await readNames(from: url, column: column)
        let normalized = names.map { NameNormalizer.normalize($0) }
        let existing = await store.refresh()
        let existingNormalized = Set(existing.map { NameNormalizer.normalize($0.fullName) })
        let duplicates = normalized.filter { existingNormalized.contains($0) }
        let uniqueNames = names.filter { !duplicates.contains(NameNormalizer.normalize($0)) }
        let previewNames = Array(uniqueNames.prefix(10))
        return ImportPreview(names: previewNames, totalCount: names.count, duplicateCount: duplicates.count)
    }

    func importGuests(from url: URL, configuration: ImportConfiguration) async throws -> ImportResult {
        let names = try await readNames(from: url, column: configuration.selectedColumn)
        let preparedGuests = names.map { name -> Guest in
            let normalized = configuration.normalizeNames ? name.trimmingCharacters(in: .whitespacesAndNewlines) : name
            return Guest(fullName: normalized)
        }

        let result = try await store.addOrMerge(preparedGuests)
        return ImportResult(added: result.added, skipped: result.skipped)
    }

    private func readNames(from url: URL, column: String?) async throws -> [String] {
        if url.pathExtension.lowercased() == "csv" {
            return try await readCSV(url: url)
        } else if url.pathExtension.lowercased() == "xlsx" {
            return try await readXLSX(url: url, column: column)
        } else {
            throw ImportError.unsupportedType
        }
    }

    private func readCSV(url: URL) async throws -> [String] {
        guard let string = try? String(contentsOf: url, encoding: .utf8) else {
            throw ImportError.unreadableFile
        }
        let rows = string.components(separatedBy: CharacterSet.newlines)
        return rows.compactMap { row in
            let trimmed = row.trimmingCharacters(in: .whitespaces)
            return trimmed.isEmpty ? nil : trimmed
        }
    }

    private func readXLSX(url: URL, column: String?) async throws -> [String] {
        guard let file = XLSXFile(filepath: url.path) else {
            throw ImportError.unreadableFile
        }
        var names: [String] = []
        for wbk in try file.parseWorkbooks() {
            for (name, path) in try file.parseWorksheetPathsAndNames(workbook: wbk) {
                let worksheet = try file.parseWorksheet(at: path)
                let sharedStrings = try file.parseSharedStrings()
                let columnName = column ?? "A"
                for row in worksheet.data?.rows ?? [] {
                    if let cell = row.cells.first(where: { $0.reference.column == ColumnReference(columnName) }) {
                        if let value = cell.stringValue(sharedStrings) {
                            names.append(value)
                        }
                    }
                }
                if !names.isEmpty { return names }
            }
        }
        return names
    }
}
