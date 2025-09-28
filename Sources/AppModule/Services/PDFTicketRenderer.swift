import Foundation
import UIKit

final class PDFTicketRenderer {
    func renderTicket(eventName: String, guest: Guest, ticket: QRTicket, image: UIImage) throws -> URL {
        let format = UIGraphicsPDFRendererFormat()
        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792)
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)
        let data = renderer.pdfData { context in
            context.beginPage()
            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.preferredFont(forTextStyle: .largeTitle)
            ]
            let nameAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.preferredFont(forTextStyle: .title1)
            ]
            let codeAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.preferredFont(forTextStyle: .subheadline),
                .foregroundColor: UIColor.secondaryLabel
            ]

            let inset: CGFloat = 48
            eventName.draw(at: CGPoint(x: inset, y: inset), withAttributes: titleAttributes)
            guest.fullName.draw(at: CGPoint(x: inset, y: inset + 60), withAttributes: nameAttributes)
            "Ticket #\(ticket.code)".draw(at: CGPoint(x: inset, y: inset + 110), withAttributes: codeAttributes)

            let qrSize: CGFloat = 240
            let qrRect = CGRect(x: (pageRect.width - qrSize) / 2, y: inset + 160, width: qrSize, height: qrSize)
            image.draw(in: qrRect)

            let note = "Show this QR at the entrance"
            let noteAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.preferredFont(forTextStyle: .footnote),
                .foregroundColor: UIColor.secondaryLabel
            ]
            let noteSize = note.size(withAttributes: noteAttributes)
            note.draw(at: CGPoint(x: (pageRect.width - noteSize.width) / 2, y: qrRect.maxY + 24), withAttributes: noteAttributes)
        }

        let fileURL = FileManager.default.temporaryDirectory.appendingPathComponent("Ticket-\(ticket.code).pdf")
        try data.write(to: fileURL)
        return fileURL
    }
}
