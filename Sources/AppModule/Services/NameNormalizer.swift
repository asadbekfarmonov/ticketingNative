import Foundation

enum NameNormalizer {
    static func normalize(_ name: String) -> String {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        let collapsedSpaces = trimmed.replacingOccurrences(of: "\\s+", with: " ", options: .regularExpression)
        let folding = collapsedSpaces.folding(options: [.diacriticInsensitive, .caseInsensitive], locale: .current)
        return folding.uppercased()
    }
}
