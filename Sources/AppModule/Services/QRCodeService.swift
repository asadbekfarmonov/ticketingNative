import Foundation
import CryptoKit
import CoreImage.CIFilterBuiltins
import SwiftUI

struct QRTicket {
    let payload: String
    let signature: String
    let code: String
    let issuedAt: Date
    var qrString: String {
        "\(payload).\(signature)"
    }
}

enum QRServiceError: Error {
    case encodingFailure
    case signatureMismatch
    case guestNotFound
}

final class QRCodeService {
    private let context = CIContext()
    private let filter = CIFilter.qrCodeGenerator()
    private let store: GuestStore

    init(store: GuestStore) {
        self.store = store
    }

    func generateTicket(for guest: Guest) async throws -> QRTicket {
        let config = await store.eventConfig
        let issuedAt = Date()
        let header = TicketHeader(algorithm: "HS256", keyVersion: config.keyVersion)
        let ticketCode = TicketCodeGenerator.generate()
        let payload = TicketPayload(gid: guest.id, e: config.eventId, iat: issuedAt, n: guest.fullName, tc: ticketCode)
        let encodedHeader = try encodeJSON(header)
        let encodedPayload = try encodeJSON(payload)
        let signingInput = "\(encodedHeader).\(encodedPayload)"
        let signature = sign(input: signingInput, secret: config.hmacSecret)
        let combinedPayload = signingInput
        let ticket = QRTicket(payload: combinedPayload, signature: signature, code: ticketCode, issuedAt: issuedAt)
        try await store.updateTicket(for: guest.id, ticketCode: ticketCode, payload: combinedPayload, signature: signature, issuedAt: issuedAt)
        return ticket
    }

    func verify(_ qrString: String) async throws -> Guest {
        let components = qrString.components(separatedBy: ".")
        guard components.count >= 3 else { throw QRServiceError.signatureMismatch }
        let header = components[0]
        let payload = components[1]
        let signature = components[2]
        let signingInput = "\(header).\(payload)"
        let headerData = try decodeBase64(header)
        let payloadData = try decodeBase64(payload)
        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .secondsSince1970
        let headerModel = try decoder.decode(TicketHeader.self, from: headerData)
        var config = await store.eventConfig
        guard headerModel.algorithm == "HS256" else { throw QRServiceError.signatureMismatch }
        let secret = config.hmacSecret
        let expectedSignature = sign(input: signingInput, secret: secret)
        guard expectedSignature == signature else { throw QRServiceError.signatureMismatch }
        let payloadModel = try decoder.decode(TicketPayload.self, from: payloadData)
        guard let guest = await store.guest(by: payloadModel.gid) else { throw QRServiceError.guestNotFound }
        return guest
    }

    func makeImage(from string: String) -> UIImage? {
        filter.setValue(Data(string.utf8), forKey: "inputMessage")
        guard let outputImage = filter.outputImage else { return nil }
        let scaled = outputImage.transformed(by: CGAffineTransform(scaleX: 12, y: 12))
        guard let cgImage = context.createCGImage(scaled, from: scaled.extent) else { return nil }
        return UIImage(cgImage: cgImage)
    }

    private func sign(input: String, secret: Data) -> String {
        let key = SymmetricKey(data: secret)
        let signature = HMAC<SHA256>.authenticationCode(for: Data(input.utf8), using: key)
        return Data(signature).base64URLEncodedString()
    }

    private func encodeJSON<T: Encodable>(_ value: T) throws -> String {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .secondsSince1970
        let data = try encoder.encode(value)
        return data.base64URLEncodedString()
    }

    private func decodeBase64(_ string: String) throws -> Data {
        guard let data = Data(base64URLEncoded: string) else { throw QRServiceError.signatureMismatch }
        return data
    }
}

struct TicketHeader: Codable {
    let algorithm: String
    let keyVersion: Int

    enum CodingKeys: String, CodingKey {
        case algorithm = "alg"
        case keyVersion = "k"
    }
}

struct TicketPayload: Codable {
    let gid: UUID
    let e: UUID
    let iat: Date
    let exp: Date?
    let n: String
    let tc: String

    init(gid: UUID, e: UUID, iat: Date, exp: Date? = nil, n: String, tc: String) {
        self.gid = gid
        self.e = e
        self.iat = iat
        self.exp = exp
        self.n = n
        self.tc = tc
    }
}

enum TicketCodeGenerator {
    static func generate() -> String {
        let letters = Array("ABCDEFGHJKLMNPQRSTUVWXYZ23456789")
        return String((0..<6).map { _ in letters.randomElement()! })
    }
}
